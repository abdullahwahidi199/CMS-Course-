from collections import defaultdict

from django.db import transaction
from django.utils.text import slugify

from .models import RBACPermission, Role

FIXED_ROLE_SLUGS = {"super-admin", "super_admin", "student"}

MODULE_ACTIONS = {
    "dashboard": ["view", "manage"],
    "students": ["view", "create", "update", "delete", "export", "print", "manage"],
    "attendance": ["view", "create", "update", "delete", "export", "manage", "mark", "edit", "approve", "reports"],
    "teachers": ["view", "create", "update", "delete", "export", "manage"],
    "staff": ["view", "create", "update", "delete", "manage"],
    "courses": ["view", "create", "update", "delete", "manage"],
    "batches": ["view", "create", "update", "delete", "manage"],
    "fees": ["view", "create", "update", "delete", "collect_payment", "refund", "export", "print", "manage"],
    "expenses": ["view", "create", "update", "delete", "manage_categories", "reports", "manage"],
    "assessments": ["view", "create", "update", "delete", "publish", "grade", "export", "print", "manage"],
    "stationery": ["view", "create", "update", "delete", "stock_in", "stock_out", "sell", "export", "print", "manage"],
    "inventory": ["view", "adjust", "stock_in", "stock_out", "export", "manage"],
    "reports": ["view", "export", "print", "manage"],
    "users": ["view", "create", "update", "delete", "activate", "deactivate", "reset_password", "assign_role", "export", "manage"],
    "roles": ["view", "create", "update", "delete", "clone", "assign_users", "manage"],
    "settings": ["view", "update", "manage"],
    "notifications": ["view", "update", "delete", "manage"],
    "online-page": ["view", "create", "update", "delete", "publish", "approve", "manage"],
}

SYSTEM_ROLE_PERMISSIONS = {
    "super-admin": ["*"],
    "admin": ["*"],
    "teacher": [
        "dashboard.view",
        "students.view",
        "attendance.view",
        "attendance.create",
        "attendance.update",
        "attendance.mark",
        "courses.view",
        "batches.view",
        "assessments.view",
        "assessments.create",
        "assessments.update",
        "assessments.publish",
        "assessments.grade",
        "reports.view",
        "notifications.view",
        "notifications.update",
    ],
    "student": [
        "dashboard.view",
        "fees.view",
        "assessments.view",
        "stationery.view",
        "notifications.view",
        "notifications.update",
    ],
}

STUDENT_PERMISSION_CODES = set(SYSTEM_ROLE_PERMISSIONS["student"])


def normalized_role_slug(role_or_slug):
    slug = getattr(role_or_slug, "slug", role_or_slug) or ""
    return str(slug).lower().replace("_", "-")


def is_super_admin_slug(role_or_slug):
    return normalized_role_slug(role_or_slug) == "super-admin"


def is_student_slug(role_or_slug):
    return normalized_role_slug(role_or_slug) == "student"


def is_fixed_permission_role(role_or_slug):
    return is_super_admin_slug(role_or_slug) or is_student_slug(role_or_slug)


def expand_legacy_classes_codes(codes):
    expanded = set()
    for code in codes:
        if code.startswith("classes."):
            action = code.split(".", 1)[1]
            expanded.add(f"courses.{action}")
            expanded.add(f"batches.{action}")
        else:
            expanded.add(code)
    return {code for code in expanded if not code.startswith("classes.")}

MENU_DEFINITIONS = [
    {"label": "Home", "path": "/admin/dashboard", "permission": "dashboard.view"},
    {"label": "Operations", "path": "operations", "permission": "dashboard.view"},
    {"label": "Users", "path": "users", "permission": "users.view"},
    {"label": "Roles & Permissions", "path": "roles", "permission": "roles.view"},
    {"label": "Assessments", "path": "assessments", "permission": "assessments.view"},
    {"label": "Billing", "path": "billing", "permission": "fees.view"},
    {"label": "Stationery", "path": "stationery", "permission": "stationery.view"},
    {"label": "Reports", "path": "reports", "permission": "reports.view"},
    {"label": "Notifications", "path": "notifications", "permission": "notifications.view"},
    {"label": "Online Page", "path": "online-page", "permission": "online-page.view"},
    {"label": "Admission", "path": "addmission", "permission": "students.create"},
    {"label": "Courses", "path": "courses", "permission": "courses.view"},
    {"label": "Batches", "path": "classes", "permission": "batches.view"},
    {"label": "Attendance", "path": "attendence", "permission": "attendance.view"},
    {"label": "Teachers", "path": "teachers", "permission": "teachers.view"},
    {"label": "Staff", "path": "staff", "permission": "staff.view"},
    {"label": "Settings", "path": "settings", "permission": "settings.view"},
    {"label": "Expenses", "path": "expenses", "permission": "expenses.view"},
    {"label": "Timetable", "path": "school/timetable", "permission": "batches.view"},
    {"label": "Rooms", "path": "rooms", "permission": "batches.manage"},
]


