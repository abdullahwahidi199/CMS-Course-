import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0027_public_online_page"),
    ]

    operations = [
        migrations.AddField(
            model_name="publicannouncement",
            name="category",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="publicachievement",
            name="summary",
            field=models.CharField(blank=True, max_length=360),
        ),
        migrations.AddIndex(
            model_name="publicannouncement",
            index=models.Index(fields=["tenant", "category"], name="app_publica_tenant__17bd9f_idx"),
        ),
        migrations.CreateModel(
            name="PublicAnnouncementComment",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("visitor_name", models.CharField(max_length=160)),
                ("visitor_email", models.EmailField(blank=True, max_length=254)),
                ("body", models.TextField()),
                ("status", models.CharField(choices=[("pending", "Pending"), ("approved", "Approved"), ("hidden", "Hidden"), ("spam", "Spam")], default="pending", max_length=20)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.CharField(blank=True, max_length=260)),
                ("is_spam", models.BooleanField(default=False)),
                (
                    "announcement",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="comments", to="app.publicannouncement"),
                ),
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
                "ordering": ["created_at"],
                "indexes": [
                    models.Index(fields=["tenant", "announcement", "status"], name="app_publica_tenant__5ca9fc_idx"),
                    models.Index(fields=["tenant", "status", "created_at"], name="app_publica_tenant__97a2bf_idx"),
                ],
            },
        ),
    ]
