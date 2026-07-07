from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Count, DecimalField, F, Q, Sum
from django.utils import timezone

from .models import (
    Assessment,
    AssessmentResult,
    Attendance,
    Classes,
    Course,
    Enrollment,
    FeePlan,
    InventoryTransaction,
    Invoice,
    Notification,
    Payment,
    Staff,
    StationeryItem,
    StationeryPurchase,
    StationeryPurchaseItem,
    StudentLedgerEntry,
    Students,
    Teachers,
)


GRADE_SCALE = (
    ("A+", Decimal("95"), Decimal("100")),
    ("A", Decimal("90"), Decimal("94.99")),
    ("B+", Decimal("85"), Decimal("89.99")),
    ("B", Decimal("80"), Decimal("84.99")),
    ("C", Decimal("70"), Decimal("79.99")),
    ("D", Decimal("60"), Decimal("69.99")),
    ("F", Decimal("0"), Decimal("59.99")),
)


def calculate_grade(percentage):
    percentage = Decimal(percentage)
    for grade, minimum, maximum in GRADE_SCALE:
        if minimum <= percentage <= maximum:
            return grade
    return "F"


def next_reference(prefix, tenant_id, model, field_name):
    today = timezone.localdate()
    base = f"{prefix}-{today:%Y%m}-{tenant_id or 0}"
    count = model.objects.filter(**{f"{field_name}__startswith": base}).count() + 1
    return f"{base}-{count:05d}"


@transaction.atomic
def save_assessment_result(*, assessment, enrollment, marks_obtained, user, remarks=""):
    marks = Decimal(str(marks_obtained))
    if marks < 0:
        raise ValueError("Marks obtained cannot be negative.")
    if marks > assessment.maximum_marks:
        raise ValueError("Marks obtained cannot exceed maximum marks.")

    student = enrollment.student
    percentage = (marks / assessment.maximum_marks * Decimal("100")).quantize(Decimal("0.01"))
    result, _ = AssessmentResult.objects.update_or_create(
        tenant=assessment.tenant,
        assessment=assessment,
        enrollment=enrollment,
        defaults={
            "student": student,
            "course": assessment.course or enrollment.course,
            "batch": assessment.batch or enrollment.batch,
            "teacher": assessment.teacher,
            "marks_obtained": marks,
            "percentage": percentage,
            "grade": calculate_grade(percentage),
            "is_passed": marks >= assessment.passing_marks,
            "remarks": remarks,
            "submitted_by": user,
            "submitted_at": timezone.now(),
            "created_by": user,
        },
    )
    return result


@transaction.atomic
def publish_assessment(assessment, user):
    assessment.status = Assessment.Status.PUBLISHED
    assessment.publish_date = timezone.now()
    assessment.save(update_fields=["status", "publish_date", "updated_at"])

    students = Students.objects.filter(enrollments__tenant=assessment.tenant, enrollments__batch=assessment.batch, enrollments__status=Enrollment.Status.ACTIVE).select_related("user").distinct()
    notifications = [
        Notification(
            tenant=assessment.tenant,
            recipient=student.user,
            notification_type=Notification.NotificationType.ASSESSMENT_PUBLISHED,
            title="Assessment result published",
            message=f"Results for {assessment.title} are now available.",
            metadata={"assessment_id": assessment.id},
            created_by=user,
        )
        for student in students
        if student.user_id
    ]
    Notification.objects.bulk_create(notifications)
    return assessment


def invoice_amounts(student, plan, discount=Decimal("0")):
    previous_balance = (
        Invoice.objects.filter(student=student)
        .exclude(status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED])
        .aggregate(total=Sum("balance"))["total"]
        or Decimal("0")
    )
    amount = plan.monthly_fee + getattr(plan, "material_fee", Decimal("0")) + getattr(plan, "exam_fee", Decimal("0"))
    discount = min(Decimal(str(discount or 0)), plan.discount_allowed)
    final_amount = amount - discount + previous_balance
    return amount, discount, previous_balance, final_amount


@transaction.atomic
def generate_monthly_invoices(*, tenant, month, year, due_date=None, user=None, course=None, batch=None, student=None, enrollment=None):
    from .services.billing_service import generate_monthly_invoices as generate

    return generate(
        tenant=tenant,
        month=month,
        year=year,
        due_date=due_date,
        user=user,
        course=course,
        batch=batch,
        student=student,
        enrollment=enrollment,
    )


@transaction.atomic
def record_payment(*, invoice, amount_paid, payment_method, received_by, notes="", reference_number=""):
    from .services.billing_service import record_payment as record

    return record(
        invoice=invoice,
        amount_paid=amount_paid,
        payment_method=payment_method,
        received_by=received_by,
        notes=notes,
        reference_number=reference_number,
    )


