from django.db import transaction

from app.models import Students
from app.services.user_service import create_user_account, get_required_role, update_user_account


@transaction.atomic
def create_student(*, tenant, username, password, first_name, last_name, email="", phone="", f_name="", role_number="", parent_mobile_number="", address="", total_fee=0, amount_paid=0):
    role = get_required_role(tenant=tenant, slug="student")
    user = create_user_account(
        tenant=tenant,
        username=username,
        password=password,
        role=role,
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone or parent_mobile_number,
    )
    return Students.objects.create(
        tenant=tenant,
        user=user,
        name=f"{first_name} {last_name}".strip(),
        f_name=f_name,
        role_number=role_number,
        parent_mobile_number=parent_mobile_number or phone,
        address=address,
        total_fee=total_fee or 0,
        amount_paid=amount_paid or 0,
    )


@transaction.atomic
def update_student(student, *, first_name=None, last_name=None, email=None, phone=None, username=None, password=None, is_active=None, **profile):
    if first_name is None and last_name is None:
        parts = (student.name or "").split(" ", 1)
        first_name = student.user.first_name or parts[0]
        last_name = student.user.last_name or (parts[1] if len(parts) > 1 else "")
    update_user_account(
        student.user,
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone or profile.get("parent_mobile_number"),
        password=password,
        is_active=is_active,
    )
    if first_name is not None or last_name is not None:
        student.name = f"{first_name or ''} {last_name or ''}".strip()
    for field in ["f_name", "role_number", "parent_mobile_number", "address", "total_fee", "amount_paid"]:
        if field in profile:
            setattr(student, field, profile[field])
    if is_active is not None:
        student.is_active = bool(is_active)
        student.is_archived = not bool(is_active)
    student.save()
    return student
