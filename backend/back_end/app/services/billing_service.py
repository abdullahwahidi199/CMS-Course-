from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from ..models import Enrollment, EnrollmentBillingProfile, FeePlan, Invoice, Notification, Payment, StudentLedgerEntry
from .notification_service import notify_admins, send_notification


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
    if enrollment.batch_id:
        batch_plan = FeePlan.objects.filter(
            tenant=enrollment.tenant,
            batch=enrollment.batch,
            is_active=True,
        ).order_by("-created_at").first()
        if batch_plan:
            return batch_plan

    if not enrollment.course_id:
        return None

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


def profile_values_from_plan(plan):
    return {
        "fee_plan": plan,
        "fee_plan_name": str(plan),
        "monthly_fee": money(plan.monthly_fee),
        "registration_fee": money(plan.registration_fee),
        "material_fee": money(plan.material_fee),
        "exam_fee": money(plan.exam_fee),
        "discount_allowed": money(plan.discount_allowed),
        "currency": plan.currency,
        "billing_cycle": plan.billing_cycle,
        "due_day": plan.due_day,
        "late_fee_amount": money(plan.late_fee_amount),
        "grace_period_days": plan.grace_period_days,
    }


def sync_billing_profile_to_current_plan(profile):
    plan = resolve_fee_plan(profile.enrollment)
    if not plan:
        return profile, False

    values = profile_values_from_plan(plan)
    changed = False
    for field, value in values.items():
        current = getattr(profile, field)
        if field == "fee_plan":
            if current_id := getattr(current, "id", None):
                if current_id == value.id:
                    continue
            elif not value:
                continue
        elif current == value:
            continue
        setattr(profile, field, value)
        changed = True

    if changed:
        profile.save(update_fields=[*values.keys(), "updated_at"])
    return profile, changed


def get_or_create_billing_profile(enrollment, user=None):
    profile = getattr(enrollment, "billing_profile", None)
    if profile:
        profile, _ = sync_billing_profile_to_current_plan(profile)
        return profile
    plan = resolve_fee_plan(enrollment)
    if not plan:
        return None
    return EnrollmentBillingProfile.objects.create(
        tenant=enrollment.tenant,
        enrollment=enrollment,
        **profile_values_from_plan(plan),
        billing_start_date=enrollment.enrollment_date or timezone.localdate(),
        created_by=user,
    )


def discount_for(profile, base_amount):
    if not profile or profile.discount_type == EnrollmentBillingProfile.DiscountType.NONE:
        return Decimal("0.00")
    amount = money(profile.discount_amount)
    if profile.discount_type == EnrollmentBillingProfile.DiscountType.PERCENTAGE:
        amount = (base_amount * amount / Decimal("100")).quantize(Decimal("0.01"))
    allowed = money(profile.discount_allowed)
    return min(amount, allowed) if allowed > 0 else amount


def due_date_for(profile, month, year, due_date=None):
    if due_date:
        return due_date
    day = min(int(profile.due_day or 5), monthrange(year, month)[1])
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
    monthly_fee = money(profile.monthly_fee)
    one_time = Decimal("0.00")
    has_prior_invoice = (
        Invoice.objects.filter(enrollment=profile.enrollment)
        .exclude(billing_month=month, billing_year=year)
        .exists()
    )
    if not has_prior_invoice:
        one_time = money(profile.registration_fee)
    base = monthly_fee + one_time + money(profile.material_fee) + money(profile.exam_fee)
    discount = discount_for(profile, base)
    previous = Decimal("0.00")
    today = timezone.localdate()
    late_fee = Decimal("0.00")
    planned_due = due_date_for(profile, month, year)
    if today > planned_due and (today - planned_due).days > int(profile.grace_period_days or 0):
        late_fee = money(profile.late_fee_amount)
    total = base - discount + late_fee
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