def refresh_invoice_statuses(tenant):
    today = timezone.localdate()
    return Invoice.objects.filter(
        tenant=tenant,
        due_date__lt=today,
        status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIAL],
    ).update(status=Invoice.Status.OVERDUE)


def refresh_stationery_status(item):
    if item.quantity <= 0:
        item.status = StationeryItem.Status.OUT_OF_STOCK
    elif item.quantity <= item.minimum_stock:
        item.status = StationeryItem.Status.LOW_STOCK
    else:
        item.status = StationeryItem.Status.IN_STOCK
    item.save(update_fields=["status", "updated_at"])
    return item


@transaction.atomic
def move_stock(*, item, transaction_type, quantity, user, unit_price=Decimal("0"), notes="", reference=""):
    qty = int(quantity)
    if qty <= 0:
        raise ValueError("Quantity must be greater than zero.")

    if transaction_type == InventoryTransaction.TransactionType.STOCK_IN:
        item.quantity += qty
    elif transaction_type in [
        InventoryTransaction.TransactionType.STOCK_OUT,
        InventoryTransaction.TransactionType.STUDENT_PURCHASE,
    ]:
        if item.quantity < qty:
            raise ValueError("Insufficient stock.")
        item.quantity -= qty
    elif transaction_type == InventoryTransaction.TransactionType.ADJUSTMENT:
        item.quantity = qty
    else:
        raise ValueError("Invalid transaction type.")

    item.save(update_fields=["quantity", "updated_at"])
    refresh_stationery_status(item)
    transaction = InventoryTransaction.objects.create(
        tenant=item.tenant,
        item=item,
        transaction_type=transaction_type,
        quantity=qty,
        unit_price=unit_price,
        notes=notes,
        reference=reference,
        created_by=user,
    )
    if item.status == StationeryItem.Status.LOW_STOCK:
        admin_users = item.tenant.users.filter(role__slug__in=["admin", "super-admin", "super_admin"]) if item.tenant_id else []
        Notification.objects.bulk_create(
            [
                Notification(
                    tenant=item.tenant,
                    recipient=admin,
                    notification_type=Notification.NotificationType.INVENTORY_LOW,
                    title="Inventory low",
                    message=f"{item.item_name} is at or below minimum stock.",
                    metadata={"item_id": item.id},
                    created_by=user,
                )
                for admin in admin_users
            ]
        )
    return transaction


@transaction.atomic
def create_stationery_purchase(*, tenant, student, items, discount, tax, payment_status, user):
    purchase = StationeryPurchase.objects.create(
        tenant=tenant,
        student=student,
        discount=Decimal(str(discount or 0)),
        tax=Decimal(str(tax or 0)),
        payment_status=payment_status,
        receipt_number=next_reference("STN", tenant.id, StationeryPurchase, "receipt_number"),
        created_by=user,
    )

    subtotal = Decimal("0")
    for row in items:
        item = StationeryItem.objects.select_for_update().get(id=row["item"], tenant=tenant)
        quantity = int(row["quantity"])
        price = Decimal(str(row.get("price", item.selling_price)))
        item_discount = Decimal(str(row.get("discount", 0)))
        item_tax = Decimal(str(row.get("tax", 0)))
        line_total = (price * quantity) - item_discount + item_tax
        StationeryPurchaseItem.objects.create(
            purchase=purchase,
            item=item,
            quantity=quantity,
            price=price,
            discount=item_discount,
            tax=item_tax,
            total=line_total,
        )
        move_stock(
            item=item,
            transaction_type=InventoryTransaction.TransactionType.STUDENT_PURCHASE,
            quantity=quantity,
            unit_price=price,
            reference=purchase.receipt_number,
            user=user,
        )
        subtotal += line_total

    purchase.total = subtotal - purchase.discount + purchase.tax
    purchase.save(update_fields=["total", "updated_at"])
    return purchase


