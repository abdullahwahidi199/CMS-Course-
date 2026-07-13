from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0028_public_comments_and_content_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="publicachievement",
            name="seo_description",
            field=models.CharField(blank=True, max_length=320),
        ),
        migrations.AddField(
            model_name="publicachievement",
            name="seo_title",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="publicannouncement",
            name="seo_description",
            field=models.CharField(blank=True, max_length=320),
        ),
        migrations.AddField(
            model_name="publicannouncement",
            name="seo_title",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="publiccourseprogram",
            name="seo_description",
            field=models.CharField(blank=True, max_length=320),
        ),
        migrations.AddField(
            model_name="publiccourseprogram",
            name="seo_title",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="publicevent",
            name="seo_description",
            field=models.CharField(blank=True, max_length=320),
        ),
        migrations.AddField(
            model_name="publicevent",
            name="seo_title",
            field=models.CharField(blank=True, max_length=180),
        ),
    ]