def should_skip_invoice_for_cycle(profile, month, year):
    if profile.billing_cycle != FeePlan.BillingCycle.BATCH:
        return False
    return (
        Invoice.objects.filter(enrollment=profile.enrollment)
        .exclude(billing_month=month, billing_year=year)
        .exclude(status=Invoice.Status.CANCELLED)
        .exists()
    )


def update_unpaid_invoice_totals(invoice, totals, due_date, user=None):
    if invoice.status == Invoice.Status.CANCELLED or money(invoice.paid_amount) > 0:
        return False

    old_final = money(invoice.final_amount)
    new_final = money(totals["final_amount"])
    changed = (
        old_final != new_final
        or money(invoice.balance) != money(totals["balance"])
        or money(invoice.monthly_fee) != money(totals["monthly_fee"])
        or money(invoice.amount) != money(totals["amount"])
        or money(invoice.discount) != money(totals["discount"])
        or money(invoice.late_fee) != money(totals["late_fee"])
        or money(invoice.previous_balance) != money(totals["previous_balance"])
        or invoice.due_date != due_date
    )
    if not changed:
        return False

    invoice.monthly_fee = totals["monthly_fee"]
    invoice.amount = totals["amount"]
    invoice.discount = totals["discount"]
    invoice.previous_balance = totals["previous_balance"]
    invoice.late_fee = totals["late_fee"]
    invoice.total_amount = totals["total_amount"]
    invoice.final_amount = totals["final_amount"]
    invoice.balance = totals["balance"]
    invoice.due_date = due_date
    invoice.status = Invoice.Status.PENDING if invoice.balance > 0 else Invoice.Status.PAID
    invoice.save(update_fields=[
        "monthly_fee",
        "amount",
        "discount",
        "previous_balance",
        "late_fee",
        "total_amount",
        "final_amount",
        "balance",
        "due_date",
        "status",
        "updated_at",
    ])

    difference = new_final - old_final
    if difference > 0:
        write_ledger_entry(
            tenant=invoice.tenant,
            student=invoice.student,
            invoice=invoice,
            transaction_type=StudentLedgerEntry.TransactionType.INVOICE_UPDATED,
            description=f"Invoice {invoice.invoice_number} updated",
            debit=difference,
            reference_number=invoice.invoice_number,
            user=user,
        )
    elif difference < 0:
        write_ledger_entry(
            tenant=invoice.tenant,
            student=invoice.student,
            invoice=invoice,
            transaction_type=StudentLedgerEntry.TransactionType.INVOICE_UPDATED,
            description=f"Invoice {invoice.invoice_number} updated",
            credit=abs(difference),
            reference_number=invoice.invoice_number,
            user=user,
        )
    return True


