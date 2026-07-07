from collections import defaultdict

from django.db import transaction
from django.utils.text import slugify

from .models import RBACPermission, Role


MODULE_ACTIONS = {
    "dashboard": ["view", "manage"],
    "students": ["view", "create", "update", "delete", "export", "print", "manage"],
    "attendance": ["view", "create", "update", "delete", "export", "manage"],
    "teachers": ["view", "create", "update", "delete", "export", "manage"],
    "staff": ["view", "create", "update", "delete", "manage"],
    "classes": ["view", "create", "update", "delete", "manage"],
    "fees": ["view", "create", "update", "delete", "collect_payment", "refund", "export", "print", "manage"],
    "assessments": ["view", "create", "update", "delete", "publish", "grade", "export", "print", "manage"],
    "stationery": ["view", "create", "update", "delete", "stock_in", "stock_out", "sell", "export", "print", "manage"],
    "inventory": ["view", "adjust", "stock_in", "stock_out", "export", "manage"],
    "reports": ["view", "export", "print", "manage"],
    "users": ["view", "create", "update", "delete", "activate", "deactivate", "reset_password", "assign_role", "export", "manage"],
    "roles": ["view", "create", "update", "delete", "clone", "assign_users", "manage"],
    "settings": ["view", "update", "manage"],
    "notifications": ["view", "update", "delete", "manage"],
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
        "classes.view",
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
    {"label": "Admission", "path": "addmission", "permission": "students.create"},
    {"label": "Classes", "path": "classes", "permission": "classes.view"},
    {"label": "Attendance", "path": "attendence", "permission": "attendance.view"},
    {"label": "Teachers", "path": "teachers", "permission": "teachers.view"},
    {"label": "Staff", "path": "staff", "permission": "staff.view"},
    {"label": "Settings", "path": "settings", "permission": "settings.view"},
    {"label": "Expenses", "path": "expenses", "permission": "fees.view"},
    {"label": "Timetable", "path": "school/timetable", "permission": "classes.view"},
    {"label": "Rooms", "path": "rooms", "permission": "classes.manage"},
]


def permission_code(module, action):
    return f"{module}.{action}".lower().replace(" ", "_")


@transaction.atomic
def seed_permissions_and_roles(tenant=None, user=None):
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
        seed_permissions_and_roles(None, user)
        return set(RBACPermission.objects.filter(is_active=True).values_list("code", flat=True))
    role = ensure_user_role(user)
    if not role:
        return set()
    return set(role.permissions.filter(is_active=True).values_list("code", flat=True))


def grouped_permissions():
    grouped = defaultdict(list)
    for permission in RBACPermission.objects.filter(is_active=True).order_by("module", "action"):
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
