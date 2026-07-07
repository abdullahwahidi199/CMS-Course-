from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from ..models import Enrollment, EnrollmentBillingProfile, FeePlan, Invoice, Notification, Payment, StudentLedgerEntry


def next_reference(prefix, tenant_id, model, field_name):
    today = timezone.localdate()
    base = f"{prefix}-{today:%Y%m}-{tenant_id or 0}"
    count = model.objects.filter(**{f"{field_name}__startswith": base}).count() + 1
    return f"{base}-{count:05d}"


def money(value):
    return Decimal(str(value or 0)).quantize(Decimal("0.01"))


def ledger_balance(student):
    previous = StudentLedgerEntry.objects.filter(student=student).order_by("-transaction_date", "-created_at", "-id").first()
    return money(previous.balance if previous else 0)


def write_ledger_entry(*, tenant, student, transaction_type, description, debit=0, credit=0, invoice=None, payment=None, reference_number="", user=None):
    debit = money(debit)
    credit = money(credit)
    balance = ledger_balance(student) + debit - credit
    return StudentLedgerEntry.objects.create(
        tenant=tenant,
        student=student,
        invoice=invoice,
        payment=payment,
        transaction_date=timezone.localdate(),
        transaction_type=transaction_type,
        description=description,
        debit=debit,
        credit=credit,
        balance=balance,
        reference_number=reference_number,
        created_by=user,
    )


def resolve_fee_plan(enrollment):
    batch_plan = FeePlan.objects.filter(
        tenant=enrollment.tenant,
        course=enrollment.course,
        batch=enrollment.batch,
        is_active=True,
    ).order_by("-created_at").first()
    if batch_plan:
        return batch_plan
    return FeePlan.objects.filter(
        tenant=enrollment.tenant,
        course=enrollment.course,
        batch__isnull=True,
        is_active=True,
    ).order_by("-created_at").first()


def get_or_create_billing_profile(enrollment, user=None):
    profile = getattr(enrollment, "billing_profile", None)
    if profile:
        return profile
    plan = resolve_fee_plan(enrollment)
    if not plan:
        return None
    return EnrollmentBillingProfile.objects.create(
        tenant=enrollment.tenant,
        enrollment=enrollment,
        fee_plan=plan,
        billing_start_date=enrollment.enrollment_date or timezone.localdate(),
        created_by=user,
    )


def discount_for(profile, base_amount):
    if not profile or profile.discount_type == EnrollmentBillingProfile.DiscountType.NONE:
        return Decimal("0.00")
    amount = money(profile.discount_amount)
    if profile.discount_type == EnrollmentBillingProfile.DiscountType.PERCENTAGE:
        amount = (base_amount * amount / Decimal("100")).quantize(Decimal("0.01"))
    allowed = money(profile.fee_plan.discount_allowed)
    return min(amount, allowed) if allowed > 0 else amount


def due_date_for(plan, month, year, due_date=None):
    if due_date:
        return due_date
    day = min(int(plan.due_day or 5), monthrange(year, month)[1])
    return date(year, month, day)


def previous_balance_for(enrollment, month, year):
    return (
        Invoice.objects.filter(enrollment=enrollment)
        .exclude(status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED])
        .exclude(billing_month=month, billing_year=year)
        .aggregate(total=Sum("balance"))["total"]
        or Decimal("0.00")
    )


def invoice_totals(profile, month, year):
    plan = profile.fee_plan
    monthly_fee = money(plan.monthly_fee)
    base = monthly_fee + money(plan.material_fee) + money(plan.exam_fee)
    discount = discount_for(profile, base)
    previous = money(previous_balance_for(profile.enrollment, month, year))
    today = timezone.localdate()
    late_fee = Decimal("0.00")
    planned_due = due_date_for(plan, month, year)
    if today > planned_due and (today - planned_due).days > int(plan.grace_period_days or 0):
        late_fee = money(plan.late_fee_amount)
    total = base - discount + previous + late_fee
    return {
        "monthly_fee": monthly_fee,
        "amount": base,
        "discount": discount,
        "previous_balance": previous,
        "late_fee": late_fee,
        "total_amount": total,
        "final_amount": total,
        "balance": total,
    }