@transaction.atomic
def generate_invoice_for_profile(*, profile, month, year, user=None, due_date=None):
    if profile.billing_status != EnrollmentBillingProfile.Status.ACTIVE:
        return None, False
    if profile.billing_start_date and (profile.billing_start_date.year, profile.billing_start_date.month) > (year, month):
        return None, False
    if profile.billing_end_date and (profile.billing_end_date.year, profile.billing_end_date.month) < (year, month):
        return None, False
    if should_skip_invoice_for_cycle(profile, month, year):
        return None, False

    enrollment = profile.enrollment
    profile, _ = sync_billing_profile_to_current_plan(profile)
    totals = invoice_totals(profile, month, year)
    invoice_due_date = due_date_for(profile, month, year, due_date)
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
            "due_date": invoice_due_date,
            "created_by": user,
            **totals,
        },
    )
    if not created:
        updated = update_unpaid_invoice_totals(invoice, totals, invoice_due_date, user=user)
        return invoice, updated
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
        recipients = [invoice.student.user] if invoice.student_id and invoice.student.user_id else []
        send_notification(
            tenant=invoice.tenant,
            recipients=recipients,
            notification_type=Notification.NotificationType.FEE_DUE,
            title="New fee invoice",
            message=f"Invoice {invoice.invoice_number} is due on {invoice.due_date} with balance {invoice.balance}.",
            metadata={"invoice_id": invoice.id},
            created_by=user,
            dedupe_key=f"student-invoice:{invoice.id}:generated",
        )
        notify_admins(
            tenant=invoice.tenant,
            notification_type=Notification.NotificationType.FEE_DUE,
            title="Invoice generated",
            message=f"{invoice.student.name} has invoice {invoice.invoice_number} for {invoice.balance}.",
            metadata={"invoice_id": invoice.id},
            created_by=user,
            dedupe_key=f"admin-invoice:{invoice.id}:generated",
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
        billing = get_or_create_billing_profile(enrollment, user=user)
        if not billing:
            continue

        invoice_month = month or timezone.localdate().month
        invoice_year = year or timezone.localdate().year

        invoice, created = generate_invoice_for_profile(
            profile=billing,
            month=invoice_month,
            year=invoice_year,
            due_date=due_date,
            user=user,
        )
        if created:
            created_invoices.append(invoice)

    return created_invoices
@transaction.atomic
def record_payment(*, invoice, amount_paid, payment_method, received_by, notes="", reference_number="", discount_amount=0, discount_notes=""):
    invoice = Invoice.objects.select_for_update().get(pk=invoice.pk)
    amount = money(amount_paid)
    discount = money(discount_amount)
    if amount <= 0:
        raise ValueError("Payment amount must be greater than zero.")
    if discount < 0:
        raise ValueError("Discount cannot be negative.")
    if invoice.status == Invoice.Status.CANCELLED:
        raise ValueError("Payments cannot be recorded against a cancelled invoice.")
    if discount > money(invoice.balance):
        raise ValueError("Discount cannot be greater than the invoice balance.")
    if discount > 0:
        invoice.discount = money(invoice.discount) + discount
        invoice.final_amount = money(invoice.final_amount) - discount
        invoice.total_amount = invoice.final_amount
        invoice.balance = money(invoice.balance) - discount
        invoice.status = Invoice.Status.PAID if invoice.balance <= 0 else invoice.status
        invoice.save(update_fields=["discount", "final_amount", "total_amount", "balance", "status", "updated_at"])
        write_ledger_entry(
            tenant=invoice.tenant,
            student=invoice.student,
            invoice=invoice,
            transaction_type=StudentLedgerEntry.TransactionType.DISCOUNT_APPLIED,
            description=discount_notes or f"Discount applied to {invoice.invoice_number}",
            credit=discount,
            reference_number=invoice.invoice_number,
            user=received_by,
        )
    if amount > money(invoice.balance):
        raise ValueError("Payment amount cannot be greater than the invoice balance.")

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
    write_ledger_entry(
        tenant=invoice.tenant,
        student=invoice.student,
        invoice=invoice,
        payment=payment,
        transaction_type=StudentLedgerEntry.TransactionType.PAYMENT_RECEIVED if invoice.status == Invoice.Status.PAID else StudentLedgerEntry.TransactionType.PARTIAL_PAYMENT,
        description=f"Payment received for {invoice.invoice_number}",
        credit=amount,
        reference_number=payment.receipt_number,
        user=received_by,
    )
    recipients = [invoice.student.user] if invoice.student_id and invoice.student.user_id else []
    send_notification(
        tenant=invoice.tenant,
        recipients=recipients,
        notification_type=Notification.NotificationType.PAYMENT_RECEIVED,
        title="Payment received",
        message=f"Payment {payment.receipt_number} for {amount} was recorded.",
        metadata={"payment_id": payment.id, "invoice_id": invoice.id},
        created_by=received_by,
        dedupe_key=f"payment:{payment.id}:student",
    )
    notify_admins(
        tenant=invoice.tenant,
        notification_type=Notification.NotificationType.PAYMENT_RECEIVED,
        title="Payment received",
        message=f"{invoice.student.name} paid {amount} for {invoice.invoice_number}.",
        metadata={"payment_id": payment.id, "invoice_id": invoice.id},
        created_by=received_by,
        dedupe_key=f"payment:{payment.id}:admin",
    )
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
