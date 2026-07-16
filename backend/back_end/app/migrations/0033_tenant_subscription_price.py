from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0032_tenant_subscription_notes"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenant",
            name="subscription_price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
