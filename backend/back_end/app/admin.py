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
    StationeryItem,
    StationeryPurchase,
    StationeryPurchaseItem,
    StudentLedgerEntry,
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
    list_display = ("receipt_number", "student", "date", "total", "payment_status")
    list_filter = ("payment_status", "date")
    search_fields = ("receipt_number", "student__name")
    inlines = [StationeryPurchaseItemInline]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("recipient", "notification_type", "title", "is_read", "created_at")
    list_filter = ("notification_type", "is_read")
    search_fields = ("recipient__username", "title", "message")