@transaction.atomic
def generate_invoice_for_profile(*, profile, month, year, user=None, due_date=None):
    if profile.billing_status != EnrollmentBillingProfile.Status.ACTIVE:
        return None, False
    if profile.billing_start_date and (profile.billing_start_date.year, profile.billing_start_date.month) > (year, month):
        return None, False
    if profile.billing_end_date and (profile.billing_end_date.year, profile.billing_end_date.month) < (year, month):
        return None, False

    enrollment = profile.enrollment
    totals = invoice_totals(profile, month, year)
    invoice, created = Invoice.objects.get_or_create(
        tenant=enrollment.tenant,
        enrollment=enrollment,
        billing_month=month,
        billing_year=year,
        defaults={
            "invoice_number": next_reference("INV", enrollment.tenant_id, Invoice, "invoice_number"),
            "student": enrollment.student,
            "course": enrollment.course,
            "batch": enrollment.batch,
            "month": month,
            "year": year,
            "due_date": due_date_for(profile.fee_plan, month, year, due_date),
            "created_by": user,
            **totals,
        },
    )
    if created:
        write_ledger_entry(
            tenant=invoice.tenant,
            student=invoice.student,
            invoice=invoice,
            transaction_type=StudentLedgerEntry.TransactionType.INVOICE_GENERATED,
            description=f"{invoice.course.name if invoice.course_id else 'Course'} invoice {month:02d}/{year}",
            debit=invoice.final_amount - totals["late_fee"],
            reference_number=invoice.invoice_number,
            user=user,
        )
        if totals["late_fee"] > 0:
            write_ledger_entry(
                tenant=invoice.tenant,
                student=invoice.student,
                invoice=invoice,
                transaction_type=StudentLedgerEntry.TransactionType.LATE_FEE_ADDED,
                description=f"Late fee added to {invoice.invoice_number}",
                debit=totals["late_fee"],
                reference_number=invoice.invoice_number,
                user=user,
            )
    return invoice, created

@transaction.atomic
def generate_monthly_invoices(*, tenant, month, year, due_date=None, user=None, course=None, batch=None, student=None, enrollment=None):
    filters = {"tenant": tenant, "status": Enrollment.Status.ACTIVE, "is_archived": False}
    if course:
        filters["course_id"] = course
    if batch:
        filters["batch_id"] = batch
    if student:
        filters["student_id"] = student
    if enrollment:
        filters["id"] = enrollment

    enrollments = Enrollment.objects.filter(**filters).select_related(
        "billing_profile__fee_plan", "student", "course", "batch"
    )

    created_invoices = []
    for enrollment in enrollments:
        billing = getattr(enrollment, "billing_profile", None)
        if not billing or not billing.fee_plan:
            continue

        plan = billing.fee_plan
        invoice_month = month or timezone.localdate().month
        invoice_year = year or timezone.localdate().year

        invoice, created = Invoice.objects.get_or_create(
            tenant=tenant,
            enrollment=enrollment,
            billing_month=invoice_month,
            billing_year=invoice_year,
            defaults={
                "student": enrollment.student,
                "course": enrollment.course,
                "batch": enrollment.batch,
                "month": invoice_month,
                "year": invoice_year,
                "due_date": due_date or date(invoice_year, invoice_month, plan.due_day),
                "monthly_fee": plan.monthly_fee,
                "amount": plan.monthly_fee,
                "final_amount": plan.monthly_fee,
                "balance": plan.monthly_fee,
                "status": Invoice.Status.PENDING,
                "created_by": user,
            }
        )
        if created:
            created_invoices.append(invoice)

    return created_invoices