def permission_code(module, action):
    return f"{module}.{action}".lower().replace(" ", "_")


def expected_permission_codes():
    return {permission_code(module, action) for module, actions in MODULE_ACTIONS.items() for action in actions}


def permissions_are_seeded():
    existing = set(RBACPermission.objects.filter(code__in=expected_permission_codes()).values_list("code", flat=True))
    return expected_permission_codes().issubset(existing)


def migrate_legacy_classes_permissions(permissions, tenant=None):
    legacy_permissions = RBACPermission.objects.filter(module="classes", is_active=True)
    if not legacy_permissions.exists():
        return
    roles = Role.objects.filter(permissions__in=legacy_permissions).distinct()
    if tenant is not None:
        roles = roles.filter(tenant=tenant)
    for role in roles:
        additions = []
        for legacy in legacy_permissions.filter(roles=role):
            for module in ["courses", "batches"]:
                replacement = permissions.get(permission_code(module, legacy.action))
                if replacement:
                    additions.append(replacement)
        if additions:
            role.permissions.add(*additions)


@transaction.atomic
def seed_permissions_and_roles(tenant=None, user=None, migrate_legacy=True):
    permissions = {}
    for module, actions in MODULE_ACTIONS.items():
        for action in actions:
            code = permission_code(module, action)
            permission, _ = RBACPermission.objects.get_or_create(
                code=code,
                defaults={
                    "module": module,
                    "action": action,
                    "label": f"{module.replace('_', ' ').title()} {action.replace('_', ' ').title()}",
                },
            )
            permissions[code] = permission

    if migrate_legacy:
        migrate_legacy_classes_permissions(permissions, tenant)

    for role_name, codes in SYSTEM_ROLE_PERMISSIONS.items():
        role, _ = Role.objects.get_or_create(
            tenant=tenant,
            slug=slugify(role_name),
            defaults={
                "name": role_name.replace("_", " ").title(),
                "is_system": True,
                "created_by": user,
            },
        )
        if codes == ["*"]:
            role.permissions.set(permissions.values())
        else:
            role.permissions.set([permissions[code] for code in codes if code in permissions])
    return permissions


def sync_wildcard_role_permissions(permissions, tenant=None):
    wildcard_slugs = [slugify(role_name) for role_name, codes in SYSTEM_ROLE_PERMISSIONS.items() if codes == ["*"]]
    roles = Role.objects.filter(slug__in=wildcard_slugs)
    if tenant is not None:
        roles = roles.filter(tenant=tenant)
    for role in roles:
        existing_ids = set(role.permissions.values_list("id", flat=True))
        missing = [permission for permission in permissions.values() if permission.id not in existing_ids]
        if missing:
            role.permissions.add(*missing)


def seed_missing_permissions(tenant=None, user=None):
    if permissions_are_seeded():
        permissions = {
            permission.code: permission
            for permission in RBACPermission.objects.filter(code__in=expected_permission_codes())
        }
        sync_wildcard_role_permissions(permissions, tenant)
        return permissions
    permissions = seed_permissions_and_roles(tenant, user, migrate_legacy=False)
    sync_wildcard_role_permissions(permissions, tenant)
    return permissions


def ensure_user_role(user):
    if not user or not user.is_authenticated:
        return None
    if not user.role_id or not user.role or not user.role.is_active or user.role.is_archived:
        return None
    return user.role


def effective_permission_codes(user):
    if not user or not user.is_authenticated or user.is_deactivated or not user.is_active:
        return set()
    if user.is_super_admin:
        seed_missing_permissions(None, user)
        return set(RBACPermission.objects.filter(is_active=True).exclude(module="classes").values_list("code", flat=True))
    role = ensure_user_role(user)
    if not role:
        return set()
    if is_student_slug(role):
        return set(STUDENT_PERMISSION_CODES)
    return expand_legacy_classes_codes(role.permissions.filter(is_active=True).values_list("code", flat=True))


def grouped_permissions():
    grouped = defaultdict(list)
    for permission in RBACPermission.objects.filter(is_active=True).exclude(module="classes").order_by("module", "action"):
        grouped[permission.module].append({
            "id": permission.id,
            "code": permission.code,
            "action": permission.action,
            "label": permission.label,
        })
    return grouped


def allowed_menus(user):
    codes = effective_permission_codes(user)
    return [item for item in MENU_DEFINITIONS if item["permission"] in codes]


def can(user, code):
    return code in effective_permission_codes(user)
