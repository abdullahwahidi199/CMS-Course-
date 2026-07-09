from django.db.models import Q
from django.utils import timezone

from ..models import Invoice, Notification, StationeryItem


DEFAULT_NOTIFICATION_SETTINGS = {
    "assessment_published": True,
    "fee_due": True,
    "fee_overdue": True,
    "payment_received": True,
    "inventory_low": True,
    "stationery_sale": True,
    "exam_reminder": True,
    "admin_copies": True,
}


ADMIN_ROLE_SLUGS = ["admin", "super-admin", "super_admin"]


def tenant_notification_settings(tenant):
    configured = getattr(tenant, "notification_settings", None) or {}
    return {**DEFAULT_NOTIFICATION_SETTINGS, **configured}


def notification_enabled(tenant, notification_type):
    return bool(tenant_notification_settings(tenant).get(notification_type, True))


def admin_recipients(tenant):
    if not tenant:
        return []
    return list(
        tenant.users.filter(
            Q(is_active=True),
            Q(role__slug__in=ADMIN_ROLE_SLUGS) | Q(is_superuser=True),
        ).distinct()
    )


def send_notification(*, tenant, recipients, notification_type, title, message, metadata=None, created_by=None, dedupe_key=""):
    if not tenant or not notification_enabled(tenant, notification_type):
        return []

    created = []
    metadata = metadata or {}
    if dedupe_key:
        metadata = {**metadata, "dedupe_key": dedupe_key}

    for recipient in recipients:
        if not recipient:
            continue
        if dedupe_key and Notification.objects.filter(
            tenant=tenant,
            recipient=recipient,
            notification_type=notification_type,
            is_read=False,
            metadata__dedupe_key=dedupe_key,
        ).exists():
            continue
        created.append(
            Notification(
                tenant=tenant,
                recipient=recipient,
                notification_type=notification_type,
                title=title,
                message=message,
                metadata=metadata,
                created_by=created_by,
            )
        )

    if created:
        Notification.objects.bulk_create(created)
    return created


def notify_admins(*, tenant, notification_type, title, message, metadata=None, created_by=None, dedupe_key=""):
    if not tenant_notification_settings(tenant).get("admin_copies", True):
        return []
    return send_notification(
        tenant=tenant,
        recipients=admin_recipients(tenant),
        notification_type=notification_type,
        title=title,
        message=message,
        metadata=metadata,
        created_by=created_by,
        dedupe_key=dedupe_key,
    )


def ensure_notification_backlog(user):
    tenant = getattr(user, "tenant", None)
    if not tenant:
        return

    today = timezone.localdate()
    role_slug = user.role.slug if getattr(user, "role_id", None) else ""
    is_admin = user.is_super_admin or role_slug in ADMIN_ROLE_SLUGS

    if is_admin:
        for item in StationeryItem.objects.filter(
            tenant=tenant,
            status__in=[StationeryItem.Status.LOW_STOCK, StationeryItem.Status.OUT_OF_STOCK],
        )[:50]:
            send_notification(
                tenant=tenant,
                recipients=[user],
                notification_type=Notification.NotificationType.INVENTORY_LOW,
                title="Inventory needs attention",
                message=f"{item.item_name} has {item.quantity} in stock. Minimum is {item.minimum_stock}.",
                metadata={"item_id": item.id},
                dedupe_key=f"inventory:{item.id}:{item.status}",
            )

        for invoice in Invoice.objects.filter(
            tenant=tenant,
            status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE],
            due_date__lte=today,
        ).select_related("student")[:50]:
            send_notification(
                tenant=tenant,
                recipients=[user],
                notification_type=Notification.NotificationType.FEE_OVERDUE if invoice.due_date < today else Notification.NotificationType.FEE_DUE,
                title="Fee collection follow-up",
                message=f"{invoice.student.name} has invoice {invoice.invoice_number} due with balance {invoice.balance}.",
                metadata={"invoice_id": invoice.id},
                dedupe_key=f"admin-invoice:{invoice.id}:{invoice.status}",
            )

    student = getattr(user, "student_profile", None)
    if student:
        for invoice in Invoice.objects.filter(
            tenant=tenant,
            student=student,
            status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE],
            due_date__lte=today,
        )[:20]:
            send_notification(
                tenant=tenant,
                recipients=[user],
                notification_type=Notification.NotificationType.FEE_OVERDUE if invoice.due_date < today else Notification.NotificationType.FEE_DUE,
                title="Fee payment reminder",
                message=f"Invoice {invoice.invoice_number} has balance {invoice.balance}.",
                metadata={"invoice_id": invoice.id},
                dedupe_key=f"student-invoice:{invoice.id}:{invoice.status}",
            )
