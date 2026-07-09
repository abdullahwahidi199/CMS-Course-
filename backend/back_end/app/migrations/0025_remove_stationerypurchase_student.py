from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0024_remove_vendors_and_expense_fields"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="stationerypurchase",
            name="app_station_student_6dd846_idx",
        ),
        migrations.RemoveField(
            model_name="stationerypurchase",
            name="student",
        ),
    ]
