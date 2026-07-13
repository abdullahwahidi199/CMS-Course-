from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.utils import timezone
from xml.sax.saxutils import escape
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import (
    PublicAchievement,
    PublicAnnouncement,
    PublicAnnouncementComment,
    PublicCourseProgram,
    PublicEvent,
    Tenant,
    TenantPublicSiteSettings,
)
from .public_serializers import (
    PublicAchievementSerializer,
    PublicAnnouncementSerializer,
    PublicAnnouncementCommentCreateSerializer,
    PublicAnnouncementCommentSerializer,
    PublicCourseProgramSerializer,
    PublicEventSerializer,
    PublicInquiryCreateSerializer,
    TenantPublicSiteSettingsSerializer,
)


def default_public_site_settings(tenant):
    return {
        "is_published": True,
        "center_name": tenant.name,
        "contact_email": tenant.email,
        "contact_phone": tenant.phone,
        "contact_address": tenant.address,
        "hero_title": tenant.name,
        "hero_primary_label": "Contact us",
        "hero_primary_url": "contact",
        "hero_secondary_label": "View courses",
        "hero_secondary_url": "courses",
        "about_title": f"About {tenant.name}",
        "contact_title": "Contact us",
        "chat_title": "Need help?",
        "chat_welcome_message": "Send us a message and our team will reply soon.",
        "seo_title": tenant.name,
        "seo_description": f"Official public page for {tenant.name}.",
    }


def get_public_site(tenant_slug):
    tenant = get_object_or_404(
        Tenant.objects.filter(
            public_slug=tenant_slug,
            is_active=True,
            public_site_enabled=True,
        ),
    )
    settings, _created = TenantPublicSiteSettings.objects.get_or_create(
        tenant=tenant,
        defaults=default_public_site_settings(tenant),
    )
    if not settings.is_published:
        return None, None
    return tenant, settings


