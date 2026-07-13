from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from app.models import Classes, Enrollment, EnrollmentBillingProfile, Invoice
from app.services.billing_service import generate_invoice_for_profile, get_or_create_billing_profile


ACTIVE_BILLING_STATUSES = {
    Enrollment.Status.ACTIVE: EnrollmentBillingProfile.Status.ACTIVE,
    Enrollment.Status.PENDING: EnrollmentBillingProfile.Status.PAUSED,
    Enrollment.Status.SUSPENDED: EnrollmentBillingProfile.Status.PAUSED,
    Enrollment.Status.COMPLETED: EnrollmentBillingProfile.Status.CLOSED,
    Enrollment.Status.DROPPED: EnrollmentBillingProfile.Status.CLOSED,
    Enrollment.Status.TRANSFERRED: EnrollmentBillingProfile.Status.CLOSED,
    Enrollment.Status.CANCELLED: EnrollmentBillingProfile.Status.CLOSED,
    Enrollment.Status.ARCHIVED: EnrollmentBillingProfile.Status.CLOSED,
}


@transaction.atomic
def create_enrollment(*, tenant, student, batch, course=None, enrollment_date=None, status=Enrollment.Status.ACTIVE, created_by=None, remarks=""):
    if isinstance(batch, int):
        batch = Classes.objects.select_related("course").get(id=batch, tenant=tenant)
    course = batch.course or course
    enrollment = Enrollment.objects.create(
        tenant=tenant,
        created_by=created_by,
        student=student,
        batch=batch,
        course=course,
        enrollment_date=enrollment_date or timezone.localdate(),
        status=status,
        remarks=remarks,
    )
    profile = get_or_create_billing_profile(enrollment, user=created_by)
    if status == Enrollment.Status.ACTIVE and profile:
        today = timezone.localdate()
        generate_invoice_for_profile(
            profile=profile,
            month=today.month,
            year=today.year,
            user=created_by,
        )
    return enrollment


@transaction.atomic
def transition_enrollment(enrollment, *, status, user=None, completed_date=None):
    enrollment.status = status
    if status == Enrollment.Status.COMPLETED:
        enrollment.completed_date = completed_date or timezone.localdate()
    if status == Enrollment.Status.ARCHIVED:
        enrollment.is_archived = True
    enrollment.save()

    profile = getattr(enrollment, "billing_profile", None)
    if profile:
        profile.billing_status = ACTIVE_BILLING_STATUSES.get(status, profile.billing_status)
        if profile.billing_status == EnrollmentBillingProfile.Status.CLOSED and not profile.billing_end_date:
            profile.billing_end_date = timezone.localdate()
        profile.save(update_fields=["billing_status", "billing_end_date", "updated_at"])

    if status in {Enrollment.Status.CANCELLED, Enrollment.Status.COMPLETED, Enrollment.Status.TRANSFERRED, Enrollment.Status.ARCHIVED}:
        today = timezone.localdate()
        Invoice.objects.filter(
            enrollment=enrollment,
            paid_amount=0,
        ).filter(
            Q(billing_year__gt=today.year) | Q(billing_year=today.year, billing_month__gt=today.month),
        ).update(status=Invoice.Status.CANCELLED, balance=0)
    return enrollment


@transaction.atomic
def transfer_enrollment(enrollment, *, new_batch, user=None, remarks=""):
    transition_enrollment(enrollment, status=Enrollment.Status.TRANSFERRED, user=user)
    if isinstance(new_batch, int):
        new_batch = Classes.objects.select_related("course").get(id=new_batch, tenant=enrollment.tenant)
    return create_enrollment(
        tenant=enrollment.tenant,
        student=enrollment.student,
        batch=new_batch,
        course=new_batch.course,
        enrollment_date=timezone.localdate(),
        status=Enrollment.Status.ACTIVE,
        created_by=user,
        remarks=remarks or f"Transferred from {enrollment.batch.name}",
    )
    print(enrollment.enrollment_date, type(enrollment.enrollment_date))
