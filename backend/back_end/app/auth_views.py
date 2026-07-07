from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.db.models import Count, Q
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.text import slugify
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .auth_serializers import (
    BulkUserActionSerializer,
    ChangePasswordSerializer,
    CurrentUserSerializer,
    PermissionMatrixSerializer,
    PermissionSerializer,
    ProfileUpdateSerializer,
    ResetPasswordConfirmSerializer,
    ResetPasswordRequestSerializer,
    RoleSerializer,
    UserManagementSerializer,
)
from .enterprise_permissions import HasRBACPermission
from .models import RBACPermission, Role
from .rbac import grouped_permissions, seed_permissions_and_roles

User = get_user_model()


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    seed_permissions_and_roles(request.user.tenant, request.user)
    if not request.user.role_id:
        return Response({"detail": "No role assigned. Contact an administrator."}, status=status.HTTP_403_FORBIDDEN)
    return Response(CurrentUserSerializer(request.user, context={"request": request}).data)


@api_view(["PATCH", "PUT"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(CurrentUserSerializer(request.user, context={"request": request}).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    request.user.set_password(serializer.validated_data["new_password"])
    request.user.save(update_fields=["password"])
    return Response({"detail": "Password changed successfully."})


@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = ResetPasswordRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    query = Q()
    if serializer.validated_data.get("email"):
        query |= Q(email__iexact=serializer.validated_data["email"])
    if serializer.validated_data.get("username"):
        query |= Q(username__iexact=serializer.validated_data["username"])
    user = User.objects.filter(query, is_active=True).first()
    if not user:
        return Response({"detail": "If the account exists, reset instructions have been generated."})
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return Response({
        "detail": "Password reset token generated.",
        "uid": uid,
        "token": token,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password(request):
    serializer = ResetPasswordConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    user.set_password(serializer.validated_data["new_password"])
    user.save(update_fields=["password"])
    return Response({"detail": "Password reset successfully."})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    refresh = request.data.get("refresh")
    if refresh:
        try:
            RefreshToken(refresh).blacklist()
        except Exception:
            pass
    return Response(status=status.HTTP_204_NO_CONTENT)


class TenantScopedAdminViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRBACPermission]
    search_fields = []
    ordering_fields = []
    filter_fields = []

    def scope_queryset(self, queryset):
        user = self.request.user
        if user.is_super_admin:
            return queryset
        if hasattr(queryset.model, "tenant"):
            return queryset.filter(tenant=user.tenant)
        return queryset

    def get_queryset(self):
        queryset = self.scope_queryset(super().get_queryset())
        search = self.request.query_params.get("search")
        if search and self.search_fields:
            query = Q()
            for field in self.search_fields:
                query |= Q(**{f"{field}__icontains": search})
            queryset = queryset.filter(query)
        for field in self.filter_fields:
            value = self.request.query_params.get(field)
            if value not in [None, ""]:
                queryset = queryset.filter(**{field: value})
        ordering = self.request.query_params.get("ordering")
        if ordering:
            allowed = set(self.ordering_fields)
            requested = [part for part in ordering.split(",") if part.lstrip("-") in allowed]
            if requested:
                queryset = queryset.order_by(*requested)
        return queryset


class UserViewSet(TenantScopedAdminViewSet):
    rbac_resource = "users"
    serializer_class = UserManagementSerializer
    queryset = User.objects.select_related("tenant", "role").all()
    search_fields = ["username", "first_name", "last_name", "email", "phone"]
    ordering_fields = ["username", "email", "date_joined", "last_login"]
    filter_fields = ["role", "is_active", "is_deactivated"]

    def perform_create(self, serializer):
        tenant = self.request.user.tenant if not self.request.user.is_super_admin else serializer.validated_data.get("tenant")
        serializer.save(tenant=tenant)

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.is_deactivated = False
        user.save(update_fields=["is_active", "is_deactivated"])
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.is_deactivated = True
        user.save(update_fields=["is_active", "is_deactivated"])
        return Response(self.get_serializer(user).data)

    @action(detail=True, methods=["post"], url_path="reset-password")
    def reset_password(self, request, pk=None):
        user = self.get_object()
        password = request.data.get("password") or User.objects.make_random_password()
        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset.", "temporary_password": password})

    @action(detail=True, methods=["post"], url_path="change-role")
    def change_role(self, request, pk=None):
        user = self.get_object()
        role = Role.objects.get(pk=request.data.get("role"), tenant=request.user.tenant)
        user.role = role
        user.save(update_fields=["role"])
        return Response(self.get_serializer(user).data)

    @action(detail=False, methods=["post"], url_path="bulk-action")
    def bulk_action(self, request):
        serializer = BulkUserActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        queryset = self.get_queryset().filter(id__in=serializer.validated_data["user_ids"])
        action_name = request.data.get("action")
        if action_name == "activate":
            queryset.update(is_active=True, is_deactivated=False)
        elif action_name == "deactivate":
            queryset.update(is_active=False, is_deactivated=True)
        elif action_name == "delete":
            queryset.delete()
        elif action_name == "assign_role":
            queryset.update(role=serializer.validated_data["role"])
        else:
            return Response({"detail": "Invalid bulk action."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Bulk action completed."})


class RoleViewSet(TenantScopedAdminViewSet):
    rbac_resource = "roles"
    serializer_class = RoleSerializer
    queryset = Role.objects.prefetch_related("permissions").annotate(user_count=Count("users"))
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["name", "created_at"]
    filter_fields = ["is_active", "is_system"]

    def get_queryset(self):
        seed_permissions_and_roles(self.request.user.tenant, self.request.user)
        return super().get_queryset()

    def perform_create(self, serializer):
        slug = serializer.validated_data.get("slug") or slugify(serializer.validated_data["name"])
        serializer.save(tenant=self.request.user.tenant, slug=slug, created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def clone(self, request, pk=None):
        role = self.get_object()
        clone = Role.objects.create(
            tenant=role.tenant,
            name=request.data.get("name") or f"{role.name} Copy",
            slug=slugify(request.data.get("name") or f"{role.slug}-copy"),
            description=role.description,
            created_by=request.user,
        )
        clone.permissions.set(role.permissions.all())
        return Response(self.get_serializer(clone).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="assign-users")
    def assign_users(self, request, pk=None):
        role = self.get_object()
        user_ids = request.data.get("user_ids", [])
        User.objects.filter(tenant=request.user.tenant, id__in=user_ids).update(role=role)
        return Response({"detail": "Users assigned."})

    @action(detail=False, methods=["get"])
    def matrix(self, request):
        roles = self.get_queryset()
        return Response({
            "roles": RoleSerializer(roles, many=True).data,
            "permissions": PermissionSerializer(RBACPermission.objects.filter(is_active=True), many=True).data,
            "groups": grouped_permissions(),
        })

    @action(detail=False, methods=["post"], url_path="set-permission")
    def set_permission(self, request):
        serializer = PermissionMatrixSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data["role"]
        permission = serializer.validated_data["permission"]
        if role.tenant != request.user.tenant and not request.user.is_super_admin:
            return Response({"detail": "Role is outside your tenant."}, status=status.HTTP_403_FORBIDDEN)
        if serializer.validated_data["enabled"]:
            role.permissions.add(permission)
        else:
            role.permissions.remove(permission)
        return Response(RoleSerializer(role).data)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    rbac_resource = "permissions"
    permission_classes = [HasRBACPermission]
    serializer_class = PermissionSerializer
    queryset = RBACPermission.objects.filter(is_active=True)
    search_fields = ["module", "action", "code", "label"]

    def list(self, request, *args, **kwargs):
        seed_permissions_and_roles(request.user.tenant, request.user)
        return super().list(request, *args, **kwargs)