def public_or_404(tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        raise Tenant.DoesNotExist
    return tenant, settings


def site_identity(tenant, settings):
    return {
        "id": tenant.id,
        "name": settings.center_name or tenant.name,
        "slug": tenant.public_slug,
        "phone": settings.contact_phone or tenant.phone,
        "email": settings.contact_email or tenant.email,
        "address": settings.contact_address or tenant.address,
    }


def published_courses(tenant):
    return PublicCourseProgram.objects.filter(tenant=tenant, is_published=True).order_by("order", "title")


def published_announcements(tenant):
    return PublicAnnouncement.objects.filter(
        tenant=tenant,
        is_published=True,
        published_at__lte=timezone.now(),
    ).annotate(
        approved_comment_count=Count("comments", filter=Q(comments__status=PublicAnnouncementComment.Status.APPROVED))
    ).order_by("-published_at", "-created_at")


def published_events(tenant):
    return PublicEvent.objects.filter(tenant=tenant, is_published=True).order_by("starts_at", "order", "title")


def published_achievements(tenant):
    return PublicAchievement.objects.filter(tenant=tenant, is_published=True).order_by("order", "-achieved_on", "title")


def serialize_site(request, tenant, settings):
    context = {"request": request}
    announcements = published_announcements(tenant)
    events = published_events(tenant)
    return {
        "tenant": site_identity(tenant, settings),
        "settings": TenantPublicSiteSettingsSerializer(settings, context=context).data,
        "courses": PublicCourseProgramSerializer(published_courses(tenant), many=True, context=context).data,
        "announcements": PublicAnnouncementSerializer(announcements, many=True, context=context).data,
        "events": PublicEventSerializer(events, many=True, context=context).data,
        "upcoming_events": PublicEventSerializer(
            events.filter(starts_at__gte=timezone.now())[:6],
            many=True,
            context=context,
        ).data,
        "achievements": PublicAchievementSerializer(published_achievements(tenant), many=True, context=context).data,
    }


def not_found_response():
    return Response({"detail": "Public site not found."}, status=status.HTTP_404_NOT_FOUND)


def approved_comments(post):
    return post.comments.filter(status=PublicAnnouncementComment.Status.APPROVED).order_by("created_at")


def client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def public_url(request, path):
    return request.build_absolute_uri(path)


def url_entry(location, updated_at=None, priority="0.6"):
    lastmod = ""
    if updated_at:
        lastmod = f"<lastmod>{updated_at.date().isoformat()}</lastmod>"
    return f"<url><loc>{escape(location)}</loc>{lastmod}<priority>{priority}</priority></url>"


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_sitemap(request, tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    base_path = f"/site/{tenant.public_slug}"
    entries = [
        url_entry(public_url(request, base_path), settings.updated_at, "1.0"),
        url_entry(public_url(request, f"{base_path}/about"), settings.updated_at, "0.7"),
        url_entry(public_url(request, f"{base_path}/courses"), settings.updated_at, "0.8"),
        url_entry(public_url(request, f"{base_path}/news"), settings.updated_at, "0.8"),
        url_entry(public_url(request, f"{base_path}/events"), settings.updated_at, "0.7"),
        url_entry(public_url(request, f"{base_path}/achievements"), settings.updated_at, "0.7"),
        url_entry(public_url(request, f"{base_path}/contact"), settings.updated_at, "0.6"),
    ]
    entries.extend(
        url_entry(public_url(request, f"{base_path}/news/{post.slug}"), post.updated_at, "0.7")
        for post in published_announcements(tenant)
    )
    entries.extend(
        url_entry(public_url(request, f"{base_path}/events/{event.slug}"), event.updated_at, "0.6")
        for event in published_events(tenant)
    )
    xml = '<?xml version="1.0" encoding="UTF-8"?>'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    xml += "".join(entries)
    xml += "</urlset>"
    return HttpResponse(xml, content_type="application/xml")


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_robots(request, tenant_slug):
    tenant, _settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    sitemap_url = public_url(request, f"/api/public/sites/{tenant.public_slug}/sitemap.xml")
    body = "\n".join([
        "User-agent: *",
        "Allow: /",
        f"Sitemap: {sitemap_url}",
    ])
    return HttpResponse(body, content_type="text/plain")


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_home(request, tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    return Response(serialize_site(request, tenant, settings))


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_about(request, tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    return Response({
        "tenant": site_identity(tenant, settings),
        "settings": TenantPublicSiteSettingsSerializer(settings, context={"request": request}).data,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_courses(request, tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    return Response({
        "tenant": site_identity(tenant, settings),
        "results": PublicCourseProgramSerializer(published_courses(tenant), many=True, context={"request": request}).data,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_announcements(request, tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    return Response({
        "tenant": site_identity(tenant, settings),
        "results": PublicAnnouncementSerializer(published_announcements(tenant), many=True, context={"request": request}).data,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_announcement_detail(request, tenant_slug, post_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    post = get_object_or_404(
        published_announcements(tenant),
        slug=post_slug,
    )
    return Response({
        "tenant": site_identity(tenant, settings),
        "post": PublicAnnouncementSerializer(post, context={"request": request}).data,
        "comments": PublicAnnouncementCommentSerializer(approved_comments(post), many=True).data,
    })


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def public_site_announcement_comments(request, tenant_slug, post_slug):
    tenant, _settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    post = get_object_or_404(published_announcements(tenant), slug=post_slug)
    if request.method == "GET":
        return Response({"results": PublicAnnouncementCommentSerializer(approved_comments(post), many=True).data})
    serializer = PublicAnnouncementCommentCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    comment = serializer.save(
        tenant=tenant,
        announcement=post,
        ip_address=client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:260],
    )
    return Response(
        {
            "id": comment.id,
            "detail": "Comment submitted for review.",
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_events(request, tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    return Response({
        "tenant": site_identity(tenant, settings),
        "results": PublicEventSerializer(published_events(tenant), many=True, context={"request": request}).data,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_event_detail(request, tenant_slug, event_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    event = get_object_or_404(published_events(tenant), slug=event_slug)
    return Response({
        "tenant": site_identity(tenant, settings),
        "event": PublicEventSerializer(event, context={"request": request}).data,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_achievements(request, tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    return Response({
        "tenant": site_identity(tenant, settings),
        "results": PublicAchievementSerializer(published_achievements(tenant), many=True, context={"request": request}).data,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def public_site_contact(request, tenant_slug):
    tenant, settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    return Response({
        "tenant": site_identity(tenant, settings),
        "settings": TenantPublicSiteSettingsSerializer(settings, context={"request": request}).data,
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def public_site_inquiries(request, tenant_slug):
    tenant, _settings = get_public_site(tenant_slug)
    if not tenant:
        return not_found_response()
    serializer = PublicInquiryCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    inquiry = serializer.save(tenant=tenant)
    return Response({"id": inquiry.id, "detail": "Message received."}, status=status.HTTP_201_CREATED)
