from rest_framework.permissions import BasePermission

from .rbac import can


RESOURCE_MODULES = {
    "assessment-results": "assessments",
    "assessments": "assessments",
    "fee-plans": "fees",
    "enrollment-billing-profiles": "fees",
    "invoices": "fees",
    "payments": "fees",
    "student-ledger": "fees",
    "stationery-items": "stationery",
    "inventory-transactions": "inventory",
    "stationery-purchases": "stationery",
    "dashboards": "dashboard",
    "reports": "reports",
    "notifications": "notifications",
    "users": "users",
    "roles": "roles",
    "permissions": "roles",
    "courses": "courses",
    "batches": "batches",
    "online-page": "online-page",
}

ACTION_PERMISSIONS = {
    "get": "view",
    "head": "view",
    "options": "view",
    "post": "create",
    "put": "update",
    "patch": "update",
    "delete": "delete",
    "list": "view",
    "retrieve": "view",
    "create": "create",
    "update": "update",
    "partial_update": "update",
    "destroy": "delete",
    "bulk_results": "grade",
    "bulk_upload": "grade",
    "dashboard": "view",
    "open": "create",
    "mark": "mark",
    "approve": "approve",
    "lock": "manage",
    "publish": "publish",
    "unpublish": "publish",
    "close": "update",
    "archive": "update",
    "duplicate": "create",
    "generate_monthly": "create",
    "receipt": "print",
    "pdf": "print",
    "cancel": "update",
    "waive": "manage",
    "apply_discount": "update",
    "apply_scholarship": "manage",
    "reverse": "manage",
    "outstanding": "view",
    "revenue_summary": "view",
    "history": "view",
    "stock_in": "stock_in",
    "stock_out": "stock_out",
    "adjust": "adjust",
    "admin": "view",
    "teacher": "view",
    "student": "view",
    "attendance": "view",
    "assessments": "view",
    "fees": "view",
    "revenue": "view",
    "students": "view",
    "teachers": "view",
    "inventory": "view",
    "stationery_sales": "view",
    "mark_read": "update",
    "hide": "update",
    "spam": "update",
    "activate": "activate",
    "deactivate": "deactivate",
    "reset_password": "reset_password",
    "change_role": "assign_role",
    "clone": "clone",
    "assign_users": "assign_users",
    "matrix": "view",
    "set_permission": "manage",
}

ACTION_METHOD_PERMISSIONS = {
    "current": {
        "get": "view",
        "head": "view",
        "options": "view",
        "patch": "update",
        "put": "update",
    },
}


class HasRBACPermission(BasePermission):
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_deactivated or not request.user.is_active:
            return False

        resource = getattr(view, "rbac_resource", None)
        action = getattr(view, "action", None) or getattr(request, "method", "").lower()
        module = RESOURCE_MODULES.get(resource, resource)
        method = getattr(request, "method", "").lower()
        permission_action = ACTION_METHOD_PERMISSIONS.get(action, {}).get(method) or ACTION_PERMISSIONS.get(action)
        if not module or not permission_action:
            return False
        return can(request.user, f"{module}.{permission_action}")
