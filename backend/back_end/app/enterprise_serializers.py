from calendar import monthrange
from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from .models import (
    Assessment,
    AssessmentResult,
    Classes,
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
    Students,
    Teachers,
)
from .shamsi import CALENDAR_GREGORIAN, CALENDAR_SHAMSI, CalendarModelSerializer, ShamsiDateField, get_module_calendar


class ChoiceFieldSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class AssessmentResultSerializer(CalendarModelSerializer):
    calendar_module = "assessments"
    student_name = serializers.CharField(source="student.name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    assessment_title = serializers.CharField(source="assessment.title", read_only=True)

    class Meta:
        model = AssessmentResult
        fields = [
            "id",
            "assessment",
            "assessment_title",
            "enrollment",
            "student",
            "student_name",
            "course",
            "course_name",
            "batch",
            "batch_name",
            "teacher",
            "teacher_name",
            "marks_obtained",
            "percentage",
            "grade",
            "is_passed",
            "remarks",
            "submitted_by",
            "submitted_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "student",
            "course",
            "batch",
            "teacher",
            "percentage",
            "grade",
            "is_passed",
            "submitted_by",
            "submitted_at",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        assessment = attrs.get("assessment") or getattr(self.instance, "assessment", None)
        enrollment = attrs.get("enrollment") or getattr(self.instance, "enrollment", None)
        marks = attrs.get("marks_obtained", getattr(self.instance, "marks_obtained", None))
        if assessment and marks is not None and Decimal(str(marks)) > assessment.maximum_marks:
            raise serializers.ValidationError({"marks_obtained": "Marks cannot exceed assessment maximum marks."})
        if assessment and enrollment and assessment.batch_id and enrollment.batch_id != assessment.batch_id:
            raise serializers.ValidationError({"enrollment": "Enrollment does not belong to this assessment batch."})
        return attrs


class AssessmentSerializer(CalendarModelSerializer):
    calendar_module = "assessments"
    course_name = serializers.CharField(source="course.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    results = AssessmentResultSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = [
            "id",
            "course",
            "course_name",
            "batch",
            "batch_name",
            "teacher",
            "teacher_name",
            "title",
            "description",
            "assessment_type",
            "maximum_marks",
            "passing_marks",
            "assessment_date",
            "publish_date",
            "status",
            "results",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = ["publish_date", "created_at", "updated_at", "created_by"]

    def validate(self, attrs):
        maximum = attrs.get("maximum_marks", getattr(self.instance, "maximum_marks", None))
        passing = attrs.get("passing_marks", getattr(self.instance, "passing_marks", None))
        if maximum is not None and Decimal(str(maximum)) <= 0:
            raise serializers.ValidationError({"maximum_marks": "Maximum marks must be greater than zero."})
        if passing is not None and maximum is not None:
            passing = Decimal(str(passing))
            maximum = Decimal(str(maximum))
            if passing < 0 or passing > maximum:
                raise serializers.ValidationError({"passing_marks": "Passing marks must be between 0 and maximum marks."})

        batch = attrs.get("batch", getattr(self.instance, "batch", None))
        course = attrs.get("course", getattr(self.instance, "course", None))
        if batch and not course:
            attrs["course"] = batch.course
        if batch and course and batch.course_id and batch.course_id != course.id:
            raise serializers.ValidationError({"course": "Course must match the selected batch."})
        teacher = attrs.get("teacher", getattr(self.instance, "teacher", None))
        if batch and teacher and not batch.teachers.filter(id=teacher.id).exists():
            raise serializers.ValidationError({"teacher": "Teacher is not assigned to this batch."})
        return attrs


class BulkAssessmentResultSerializer(serializers.Serializer):
    assessment = serializers.PrimaryKeyRelatedField(queryset=Assessment.objects.all())
    results = serializers.ListField(child=serializers.DictField(), allow_empty=False)

    def validate_results(self, value):
        for row in value:
            if "enrollment" not in row or "marks_obtained" not in row:
                raise serializers.ValidationError("Each row must include enrollment and marks_obtained.")
        return value


class FeePlanSerializer(CalendarModelSerializer):
    calendar_module = "fees"
    course_name = serializers.CharField(source="course.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)

    class Meta:
        model = FeePlan
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        monthly_fee = attrs.get("monthly_fee", getattr(self.instance, "monthly_fee", None))
        registration_fee = attrs.get("registration_fee", getattr(self.instance, "registration_fee", 0))
        material_fee = attrs.get("material_fee", getattr(self.instance, "material_fee", 0))
        exam_fee = attrs.get("exam_fee", getattr(self.instance, "exam_fee", 0))
        late_fee = attrs.get("late_fee_amount", getattr(self.instance, "late_fee_amount", 0))
        discount_allowed = attrs.get("discount_allowed", getattr(self.instance, "discount_allowed", 0))
        if monthly_fee is not None and Decimal(str(monthly_fee)) <= 0:
            raise serializers.ValidationError({"monthly_fee": "Monthly fee must be greater than zero."})
        due_day = attrs.get("due_day", getattr(self.instance, "due_day", 5))
        if due_day and not 1 <= int(due_day) <= 31:
            raise serializers.ValidationError({"due_day": "Due day must be between 1 and 31."})
        if any(Decimal(str(value or 0)) < 0 for value in [registration_fee, material_fee, exam_fee, late_fee, discount_allowed]):
            raise serializers.ValidationError("Fees and discounts cannot be negative.")
        batch = attrs.get("batch", getattr(self.instance, "batch", None))
        course = attrs.get("course", getattr(self.instance, "course", None))
        if batch and course and batch.course_id and batch.course_id != course.id:
            raise serializers.ValidationError({"batch": "Batch must belong to the selected course."})
        return attrs


class EnrollmentBillingProfileSerializer(CalendarModelSerializer):
    calendar_module = "fees"
    student_name = serializers.CharField(source="enrollment.student.name", read_only=True)
    course_name = serializers.CharField(source="enrollment.course.name", read_only=True)
    batch_name = serializers.CharField(source="enrollment.batch.name", read_only=True)

    class Meta:
        model = EnrollmentBillingProfile
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        discount = attrs.get("discount_amount", getattr(self.instance, "discount_amount", 0))
        if Decimal(str(discount or 0)) < 0:
            raise serializers.ValidationError({"discount_amount": "Discount cannot be negative."})
        fee_plan = attrs.get("fee_plan", getattr(self.instance, "fee_plan", None))
        enrollment = attrs.get("enrollment", getattr(self.instance, "enrollment", None))
        if fee_plan and enrollment and (fee_plan.course_id != enrollment.course_id or (fee_plan.batch_id and fee_plan.batch_id != enrollment.batch_id)):
            raise serializers.ValidationError({"fee_plan": "Fee plan must match the enrollment course or batch."})
        return attrs


class PaymentSerializer(CalendarModelSerializer):
    calendar_module = "fees"
    invoice_number = serializers.CharField(source="invoice.invoice_number", read_only=True)
    student_name = serializers.CharField(source="invoice.student.name", read_only=True)
    course_name = serializers.CharField(source="invoice.course.name", read_only=True)
    batch_name = serializers.CharField(source="invoice.batch.name", read_only=True)
    invoice_discount = serializers.DecimalField(source="invoice.discount", max_digits=10, decimal_places=2, read_only=True)
    invoice_balance = serializers.DecimalField(source="invoice.balance", max_digits=10, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, write_only=True, default=Decimal("0.00"))
    discount_notes = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "receipt_number", "received_by", "created_at", "updated_at"]

    def validate_amount_paid(self, value):
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return value

    def validate(self, attrs):
        invoice = attrs.get("invoice", getattr(self.instance, "invoice", None))
        amount = attrs.get("amount_paid", getattr(self.instance, "amount_paid", None))
        discount = attrs.get("discount_amount", Decimal("0.00"))
        if invoice and amount is not None:
            if invoice.status == Invoice.Status.CANCELLED:
                raise serializers.ValidationError({"invoice": "Payments cannot be recorded against a cancelled invoice."})
            if Decimal(str(discount or 0)) < 0:
                raise serializers.ValidationError({"discount_amount": "Discount cannot be negative."})
            adjusted_balance = Decimal(str(invoice.balance or 0)) - Decimal(str(discount or 0))
            if adjusted_balance < 0:
                raise serializers.ValidationError({"discount_amount": "Discount cannot be greater than the invoice balance."})
            if Decimal(str(amount)) > adjusted_balance:
                raise serializers.ValidationError({"amount_paid": "Payment amount cannot be greater than the invoice balance after discount."})
        return attrs


class InvoiceSerializer(CalendarModelSerializer):
    calendar_module = "invoices"
    student_name = serializers.CharField(source="student.name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)
    enrollment_label = serializers.SerializerMethodField()
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"
        read_only_fields = [
            "tenant",
            "created_by",
            "invoice_number",
            "student",
            "course",
            "batch",
            "billing_month",
            "billing_year",
            "monthly_fee",
            "total_amount",
            "paid_amount",
            "balance",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        month = attrs.get("month", getattr(self.instance, "month", None))
        year = attrs.get("year", getattr(self.instance, "year", None))
        amount = attrs.get("amount", getattr(self.instance, "amount", 0))
        discount = attrs.get("discount", getattr(self.instance, "discount", 0))
        if month and not 1 <= int(month) <= 12:
            raise serializers.ValidationError({"month": "Month must be between 1 and 12."})
        if year and int(year) < 2000:
            raise serializers.ValidationError({"year": "Year is invalid."})
        if Decimal(str(amount or 0)) < 0 or Decimal(str(discount or 0)) < 0:
            raise serializers.ValidationError("Invoice amounts cannot be negative.")
        enrollment = attrs.get("enrollment", getattr(self.instance, "enrollment", None))
        if enrollment:
            attrs["student"] = enrollment.student
            attrs["course"] = enrollment.course
            attrs["batch"] = enrollment.batch
            attrs["billing_month"] = month
            attrs["billing_year"] = year
        return attrs

    def get_enrollment_label(self, obj):
        if not obj.enrollment_id:
            return ""
        course = obj.course.name if obj.course_id else obj.enrollment.course.name
        batch = obj.batch.name if obj.batch_id else obj.enrollment.batch.name
        return f"{course} / {batch}"


class GenerateInvoicesSerializer(serializers.Serializer):
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=1200)
    due_date = ShamsiDateField(required=False, allow_null=True)
    course = serializers.PrimaryKeyRelatedField(queryset=Course.objects.all(), required=False, allow_null=True)
    batch = serializers.PrimaryKeyRelatedField(queryset=Classes.objects.all(), required=False, allow_null=True)
    student = serializers.PrimaryKeyRelatedField(queryset=Students.objects.all(), required=False, allow_null=True)
    enrollment = serializers.PrimaryKeyRelatedField(queryset=Enrollment.objects.all(), required=False, allow_null=True)

    def validate(self, attrs):
        request = self.context.get("request")
        calendar_type = get_module_calendar(getattr(getattr(request, "user", None), "tenant", None), "invoices")
        year = int(attrs.get("year"))
        if calendar_type == CALENDAR_GREGORIAN and year < 2000:
            raise serializers.ValidationError({"year": "Gregorian invoice year must be 2000 or later."})
        if calendar_type == CALENDAR_SHAMSI and not 1200 <= year <= 1700:
            raise serializers.ValidationError({"year": "Shamsi invoice year must be between 1200 and 1700."})
        attrs["period_calendar"] = calendar_type
        return attrs

    def validate_due_date(self, value):
        if value and value < timezone.localdate():
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value


class StudentLedgerEntrySerializer(CalendarModelSerializer):
    calendar_module = "fees"
    student_name = serializers.CharField(source="student.name", read_only=True)

    class Meta:
        model = StudentLedgerEntry
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]


class StationeryItemSerializer(CalendarModelSerializer):
    calendar_module = "inventory"
    class Meta:
        model = StationeryItem
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "status", "created_at", "updated_at"]
        extra_kwargs = {
            "sku": {"required": False, "allow_blank": True},
            "barcode": {"required": False, "allow_blank": True},
        }

    def validate(self, attrs):
        for field in ["cost_price", "selling_price"]:
            value = attrs.get(field, getattr(self.instance, field, 0))
            if Decimal(str(value or 0)) < 0:
                raise serializers.ValidationError({field: "Price cannot be negative."})
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", 0))
        minimum_stock = attrs.get("minimum_stock", getattr(self.instance, "minimum_stock", 0))
        if int(quantity or 0) < 0 or int(minimum_stock or 0) < 0:
            raise serializers.ValidationError("Stock quantities cannot be negative.")
        return attrs


class InventoryTransactionSerializer(CalendarModelSerializer):
    calendar_module = "inventory"
    item_name = serializers.CharField(source="item.item_name", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]


class StockMoveSerializer(serializers.Serializer):
    item = serializers.PrimaryKeyRelatedField(queryset=StationeryItem.objects.all())
    quantity = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    notes = serializers.CharField(required=False, allow_blank=True)


class StationeryPurchaseItemSerializer(CalendarModelSerializer):
    calendar_module = "inventory"
    item_name = serializers.CharField(source="item.item_name", read_only=True)

    class Meta:
        model = StationeryPurchaseItem
        fields = ["id", "item", "item_name", "quantity", "price", "discount", "tax", "total"]
        read_only_fields = ["total"]


class StationeryPurchaseSerializer(CalendarModelSerializer):
    calendar_module = "inventory"
    items = StationeryPurchaseItemSerializer(many=True)

    class Meta:
        model = StationeryPurchase
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "receipt_number", "total", "created_at", "updated_at"]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value


class NotificationSerializer(CalendarModelSerializer):
    calendar_module = "notifications"
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at", "read_at"]


class DashboardSerializer(serializers.Serializer):
    cards = serializers.DictField()
    monthly_revenue = serializers.ListField()
    attendance_trend = serializers.ListField()
    fee_collection = serializers.ListField()
    assessment_performance = serializers.ListField()
