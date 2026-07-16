from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0031_assignment_submission_files"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="subscription_notes",
            field=models.TextField(blank=True),
        ),
    ]
