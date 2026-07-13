from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0030_fee_plan_batch_billing_cycle"),
    ]

    operations = [
        migrations.AddField(
            model_name="assignment",
            name="attachment",
            field=models.FileField(blank=True, null=True, upload_to="assignment_attachments/"),
        ),
        migrations.AddField(
            model_name="submission",
            name="submitted_file",
            field=models.FileField(blank=True, null=True, upload_to="assignment_submissions/"),
        ),
    ]
