from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from app.models import Classes, Enrollment, EnrollmentBillingProfile, PromotionHistory, Students
from app.services.billing_service import generate_invoice_for_profile, get_or_create_billing_profile


@transaction.atomic
def promote_student(student, new_batch, user=None, remarks="", promotion_date=None):
    if isinstance(student, int):
        tenant = user.tenant if user and not user.is_super_admin else None
        queryset = Students.objects.select_related("tenant")
        if tenant:
            queryset = queryset.filter(tenant=tenant)
        student = queryset.get(id=student)

    if isinstance(new_batch, int):
        new_batch = Classes.objects.select_related("course", "tenant").get(id=new_batch, tenant=student.tenant)

    if new_batch.tenant_id != student.tenant_id:
        raise ValidationError("New class must belong to the same tenant as the student.")

    active_enrollments = list(
        Enrollment.objects.select_for_update()
        .filter(student=student, tenant=student.tenant, status=Enrollment.Status.ACTIVE)
        .select_related("batch", "course")
        .order_by("-enrollment_date", "-created_at")
    )
    if not active_enrollments:
        raise ValidationError("Student has no active enrollment to promote.")

    old_enrollment = active_enrollments[0]
    if old_enrollment.batch_id == new_batch.id:
        raise ValidationError("Student cannot be promoted to the same class.")
    target_course = new_batch.course or old_enrollment.course
    if not target_course:
        raise ValidationError("Selected class is not linked to a course, and the current enrollment has no course to carry forward.")

    now = promotion_date or timezone.localdate()
    for enrollment in active_enrollments:
        enrollment.status = Enrollment.Status.TRANSFERRED
        enrollment.completed_date = enrollment.completed_date or now
        enrollment.save(update_fields=["status", "completed_date", "updated_at"])

        profile = getattr(enrollment, "billing_profile", None)
        if profile:
            profile.billing_status = EnrollmentBillingProfile.Status.CLOSED
            profile.billing_end_date = profile.billing_end_date or now
            profile.save(update_fields=["billing_status", "billing_end_date", "updated_at"])

    new_enrollment = Enrollment.objects.create(
        tenant=student.tenant,
        created_by=user,
        student=student,
        batch=new_batch,
        course=target_course,
        enrollment_date=now,
        status=Enrollment.Status.ACTIVE,
        remarks=remarks or f"Promoted from {old_enrollment.batch.name}",
    )
    new_profile = get_or_create_billing_profile(new_enrollment, user=user)
    if new_profile:
        generate_invoice_for_profile(
            profile=new_profile,
            month=now.month,
            year=now.year,
            user=user,
        )

    promotion = PromotionHistory.objects.create(
        tenant=student.tenant,
        student=student,
        old_enrollment=old_enrollment,
        new_enrollment=new_enrollment,
        old_class=old_enrollment.batch,
        new_class=new_batch,
        promotion_date=now,
        promoted_by=user,
        remarks=remarks,
    )
    return new_enrollment, promotion
