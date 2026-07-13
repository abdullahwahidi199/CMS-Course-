from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .enterprise_views import (
    AssessmentResultViewSet,
    AssessmentViewSet,
    DashboardViewSet,
    EnrollmentBillingProfileViewSet,
    FeePlanViewSet,
    InventoryTransactionViewSet,
    InvoiceViewSet,
    NotificationViewSet,
    PaymentViewSet,
    ReportViewSet,
    StationeryItemViewSet,
    StationeryPurchaseViewSet,
    StudentLedgerViewSet,
)
from .auth_views import PermissionViewSet, RoleViewSet, UserViewSet
from .public_admin_views import (
    PublicAchievementViewSet,
    PublicAnnouncementCommentViewSet,
    PublicAnnouncementViewSet,
    PublicCourseProgramViewSet,
    PublicEventViewSet,
    PublicInquiryViewSet,
    TenantPublicSiteSettingsViewSet,
)


router = DefaultRouter()
router.register("users", UserViewSet, basename="v1-users")
router.register("roles", RoleViewSet, basename="v1-roles")
router.register("permissions", PermissionViewSet, basename="v1-permissions")
router.register("assessments", AssessmentViewSet, basename="v1-assessments")
router.register("assessment-results", AssessmentResultViewSet, basename="v1-assessment-results")
router.register("fee-plans", FeePlanViewSet, basename="v1-fee-plans")
router.register("enrollment-billing-profiles", EnrollmentBillingProfileViewSet, basename="v1-enrollment-billing-profiles")
router.register("invoices", InvoiceViewSet, basename="v1-invoices")
router.register("payments", PaymentViewSet, basename="v1-payments")
router.register("student-ledger", StudentLedgerViewSet, basename="v1-student-ledger")
router.register("stationery-items", StationeryItemViewSet, basename="v1-stationery-items")
router.register("inventory-transactions", InventoryTransactionViewSet, basename="v1-inventory-transactions")
router.register("stationery-purchases", StationeryPurchaseViewSet, basename="v1-stationery-purchases")
router.register("dashboards", DashboardViewSet, basename="v1-dashboards")
router.register("reports", ReportViewSet, basename="v1-reports")
router.register("notifications", NotificationViewSet, basename="v1-notifications")
router.register("online-page/settings", TenantPublicSiteSettingsViewSet, basename="v1-online-page-settings")
router.register("online-page/courses", PublicCourseProgramViewSet, basename="v1-online-page-courses")
router.register("online-page/announcements", PublicAnnouncementViewSet, basename="v1-online-page-announcements")
router.register("online-page/comments", PublicAnnouncementCommentViewSet, basename="v1-online-page-comments")
router.register("online-page/events", PublicEventViewSet, basename="v1-online-page-events")
router.register("online-page/achievements", PublicAchievementViewSet, basename="v1-online-page-achievements")
router.register("online-page/inquiries", PublicInquiryViewSet, basename="v1-online-page-inquiries")

urlpatterns = [
    path("", include(router.urls)),
]