@transaction.atomic
def record_payment(*, invoice, amount_paid, payment_method, received_by, notes="", reference_number=""):
    amount = Decimal(str(amount_paid))
    if amount <= 0:
        raise ValueError("Payment amount must be greater than zero.")

    payment = Payment.objects.create(
        tenant=invoice.tenant,
        invoice=invoice,
        student=invoice.student,
        enrollment=invoice.enrollment,
        amount_paid=amount,
        payment_method=payment_method,
        reference_number=reference_number,
        receipt_number=next_reference("PAY", invoice.tenant_id, Payment, "receipt_number"),
        notes=notes,
        received_by=received_by,
    )

    invoice.paid_amount += amount
    invoice.balance = invoice.final_amount - invoice.paid_amount

    if invoice.balance <= 0:
        invoice.status = Invoice.Status.PAID
    elif invoice.paid_amount > 0:
        invoice.status = Invoice.Status.PARTIAL

    invoice.save(update_fields=["paid_amount", "balance", "status", "updated_at"])
    return payment
@transaction.atomic
def waive_invoice_balance(*, invoice, user, notes=""):
    invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
    if invoice.status in [Invoice.Status.PAID, Invoice.Status.CANCELLED] or invoice.balance <= 0:
        return invoice
    waived = invoice.balance
    invoice.discount = money(invoice.discount) + waived
    invoice.final_amount = money(invoice.final_amount) - waived
    invoice.total_amount = invoice.final_amount
    invoice.balance = Decimal("0.00")
    invoice.status = Invoice.Status.PAID
    invoice.save(update_fields=["discount", "final_amount", "total_amount", "balance", "status", "updated_at"])
    write_ledger_entry(
        tenant=invoice.tenant,
        student=invoice.student,
        invoice=invoice,
        transaction_type=StudentLedgerEntry.TransactionType.DISCOUNT_APPLIED,
        description=notes or f"Balance waived for {invoice.invoice_number}",
        credit=waived,
        reference_number=invoice.invoice_number,
        user=user,
    )
    return invoice


@transaction.atomic
def cancel_invoice(*, invoice, user, notes=""):
    invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
    if invoice.paid_amount > 0:
        raise ValueError("Paid invoices cannot be cancelled. Use an adjustment or refund workflow.")
    if invoice.status == Invoice.Status.CANCELLED:
        return invoice
    cancelled_balance = money(invoice.balance)
    invoice.status = Invoice.Status.CANCELLED
    invoice.balance = Decimal("0.00")
    invoice.save(update_fields=["status", "balance", "updated_at"])
    if cancelled_balance > 0:
        write_ledger_entry(
            tenant=invoice.tenant,
            student=invoice.student,
            invoice=invoice,
            transaction_type=StudentLedgerEntry.TransactionType.INVOICE_CANCELLED,
            description=notes or f"Invoice {invoice.invoice_number} cancelled",
            credit=cancelled_balance,
            reference_number=invoice.invoice_number,
            user=user,
        )
    return invoice


@transaction.atomic
def apply_invoice_discount(*, invoice, amount, user, notes="", transaction_type=StudentLedgerEntry.TransactionType.DISCOUNT_APPLIED):
    invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
    amount = min(money(amount), money(invoice.balance))
    if amount <= 0:
        return invoice
    invoice.discount = money(invoice.discount) + amount
    invoice.final_amount = money(invoice.final_amount) - amount
    invoice.total_amount = invoice.final_amount
    invoice.balance = money(invoice.balance) - amount
    invoice.status = Invoice.Status.PAID if invoice.balance <= 0 else invoice.status
    invoice.save(update_fields=["discount", "final_amount", "total_amount", "balance", "status", "updated_at"])
    write_ledger_entry(
        tenant=invoice.tenant,
        student=invoice.student,
        invoice=invoice,
        transaction_type=transaction_type,
        description=notes or f"Adjustment applied to {invoice.invoice_number}",
        credit=amount,
        reference_number=invoice.invoice_number,
        user=user,
    )
    return invoice
