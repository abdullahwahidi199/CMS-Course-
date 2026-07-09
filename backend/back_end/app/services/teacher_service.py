from django.db import transaction

from app.models import Teachers
from app.services.user_service import create_user_account, get_required_role, update_user_account


@transaction.atomic
def create_teacher(*, tenant, username, password, full_name, email, phone_number="", subject="", department="", is_active=True):
    role = get_required_role(tenant=tenant, slug="teacher")
    first_name, _, last_name = full_name.partition(" ")
    user = create_user_account(
        tenant=tenant,
        username=username,
        password=password,
        role=role,
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone_number,
    )
    if is_active is not True:
        user.is_active = False
        user.is_deactivated = True
        user.save(update_fields=["is_active", "is_deactivated"])
    return Teachers.objects.create(
        tenant=tenant,
        user=user,
        full_name=full_name,
        phone_number=phone_number,
        email_address=email,
        subject=subject,
        department=department,
        is_active=bool(is_active),
    )


@transaction.atomic
def update_teacher(teacher, *, username=None, password=None, email=None, full_name=None, phone_number=None, subject=None, department=None, is_active=None):
    name = full_name if full_name is not None else teacher.full_name
    first_name, _, last_name = name.partition(" ")
    update_user_account(
        teacher.user,
        username=username,
        email=email if email is not None else teacher.email_address,
        first_name=first_name,
        last_name=last_name,
        phone=phone_number if phone_number is not None else teacher.phone_number,
        password=password,
        is_active=is_active,
    )
    if full_name is not None:
        teacher.full_name = full_name
    if phone_number is not None:
        teacher.phone_number = phone_number
    if email is not None:
        teacher.email_address = email
    if subject is not None:
        teacher.subject = subject
    if department is not None:
        teacher.department = department
    if is_active is not None:
        teacher.is_active = bool(is_active)
        if is_active:
            teacher.is_archived = False
            teacher.archived_at = None
    teacher.save()
    return teacher
