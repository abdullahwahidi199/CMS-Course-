import json
import re

from rest_framework import serializers

from .models import (
    PublicAchievement,
    PublicAnnouncement,
    PublicAnnouncementComment,
    PublicCourseProgram,
    PublicEvent,
    PublicInquiry,
    TenantPublicSiteSettings,
)
from .shamsi import CalendarModelSerializer


HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
URL_RE = re.compile(r"https?://|www\.", re.IGNORECASE)
SPAM_TERMS = ("casino", "crypto giveaway", "loan offer", "viagra")


def validate_public_submission(attrs, message_field="message"):
    honeypot = attrs.pop("website", "")
    if honeypot:
        raise serializers.ValidationError("Could not submit this message.")
    text = attrs.get(message_field, "") or ""
    if len(text.strip()) < 5:
        raise serializers.ValidationError({message_field: "Please write a little more detail."})
    if len(URL_RE.findall(text)) > 2:
        raise serializers.ValidationError({message_field: "Too many links."})
    lowered = text.lower()
    if any(term in lowered for term in SPAM_TERMS):
        raise serializers.ValidationError({message_field: "Could not submit this message."})
    return attrs


class TenantPublicSiteSettingsSerializer(CalendarModelSerializer):
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)
    tenant_public_slug = serializers.CharField(source="tenant.public_slug", read_only=True)
    tenant_logo = serializers.ImageField(source="tenant.logo", read_only=True)
    public_path = serializers.SerializerMethodField()

    class Meta:
        model = TenantPublicSiteSettings
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]

    def get_public_path(self, obj):
        return f"/site/{obj.tenant.public_slug}" if obj.tenant and obj.tenant.public_slug else ""

    def validate_primary_color(self, value):
        if value and not HEX_COLOR_RE.match(value):
            raise serializers.ValidationError("Use a 6-digit hex color, for example #0f766e.")
        return value

    def validate_accent_color(self, value):
        if value and not HEX_COLOR_RE.match(value):
            raise serializers.ValidationError("Use a 6-digit hex color, for example #f59e0b.")
        return value

    def validate_about_highlights(self, value):
        if value in [None, ""]:
            return []
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError("Highlights must be a JSON list.") from exc
        if not isinstance(value, list):
            raise serializers.ValidationError("Highlights must be a list.")
        return [str(item).strip() for item in value if str(item).strip()][:8]


class PublicCourseProgramSerializer(CalendarModelSerializer):
    class Meta:
        model = PublicCourseProgram
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value


class PublicAnnouncementSerializer(CalendarModelSerializer):
    approved_comment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = PublicAnnouncement
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]

    def validate_title(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value


class PublicAnnouncementCommentSerializer(CalendarModelSerializer):
    post_title = serializers.CharField(source="announcement.title", read_only=True)

    class Meta:
        model = PublicAnnouncementComment
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at", "ip_address", "user_agent", "is_spam"]


class PublicAnnouncementCommentCreateSerializer(CalendarModelSerializer):
    website = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = PublicAnnouncementComment
        fields = ["visitor_name", "visitor_email", "body", "website"]

    def validate(self, attrs):
        if not attrs.get("visitor_name", "").strip():
            raise serializers.ValidationError({"visitor_name": "Name is required."})
        return validate_public_submission(attrs, message_field="body")


class PublicEventSerializer(CalendarModelSerializer):
    class Meta:
        model = PublicEvent
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at and ends_at and ends_at < starts_at:
            raise serializers.ValidationError({"ends_at": "End date/time cannot be before the start."})
        return attrs


class PublicAchievementSerializer(CalendarModelSerializer):
    class Meta:
        model = PublicAchievement
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]


class PublicInquirySerializer(CalendarModelSerializer):
    class Meta:
        model = PublicInquiry
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        email = attrs.get("visitor_email", "")
        phone = attrs.get("visitor_phone", "")
        if not email and not phone:
            raise serializers.ValidationError("Provide an email address or phone number.")
        if not attrs.get("message", "").strip():
            raise serializers.ValidationError({"message": "Message is required."})
        return attrs


class PublicInquiryCreateSerializer(CalendarModelSerializer):
    website = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = PublicInquiry
        fields = ["visitor_name", "visitor_email", "visitor_phone", "subject", "message", "source", "website"]

    def validate(self, attrs):
        email = attrs.get("visitor_email", "")
        phone = attrs.get("visitor_phone", "")
        if not attrs.get("visitor_name", "").strip():
            raise serializers.ValidationError({"visitor_name": "Name is required."})
        if not email and not phone:
            raise serializers.ValidationError("Provide an email address or phone number.")
        return validate_public_submission(attrs, message_field="message")
