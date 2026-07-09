from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0025_remove_stationerypurchase_student"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="notification_settings",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AlterField(
            model_name="notification",
            name="notification_type",
            field=models.CharField(
                choices=[
                    ("assessment_published", "Assessment Published"),
                    ("fee_due", "Fee Due"),
                    ("fee_overdue", "Fee Overdue"),
                    ("payment_received", "Payment Received"),
                    ("inventory_low", "Inventory Low"),
                    ("stationery_sale", "Stationery Sale"),
                    ("exam_reminder", "Exam Reminder"),
                ],
                max_length=40,
            ),
        ),
    ]
