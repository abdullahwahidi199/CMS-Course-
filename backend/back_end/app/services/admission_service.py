from django.db import transaction

from app.models import Classes, Enrollment
from app.services.enrollment_service import create_enrollment
from app.services.student_service import create_student


@transaction.atomic
def admit_student(
    *,
    tenant,
    created_by,
    student,
    account=None,
    academic=None,
):
    account = account or {}
    academic = academic or {}
    batch = Classes.objects.select_related("course").get(id=academic["batch"], tenant=tenant)
    student_obj = create_student(
        tenant=tenant,
        username=account.get("username"),
        password=account.get("password"),
        first_name=student.get("first_name", ""),
        last_name=student.get("last_name", ""),
        email=account.get("email", student.get("email", "")),
        phone=student.get("phone", account.get("phone", "")),
        f_name=student.get("guardian_name", ""),
        parent_mobile_number=student.get("parent_mobile_number", ""),
        address=student.get("address", ""),
        create_user=account.get("create_user", True),
    )
    enrollment = create_enrollment(
        tenant=tenant,
        student=student_obj,
        batch=batch,
        course=batch.course,
        enrollment_date=academic.get("enrollment_date"),
        status=academic.get("status", Enrollment.Status.ACTIVE),
        created_by=created_by,
        remarks=academic.get("remarks", ""),
    )
    return student_obj, enrollment
