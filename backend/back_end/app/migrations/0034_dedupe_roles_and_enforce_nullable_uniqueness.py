from django.db import migrations, models


def dedupe_roles(apps, schema_editor):
    Role = apps.get_model("app", "Role")
    User = apps.get_model("app", "User")
    role_permissions = Role.permissions.through

    groups = {}
    for role in Role.objects.order_by("tenant_id", "slug", "id").only("id", "tenant_id", "slug"):
        key = (role.tenant_id, role.slug)
        groups.setdefault(key, []).append(role.id)

    for role_ids in groups.values():
        if len(role_ids) < 2:
            continue

        keep_id = role_ids[0]
        duplicate_ids = role_ids[1:]

        permission_ids = list(
            role_permissions.objects.filter(role_id__in=duplicate_ids).values_list("rbacpermission_id", flat=True)
        )
        for permission_id in permission_ids:
            role_permissions.objects.get_or_create(role_id=keep_id, rbacpermission_id=permission_id)

        User.objects.filter(role_id__in=duplicate_ids).update(role_id=keep_id)
        Role.objects.filter(id__in=duplicate_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0033_tenant_subscription_price"),
    ]

    operations = [
        migrations.RunPython(dedupe_roles, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="role",
            constraint=models.UniqueConstraint(
                fields=("tenant", "slug"),
                name="app_role_tenant_slug_unique_nulls_not_distinct",
                nulls_distinct=False,
            ),
        ),
    ]
