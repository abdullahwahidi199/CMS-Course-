import app.models
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models
from django.utils.text import slugify


def populate_public_slugs(apps, schema_editor):
    Tenant = apps.get_model("app", "Tenant")
    used = set(
        Tenant.objects.exclude(public_slug__isnull=True)
        .exclude(public_slug="")
        .values_list("public_slug", flat=True)
    )
    for tenant in Tenant.objects.all().order_by("id"):
        if tenant.public_slug:
            continue
        base_slug = slugify(tenant.name) or f"education-center-{tenant.pk}"
        candidate = base_slug
        counter = 2
        while candidate in used:
            candidate = f"{base_slug}-{counter}"
            counter += 1
        tenant.public_slug = candidate
        tenant.save(update_fields=["public_slug"])
        used.add(candidate)


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0026_tenant_notification_settings_stationery_sale"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="public_site_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="tenant",
            name="public_slug",
            field=models.SlugField(blank=True, max_length=180, null=True, unique=True),
        ),
        migrations.RunPython(populate_public_slugs, migrations.RunPython.noop),
        migrations.CreateModel(
            name="TenantPublicSiteSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_published", models.BooleanField(default=False)),
                ("center_name", models.CharField(blank=True, max_length=220)),
                ("tagline", models.CharField(blank=True, max_length=260)),
                ("brand_logo", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("banner_image", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("primary_color", models.CharField(default="#0f766e", max_length=20)),
                ("accent_color", models.CharField(default="#f59e0b", max_length=20)),
                ("hero_kicker", models.CharField(blank=True, max_length=140)),
                ("hero_title", models.CharField(blank=True, max_length=220)),
                ("hero_subtitle", models.TextField(blank=True)),
                ("hero_image", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("hero_primary_label", models.CharField(blank=True, max_length=80)),
                ("hero_primary_url", models.CharField(blank=True, max_length=260)),
                ("hero_secondary_label", models.CharField(blank=True, max_length=80)),
                ("hero_secondary_url", models.CharField(blank=True, max_length=260)),
                ("about_title", models.CharField(blank=True, max_length=220)),
                ("about_body", models.TextField(blank=True)),
                ("about_image", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("about_highlights", models.JSONField(blank=True, default=list)),
                ("contact_title", models.CharField(blank=True, max_length=220)),
                ("contact_body", models.TextField(blank=True)),
                ("contact_email", models.EmailField(blank=True, max_length=254)),
                ("contact_phone", models.CharField(blank=True, max_length=40)),
                ("contact_address", models.TextField(blank=True)),
                ("office_hours", models.CharField(blank=True, max_length=180)),
                ("map_url", models.URLField(blank=True)),
                ("chat_enabled", models.BooleanField(default=True)),
                ("chat_title", models.CharField(blank=True, max_length=160)),
                ("chat_welcome_message", models.CharField(blank=True, max_length=260)),
                ("whatsapp_number", models.CharField(blank=True, max_length=40)),
                ("telegram_url", models.URLField(blank=True)),
                ("messenger_url", models.URLField(blank=True)),
                ("seo_title", models.CharField(blank=True, max_length=180)),
                ("seo_description", models.CharField(blank=True, max_length=320)),
                ("seo_keywords", models.CharField(blank=True, max_length=320)),
                ("social_image", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("footer_note", models.CharField(blank=True, max_length=220)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_public_site_settings",
                        to="app.user",
                    ),
                ),
                (
                    "tenant",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="public_site_settings",
                        to="app.tenant",
                    ),
                ),
            ],
            options={
                "verbose_name": "Tenant public site settings",
                "verbose_name_plural": "Tenant public site settings",
            },
        ),
        migrations.CreateModel(
            name="PublicCourseProgram",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=220)),
                ("slug", models.SlugField(blank=True, max_length=240)),
                ("summary", models.CharField(blank=True, max_length=320)),
                ("description", models.TextField(blank=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("duration", models.CharField(blank=True, max_length=120)),
                ("price_label", models.CharField(blank=True, max_length=120)),
                ("level", models.CharField(blank=True, max_length=120)),
                ("mode", models.CharField(blank=True, max_length=120)),
                ("button_label", models.CharField(blank=True, max_length=80)),
                ("button_url", models.CharField(blank=True, max_length=260)),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(default=False)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "tenant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="%(class)ss",
                        to="app.tenant",
                    ),
                ),
            ],
            options={
                "ordering": ["order", "title"],
                "indexes": [
                    models.Index(fields=["tenant", "is_published"], name="app_publicc_tenant__51759d_idx"),
                    models.Index(fields=["tenant", "slug"], name="app_publicc_tenant__adb79b_idx"),
                ],
                "unique_together": {("tenant", "slug")},
            },
        ),
        migrations.CreateModel(
            name="PublicAnnouncement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=240)),
                ("slug", models.SlugField(blank=True, max_length=260)),
                ("summary", models.CharField(blank=True, max_length=360)),
                ("body", models.TextField()),
                ("image", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("is_featured", models.BooleanField(default=False)),
                ("is_published", models.BooleanField(default=False)),
                ("published_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "tenant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="%(class)ss",
                        to="app.tenant",
                    ),
                ),
            ],
            options={
                "ordering": ["-published_at", "-created_at"],
                "indexes": [
                    models.Index(fields=["tenant", "is_published", "published_at"], name="app_publica_tenant__63aeb6_idx"),
                    models.Index(fields=["tenant", "slug"], name="app_publica_tenant__422b71_idx"),
                ],
                "unique_together": {("tenant", "slug")},
            },
        ),
        migrations.CreateModel(
            name="PublicEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=240)),
                ("slug", models.SlugField(blank=True, max_length=260)),
                ("summary", models.CharField(blank=True, max_length=360)),
                ("description", models.TextField(blank=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("location", models.CharField(blank=True, max_length=220)),
                ("starts_at", models.DateTimeField()),
                ("ends_at", models.DateTimeField(blank=True, null=True)),
                ("is_published", models.BooleanField(default=False)),
                ("is_featured", models.BooleanField(default=False)),
                ("order", models.PositiveIntegerField(default=0)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "tenant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="%(class)ss",
                        to="app.tenant",
                    ),
                ),
            ],
            options={
                "ordering": ["starts_at", "order", "title"],
                "indexes": [
                    models.Index(fields=["tenant", "is_published", "starts_at"], name="app_publice_tenant__14dbbe_idx"),
                    models.Index(fields=["tenant", "slug"], name="app_publice_tenant__ff93ed_idx"),
                ],
                "unique_together": {("tenant", "slug")},
            },
        ),
        migrations.CreateModel(
            name="PublicAchievement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=240)),
                ("slug", models.SlugField(blank=True, max_length=260)),
                ("description", models.TextField(blank=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to=app.models.public_site_upload_path)),
                ("metric_value", models.CharField(blank=True, max_length=80)),
                ("metric_label", models.CharField(blank=True, max_length=120)),
                ("achieved_on", models.DateField(blank=True, null=True)),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_published", models.BooleanField(default=False)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "tenant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="%(class)ss",
                        to="app.tenant",
                    ),
                ),
            ],
            options={
                "ordering": ["order", "-achieved_on", "title"],
                "indexes": [
                    models.Index(fields=["tenant", "is_published"], name="app_publica_tenant__967a27_idx"),
                    models.Index(fields=["tenant", "slug"], name="app_publica_tenant__9986e9_idx"),
                ],
                "unique_together": {("tenant", "slug")},
            },
        ),
        migrations.CreateModel(
            name="PublicInquiry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("visitor_name", models.CharField(max_length=160)),
                ("visitor_email", models.EmailField(blank=True, max_length=254)),
                ("visitor_phone", models.CharField(blank=True, max_length=40)),
                ("subject", models.CharField(blank=True, max_length=200)),
                ("message", models.TextField()),
                ("source", models.CharField(choices=[("contact", "Contact"), ("chat", "Chat")], default="contact", max_length=20)),
                ("status", models.CharField(choices=[("new", "New"), ("read", "Read"), ("closed", "Closed")], default="new", max_length=20)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_%(class)ss",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "tenant",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="%(class)ss",
                        to="app.tenant",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["tenant", "status"], name="app_publici_tenant__62e28b_idx"),
                    models.Index(fields=["tenant", "source"], name="app_publici_tenant__fbcc8a_idx"),
                ],
            },
        ),
    ]
