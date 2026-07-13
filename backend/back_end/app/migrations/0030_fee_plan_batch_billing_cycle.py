from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0029_public_content_seo_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="feeplan",
            name="billing_cycle",
            field=models.CharField(
                choices=[
                    ("monthly", "Monthly"),
                    ("batch", "Batch / One-time"),
                ],
                default="monthly",
                max_length=20,
            ),
        ),
    ]
