from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .enterprise_permissions import HasRBACPermission
from .models import (
    PublicAchievement,
    PublicAnnouncement,
    PublicAnnouncementComment,
    PublicCourseProgram,
    PublicEvent,
    PublicInquiry,
    TenantPublicSiteSettings,
)
from .public_serializers import (
    PublicAchievementSerializer,
    PublicAnnouncementSerializer,
    PublicAnnouncementCommentSerializer,
    PublicCourseProgramSerializer,
    PublicEventSerializer,
    PublicInquirySerializer,
    TenantPublicSiteSettingsSerializer,
)


class OnlinePageTenantScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRBACPermission]
    rbac_resource = "online-page"
    search_fields = []
    ordering_fields = []
    default_ordering = None
    filter_fields = ["is_published"]

    def get_tenant(self):
        tenant = getattr(self.request.user, "tenant", None)
        if not tenant:
            raise ValidationError("Your account is not assigned to an education center.")
        return tenant

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_super_admin and not user.tenant_id:
            scoped = queryset
        else:
            scoped = queryset.filter(tenant=self.get_tenant())
        scoped = self.apply_filters(scoped)
        scoped = self.apply_search(scoped)
        return self.apply_ordering(scoped)

    def apply_filters(self, queryset):
        for field in self.filter_fields:
            value = self.request.query_params.get(field)
            if value in [None, ""]:
                continue
            if value in ["true", "1", "yes"]:
                value = True
            elif value in ["false", "0", "no"]:
                value = False
            queryset = queryset.filter(**{field: value})
        return queryset

    def apply_search(self, queryset):
        search = self.request.query_params.get("search")
        if not search or not self.search_fields:
            return queryset
        query = Q()
        for field in self.search_fields:
            query |= Q(**{f"{field}__icontains": search})
        return queryset.filter(query)

    def apply_ordering(self, queryset):
        ordering = self.request.query_params.get("ordering") or self.default_ordering
        if not ordering:
            return queryset
        allowed = set(self.ordering_fields)
        requested = [part.strip() for part in ordering.split(",") if part.strip()]
        safe = [part for part in requested if part.lstrip("-") in allowed]
        return queryset.order_by(*safe) if safe else queryset

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant(), created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        item = self.get_object()
        item.is_published = True
        update_fields = ["is_published", "updated_at"]
        if hasattr(item, "published_at") and item.published_at and item.published_at > timezone.now():
            item.published_at = timezone.now()
            update_fields.append("published_at")
        item.save(update_fields=update_fields)
        return Response(self.get_serializer(item).data)

    @action(detail=True, methods=["post"])
    def unpublish(self, request, pk=None):
        item = self.get_object()
        item.is_published = False
        item.save(update_fields=["is_published", "updated_at"])
        return Response(self.get_serializer(item).data)


class TenantPublicSiteSettingsViewSet(OnlinePageTenantScopedViewSet):
    serializer_class = TenantPublicSiteSettingsSerializer
    queryset = TenantPublicSiteSettings.objects.select_related("tenant", "created_by")
    http_method_names = ["get", "post", "patch", "put", "head", "options"]

    def default_settings(self, tenant):
        return {
            "created_by": self.request.user,
            "center_name": tenant.name,
            "contact_email": tenant.email,
            "contact_phone": tenant.phone,
            "contact_address": tenant.address,
            "hero_title": tenant.name,
            "hero_primary_label": "Contact us",
            "hero_primary_url": "contact",
            "about_title": f"About {tenant.name}",
            "contact_title": "Contact us",
            "chat_title": "Need help?",
            "chat_welcome_message": "Send us a message and our team will reply soon.",
            "seo_title": tenant.name,
            "seo_description": f"Official public page for {tenant.name}.",
        }

    def get_current_settings(self):
        tenant = self.get_tenant()
        settings, _ = TenantPublicSiteSettings.objects.get_or_create(
            tenant=tenant,
            defaults=self.default_settings(tenant),
        )
        return settings

    def list(self, request, *args, **kwargs):
        settings = self.get_current_settings()
        return Response(self.get_serializer(settings).data)

    @action(detail=False, methods=["get", "patch", "put"])
    def current(self, request):
        settings = self.get_current_settings()
        if request.method == "GET":
            return Response(self.get_serializer(settings).data)
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def publish(self, request):
        settings = self.get_current_settings()
        settings.is_published = True
        settings.save(update_fields=["is_published", "updated_at"])
        return Response(self.get_serializer(settings).data)

    @action(detail=False, methods=["post"])
    def unpublish(self, request):
        settings = self.get_current_settings()
        settings.is_published = False
        settings.save(update_fields=["is_published", "updated_at"])
        return Response(self.get_serializer(settings).data)


