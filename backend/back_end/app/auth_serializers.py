from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers

from .models import Role, RBACPermission, Tenant
from .rbac import allowed_menus, effective_permission_codes, expand_legacy_classes_codes, grouped_permissions
from .serializers import StudentsSerializer, TeachersSerializer, TenantSerializer
from .shamsi import CalendarModelSerializer

User = get_user_model()


class PermissionSerializer(CalendarModelSerializer):
    class Meta:
        model = RBACPermission
        fields = ["id", "module", "action", "code", "label", "description", "is_active"]


class RoleSerializer(CalendarModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(queryset=RBACPermission.objects.all(), many=True, required=False)
    permission_codes = serializers.SerializerMethodField()
    user_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Role
        fields = [
            "id",
            "tenant",
            "name",
            "slug",
            "description",
            "permissions",
            "permission_codes",
            "user_count",
            "is_system",
            "is_active",
            "is_archived",
            "default_dashboard",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["tenant", "is_system", "created_at", "updated_at"]
        extra_kwargs = {
            "slug": {"required": False, "allow_blank": True},
        }

    def get_permission_codes(self, obj):
        return sorted(expand_legacy_classes_codes(obj.permissions.filter(is_active=True).values_list("code", flat=True)))


class UserManagementSerializer(CalendarModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    role_slug = serializers.CharField(source="role.slug", read_only=True)
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "avatar",
            "role",
            "role_name",
            "role_slug",
            "tenant",
            "tenant_name",
            "is_active",
            "is_deactivated",
            "is_staff",
            "date_joined",
            "last_login",
            "password",
        ]
        read_only_fields = ["date_joined", "last_login"]

    def create(self, validated_data):
        if not validated_data.get("role"):
            raise serializers.ValidationError({"role": "A database role is required."})
        password = validated_data.pop("password", None) or User.objects.make_random_password()
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            validate_password(password, instance)
            instance.set_password(password)
        instance.save()
        return instance


class CurrentUserSerializer(CalendarModelSerializer):
    tenant = TenantSerializer(read_only=True)
    role_details = RoleSerializer(source="role", read_only=True)
    role_slug = serializers.CharField(source="role.slug", read_only=True)
    teacher_profile = TeachersSerializer(read_only=True)
    student_profile = StudentsSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()
    permission_groups = serializers.SerializerMethodField()
    menus = serializers.SerializerMethodField()
    allowed_modules = serializers.SerializerMethodField()
    allowed_actions = serializers.SerializerMethodField()
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "teacher_profile",
    "student_profile",
            "avatar",
            "role",
            "role_slug",
            "role_details",
            "tenant",
            "profile",
            "permissions",
            "permission_groups",
            "menus",
            "allowed_modules",
            "allowed_actions",
            "is_active",
            "is_deactivated",
            "last_login",
        ]

    def get_permissions(self, obj):
        return sorted(effective_permission_codes(obj))

    def get_permission_groups(self, obj):
        codes = effective_permission_codes(obj)
        grouped = {}
        for code in codes:
            module, action = code.split(".", 1)
            grouped.setdefault(module, []).append(action)
        return grouped

    def get_menus(self, obj):
        return allowed_menus(obj)

    def get_allowed_modules(self, obj):
        return sorted({code.split(".", 1)[0] for code in effective_permission_codes(obj)})

    def get_allowed_actions(self, obj):
        grouped = {}
        for code in effective_permission_codes(obj):
            module, action = code.split(".", 1)
            grouped.setdefault(module, []).append(action)
        return grouped

    def get_profile(self, obj):
        if hasattr(obj, "teacher_profile"):
            return TeachersSerializer(obj.teacher_profile).data
        if hasattr(obj, "student_profile"):
            return StudentsSerializer(obj.student_profile).data
        return {
            "name": obj.get_full_name() or obj.username,
            "email": obj.email,
            "phone": obj.phone,
            "avatar": obj.avatar.url if obj.avatar else None,
        }

    def validate(self, attrs):
        if not self.instance.role_id:
            raise serializers.ValidationError("No role assigned.")
        return attrs


class ProfileUpdateSerializer(CalendarModelSerializer):
    class Meta:
        model = User
        fields = ["username", "first_name", "last_name", "email", "phone", "avatar"]

    def validate_username(self, value):
        username = (value or "").strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        queryset = User.objects.filter(username__iexact=username)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("This username is already taken.")
        return username


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value


class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("username"):
            raise serializers.ValidationError("Email or username is required.")
        return attrs


class ResetPasswordConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField()

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id)
        except Exception as exc:
            raise serializers.ValidationError("Invalid reset link.") from exc
        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError("Invalid or expired reset token.")
        validate_password(attrs["new_password"], user)
        attrs["user"] = user
        return attrs


class BulkUserActionSerializer(serializers.Serializer):
    user_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), required=False)


class PermissionMatrixSerializer(serializers.Serializer):
    role = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all())
    permission = serializers.PrimaryKeyRelatedField(queryset=RBACPermission.objects.all())
    enabled = serializers.BooleanField()
