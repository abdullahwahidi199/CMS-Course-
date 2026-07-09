from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0023_alter_expenses_options_and_more"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="expenses",
            name="vendor",
        ),
        migrations.RemoveField(
            model_name="recurringexpense",
            name="vendor",
        ),
        migrations.RemoveField(
            model_name="expenses",
            name="payment_method",
        ),
        migrations.RemoveField(
            model_name="expenses",
            name="status",
        ),
        migrations.RemoveField(
            model_name="expenses",
            name="department",
        ),
        migrations.RemoveField(
            model_name="budget",
            name="department",
        ),
        migrations.DeleteModel(
            name="Vendor",
        ),
    ]