def dashboard_payload(tenant, user):
    refresh_invoice_statuses(tenant)
    today = timezone.localdate()
    month_start = today.replace(day=1)
    total_attendance_month = Attendance.objects.filter(tenant=tenant, date__gte=month_start).count()
    present_attendance_month = Attendance.objects.filter(tenant=tenant, date__gte=month_start, is_present=True).count()
    cards = {
        "students": Students.objects.filter(tenant=tenant).count(),
        "teachers": Teachers.objects.filter(tenant=tenant).count(),
        "staff": Staff.objects.filter(tenant=tenant).count(),
        "classes": Classes.objects.filter(tenant=tenant).count(),
        "courses": Classes.objects.filter(tenant=tenant).count(),
        "todays_attendance": Attendance.objects.filter(tenant=tenant, date=today, is_present=True).count(),
        "monthly_attendance_percentage": round((present_attendance_month / total_attendance_month) * 100, 2) if total_attendance_month else 0,
        "collected_fees": Payment.objects.filter(tenant=tenant, payment_date__gte=month_start).aggregate(total=Sum("amount_paid"))["total"] or 0,
        "monthly_revenue": Payment.objects.filter(tenant=tenant, payment_date__gte=month_start).aggregate(total=Sum("amount_paid"))["total"] or 0,
        "pending_fees": Invoice.objects.filter(tenant=tenant, status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIAL]).aggregate(total=Sum("balance"))["total"] or 0,
        "overdue_fees": Invoice.objects.filter(tenant=tenant, status=Invoice.Status.OVERDUE).aggregate(total=Sum("balance"))["total"] or 0,
        "stationery_sales": StationeryPurchase.objects.filter(tenant=tenant, date__gte=month_start).aggregate(total=Sum("total"))["total"] or 0,
        "inventory_value": StationeryItem.objects.filter(tenant=tenant).aggregate(total=Sum(F("quantity") * F("selling_price"), output_field=DecimalField()))["total"] or 0,
        "inventory_alerts": StationeryItem.objects.filter(tenant=tenant, status__in=[StationeryItem.Status.LOW_STOCK, StationeryItem.Status.OUT_OF_STOCK]).count(),
        "low_stock_items": StationeryItem.objects.filter(tenant=tenant, status__in=[StationeryItem.Status.LOW_STOCK, StationeryItem.Status.OUT_OF_STOCK]).count(),
        "assessments": Assessment.objects.filter(tenant=tenant).count(),
        "upcoming_exams": Assessment.objects.filter(tenant=tenant, assessment_date__gte=today).count(),
    }
    return {
        "cards": cards,
        "monthly_revenue": list(Payment.objects.filter(tenant=tenant, payment_date__year=today.year).values("payment_date__month").annotate(total=Sum("amount_paid")).order_by("payment_date__month")),
        "attendance_trend": list(Attendance.objects.filter(tenant=tenant, date__gte=today.replace(day=max(1, today.day - 14))).values("date").annotate(present=Count("id", filter=Q(is_present=True)), absent=Count("id", filter=Q(is_present=False))).order_by("date")),
        "fee_collection": list(Invoice.objects.filter(tenant=tenant, year=today.year).values("month").annotate(expected=Sum("final_amount"), collected=Sum("paid_amount"), outstanding=Sum("balance")).order_by("month")),
        "assessment_performance": list(AssessmentResult.objects.filter(tenant=tenant).values("assessment__title").annotate(avg_percentage=Sum("percentage") / Count("id")).order_by("assessment__title")[:12]),
        "student_growth": list(Students.objects.filter(tenant=tenant).values("enrollment_date__month").annotate(total=Count("id")).order_by("enrollment_date__month")),
        "inventory_movement": list(InventoryTransaction.objects.filter(tenant=tenant, created_at__gte=month_start).values("transaction_type").annotate(total=Sum("quantity")).order_by("transaction_type")),
        "recent_payments": list(Payment.objects.filter(tenant=tenant).values("receipt_number", "invoice__student__name", "amount_paid", "payment_date")[:8]),
        "recent_admissions": list(Students.objects.filter(tenant=tenant).values("id", "name", "role_number", "enrollment_date").order_by("-enrollment_date")[:8]),
        "recent_assessments": list(Assessment.objects.filter(tenant=tenant).values("id", "title", "status", "assessment_date", "course__name", "batch__name").order_by("-created_at")[:8]),
        "notifications": list(Notification.objects.filter(tenant=tenant, recipient=user).values("title", "message", "notification_type", "created_at")[:8]),
        "low_stock": list(StationeryItem.objects.filter(tenant=tenant, status__in=[StationeryItem.Status.LOW_STOCK, StationeryItem.Status.OUT_OF_STOCK]).values("id", "item_name", "quantity", "minimum_stock", "status")[:8]),
        "pending_fee_list": list(Invoice.objects.filter(tenant=tenant, status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE]).values("invoice_number", "student__name", "balance", "due_date", "status")[:8]),
        "upcoming_exams": list(Assessment.objects.filter(tenant=tenant, assessment_date__gte=today).values("id", "title", "assessment_date", "course__name", "batch__name", "status")[:8]),
    }