class PublicCourseProgramViewSet(OnlinePageTenantScopedViewSet):
    serializer_class = PublicCourseProgramSerializer
    queryset = PublicCourseProgram.objects.select_related("tenant", "created_by")
    search_fields = ["title", "summary", "description", "level", "mode"]
    ordering_fields = ["order", "title", "created_at", "updated_at"]
    default_ordering = "order,title"


class PublicAnnouncementViewSet(OnlinePageTenantScopedViewSet):
    serializer_class = PublicAnnouncementSerializer
    queryset = PublicAnnouncement.objects.select_related("tenant", "created_by")
    search_fields = ["title", "summary", "body"]
    ordering_fields = ["published_at", "created_at", "title"]
    default_ordering = "-published_at"


class PublicAnnouncementCommentViewSet(OnlinePageTenantScopedViewSet):
    serializer_class = PublicAnnouncementCommentSerializer
    queryset = PublicAnnouncementComment.objects.select_related("tenant", "announcement")
    search_fields = ["visitor_name", "visitor_email", "body", "announcement__title"]
    ordering_fields = ["created_at", "status", "visitor_name"]
    default_ordering = "-created_at"
    filter_fields = ["status", "is_spam"]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def set_status(self, status_value, is_spam=False):
        comment = self.get_object()
        comment.status = status_value
        comment.is_spam = is_spam
        comment.save(update_fields=["status", "is_spam", "updated_at"])
        return Response(self.get_serializer(comment).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self.set_status(PublicAnnouncementComment.Status.APPROVED)

    @action(detail=True, methods=["post"])
    def hide(self, request, pk=None):
        return self.set_status(PublicAnnouncementComment.Status.HIDDEN)

    @action(detail=True, methods=["post"])
    def spam(self, request, pk=None):
        return self.set_status(PublicAnnouncementComment.Status.SPAM, is_spam=True)


class PublicEventViewSet(OnlinePageTenantScopedViewSet):
    serializer_class = PublicEventSerializer
    queryset = PublicEvent.objects.select_related("tenant", "created_by")
    search_fields = ["title", "summary", "description", "location"]
    ordering_fields = ["starts_at", "order", "title", "created_at"]
    default_ordering = "starts_at"


class PublicAchievementViewSet(OnlinePageTenantScopedViewSet):
    serializer_class = PublicAchievementSerializer
    queryset = PublicAchievement.objects.select_related("tenant", "created_by")
    search_fields = ["title", "description", "metric_label", "metric_value"]
    ordering_fields = ["order", "achieved_on", "title", "created_at"]
    default_ordering = "order,-achieved_on"


class PublicInquiryViewSet(OnlinePageTenantScopedViewSet):
    serializer_class = PublicInquirySerializer
    queryset = PublicInquiry.objects.select_related("tenant", "created_by")
    search_fields = ["visitor_name", "visitor_email", "visitor_phone", "subject", "message"]
    ordering_fields = ["created_at", "status", "source"]
    default_ordering = "-created_at"
    filter_fields = ["status", "source"]
    http_method_names = ["get", "patch", "delete", "head", "options"]
