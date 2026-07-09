from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from app.models import Role

User = get_user_model()


def get_required_role(*, tenant, slug):
    from app.rbac import seed_permissions_and_roles

    seed_permissions_and_roles(tenant)
    role = Role.objects.filter(tenant=tenant, slug=slug, is_active=True, is_archived=False).first()
    if not role:
        raise serializers.ValidationError({"role": f"{slug.title()} role is not configured for this tenant."})
    return role


def validate_unique_user_identity(*, username, email=None, user_id=None):
    queryset = User.objects.all()
    if user_id:
        queryset = queryset.exclude(id=user_id)
    if queryset.filter(username__iexact=username).exists():
        raise serializers.ValidationError({"username": "This username is already taken."})
    if email and queryset.filter(email__iexact=email).exists():
        raise serializers.ValidationError({"email": "This email is already used by another user."})


def validate_account_password(password, user):
    try:
        validate_password(password, user)
    except DjangoValidationError as exc:
        messages = list(exc.messages)
        raise serializers.ValidationError({"password": messages or ["Password does not meet the requirements."]})


@transaction.atomic
def create_user_account(*, tenant, username, password, role, email="", first_name="", last_name="", phone=""):
    if not username:
        raise serializers.ValidationError({"username": "Username is required."})
    if not password:
        raise serializers.ValidationError({"password": "Password is required."})
    validate_unique_user_identity(username=username, email=email)

    user = User(
        tenant=tenant,
        username=username,
        email=email or "",
        first_name=first_name or "",
        last_name=last_name or "",
        phone=phone or "",
        role=role,
    )
    validate_account_password(password, user)
    user.set_password(password)
    user.save()
    return user


@transaction.atomic
def update_user_account(user, *, username=None, email=None, first_name=None, last_name=None, phone=None, password=None, is_active=None):
    if username and username != user.username:
        validate_unique_user_identity(username=username, email=email or user.email, user_id=user.id)
        user.username = username
    elif email and email != user.email:
        validate_unique_user_identity(username=user.username, email=email, user_id=user.id)

    if email is not None:
        user.email = email or ""
    if first_name is not None:
        user.first_name = first_name or ""
    if last_name is not None:
        user.last_name = last_name or ""
    if phone is not None:
        user.phone = phone or ""
    if is_active is not None:
        user.is_active = bool(is_active)
        user.is_deactivated = not bool(is_active)
    if password:
        validate_account_password(password, user)
        user.set_password(password)
    user.save()
    return user
