from django.contrib import admin
from .models import Students,Teachers,Events,Classes,Attendance,Staff,Expenses,ExpenseHistory,RoomOfClass,User,Marks,Assignment,Submission
from .models import Tenant
from .models import (
    Assessment,
    AssessmentResult,
    Course,
    Enrollment,
    EnrollmentBillingProfile,
    FeePlan,
    InventoryTransaction,
    Invoice,
    Notification,
    Payment,
    PublicAchievement,
    PublicAnnouncement,
    PublicAnnouncementComment,
    PublicCourseProgram,
    PublicEvent,
    PublicInquiry,
    StationeryItem,
    StationeryPurchase,
    StationeryPurchaseItem,
    StudentLedgerEntry,
    TenantPublicSiteSettings,
    RBACPermission,
    Role,
)
# Register your models here.
admin.site.register(Tenant),
admin.site.register(Students),
admin.site.register(Teachers),
admin.site.register(Events),
admin.site.register(Classes),
admin.site.register(Attendance),
admin.site.register(Staff),
admin.site.register(Expenses),
admin.site.register(ExpenseHistory),
admin.site.register(User),
admin.site.register(Marks),
admin.site.register(Assignment),
admin.site.register(Submission)
admin.site.register(RBACPermission)
admin.site.register(Role)
admin.site.register(Course)
admin.site.register(Enrollment)


# admin.site.register(RoomOfClass)


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "teacher", "assessment_type", "status", "assessment_date")
    list_filter = ("status", "assessment_type", "assessment_date")
    search_fields = ("title", "course__name", "teacher__full_name")


@admin.register(AssessmentResult)
class AssessmentResultAdmin(admin.ModelAdmin):
    list_display = ("assessment", "student", "marks_obtained", "percentage", "grade", "is_passed")
    list_filter = ("grade", "is_passed")
    search_fields = ("assessment__title", "student__name")


@admin.register(FeePlan)
class FeePlanAdmin(admin.ModelAdmin):
    list_display = ("course", "batch", "monthly_fee", "registration_fee", "material_fee", "exam_fee", "currency", "due_day", "is_active")
    list_filter = ("currency", "is_active", "billing_cycle")
    search_fields = ("course__name", "batch__name")


@admin.register(EnrollmentBillingProfile)
class EnrollmentBillingProfileAdmin(admin.ModelAdmin):
    list_display = ("enrollment", "fee_plan", "discount_type", "discount_amount", "billing_status", "billing_start_date")
    list_filter = ("discount_type", "billing_status")
    search_fields = ("enrollment__student__name", "enrollment__course__name", "enrollment__batch__name")


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ("invoice_number", "student", "course", "batch", "billing_month", "billing_year", "final_amount", "paid_amount", "balance", "status")
    list_filter = ("status", "billing_month", "billing_year")
    search_fields = ("invoice_number", "student__name", "student__role_number", "course__name", "batch__name")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("receipt_number", "invoice", "student", "payment_date", "payment_method", "amount_paid", "received_by")
    list_filter = ("payment_method", "payment_date")
    search_fields = ("receipt_number", "invoice__invoice_number", "invoice__student__name")


@admin.register(StudentLedgerEntry)
class StudentLedgerEntryAdmin(admin.ModelAdmin):
    list_display = ("student", "description", "debit", "credit", "balance", "created_at")
    search_fields = ("student__name", "description")


@admin.register(StationeryItem)
class StationeryItemAdmin(admin.ModelAdmin):
    list_display = ("item_name", "sku", "category", "quantity", "minimum_stock", "status", "selling_price")
    list_filter = ("category", "status")
    search_fields = ("item_name", "sku", "barcode", "supplier")


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ("item", "transaction_type", "quantity", "unit_price", "reference", "created_at")
    list_filter = ("transaction_type",)
    search_fields = ("item__item_name", "reference")


class StationeryPurchaseItemInline(admin.TabularInline):
    model = StationeryPurchaseItem
    extra = 0


@admin.register(StationeryPurchase)
class StationeryPurchaseAdmin(admin.ModelAdmin):
    list_display = ("receipt_number", "date", "total", "payment_status")
    list_filter = ("payment_status", "date")
    search_fields = ("receipt_number",)
    inlines = [StationeryPurchaseItemInline]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "notification_type", "title", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")
    search_fields = ("recipient__username", "title", "message")


@admin.register(TenantPublicSiteSettings)
class TenantPublicSiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("tenant", "center_name", "is_published", "updated_at")
    list_filter = ("is_published",)
    search_fields = ("tenant__name", "center_name", "hero_title")


@admin.register(PublicCourseProgram)
class PublicCourseProgramAdmin(admin.ModelAdmin):
    list_display = ("title", "tenant", "is_published", "order", "updated_at")
    list_filter = ("is_published",)
    search_fields = ("title", "tenant__name", "summary")


@admin.register(PublicAnnouncement)
class PublicAnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "tenant", "category", "is_published", "is_featured", "published_at")
    list_filter = ("is_published", "is_featured", "category")
    search_fields = ("title", "tenant__name", "summary", "body", "category")


@admin.register(PublicAnnouncementComment)
class PublicAnnouncementCommentAdmin(admin.ModelAdmin):
    list_display = ("visitor_name", "announcement", "tenant", "status", "is_spam", "created_at")
    list_filter = ("status", "is_spam", "created_at")
    search_fields = ("visitor_name", "visitor_email", "body", "announcement__title", "tenant__name")


@admin.register(PublicEvent)
class PublicEventAdmin(admin.ModelAdmin):
    list_display = ("title", "tenant", "starts_at", "is_published", "location")
    list_filter = ("is_published", "starts_at")
    search_fields = ("title", "tenant__name", "summary", "location")


@admin.register(PublicAchievement)
class PublicAchievementAdmin(admin.ModelAdmin):
    list_display = ("title", "tenant", "metric_value", "achieved_on", "is_published")
    list_filter = ("is_published",)
    search_fields = ("title", "tenant__name", "summary", "description")


@admin.register(PublicInquiry)
class PublicInquiryAdmin(admin.ModelAdmin):
    list_display = ("visitor_name", "tenant", "source", "status", "created_at")
    list_filter = ("source", "status")
    search_fields = ("visitor_name", "visitor_email", "visitor_phone", "subject", "message")
