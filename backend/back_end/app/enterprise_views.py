import csv
from html import escape
from decimal import Decimal

from django.db import transaction
from django.db.models import DateField, DateTimeField
from django.db.models import Avg, Count, F, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from django.db.models.functions import TruncMonth
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .enterprise_permissions import HasRBACPermission
from .enterprise_serializers import (
    AssessmentResultSerializer,
    AssessmentSerializer,
    BulkAssessmentResultSerializer,
    EnrollmentBillingProfileSerializer,
    FeePlanSerializer,
    GenerateInvoicesSerializer,
    InventoryTransactionSerializer,
    InvoiceSerializer,
    NotificationSerializer,
    PaymentSerializer,
    StationeryItemSerializer,
    StationeryPurchaseSerializer,
    StockMoveSerializer,
    StudentLedgerEntrySerializer,
)
from .enterprise_services import (
    create_stationery_purchase,
    dashboard_payload,
    generate_monthly_invoices,
    move_stock,
    publish_assessment,
    record_payment,
    refresh_stationery_status,
    save_assessment_result,
)
from .services.billing_service import apply_invoice_discount, cancel_invoice, waive_invoice_balance
from .services.notification_service import ensure_notification_backlog
from .models import (
    Assessment,
    AssessmentResult,
    Attendance,
    Classes,
    Enrollment,
    EnrollmentBillingProfile,
    FeePlan,
    InventoryTransaction,
    Invoice,
    Notification,
    Payment,
    StationeryItem,
    StationeryPurchase,
    StudentLedgerEntry,
    Students,
    Teachers,
)
from .shamsi import convert_query_date, convert_rows_dates, format_calendar_date, get_module_calendar


class TenantScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [HasRBACPermission]
    search_fields = []
    ordering_fields = []
    default_ordering = None
    filter_fields = []

    def get_tenant(self):
        return self.request.user.tenant

    def scope_queryset(self, queryset):
        user = self.request.user
        if user.is_super_admin:
            return queryset
        return queryset.filter(tenant=user.tenant)

    def get_queryset(self):
        queryset = self.scope_queryset(super().get_queryset())
        queryset = self.apply_filters(queryset)
        queryset = self.apply_search(queryset)
        return self.apply_ordering(queryset)

    def apply_filters(self, queryset):
        for field in self.filter_fields:
            value = self.request.query_params.get(field)
            if value not in [None, ""]:
                try:
                    model_field = queryset.model._meta.get_field(field)
                except Exception:
                    model_field = None
                if isinstance(model_field, (DateField, DateTimeField)):
                    module = getattr(self, "rbac_resource", None) or "dashboard"
                    if module == "invoices":
                        module = "invoices"
                    elif module in ["payments", "student-ledger"]:
                        module = "fees"
                    elif module in ["stationery-purchases", "inventory-transactions", "stationery-items"]:
                        module = "inventory"
                    value = convert_query_date(value, self.request.user.tenant, module)
                queryset = queryset.filter(**{field: value})
        return queryset

    def apply_search(self, queryset):
        search = self.request.query_params.get("search")
        if not search or not self.search_fields:
            return queryset
        query = Q()
        for field in self.search_fields:
            query |= Q(**{f"{field}__icontains": search})
        return queryset.filter(query)

    def apply_ordering(self, queryset):
        ordering = self.request.query_params.get("ordering") or self.default_ordering
        if not ordering:
            return queryset
        allowed = set(self.ordering_fields)
        requested = [part.strip() for part in ordering.split(",") if part.strip()]
        safe = [part for part in requested if part.lstrip("-") in allowed]
        return queryset.order_by(*safe) if safe else queryset

    def perform_create(self, serializer):
        serializer.save(tenant=self.get_tenant(), created_by=self.request.user)


def accounting_pdf_response(filename, title, lines):
    y = 780
    commands = ["BT /F1 10 Tf"]
    commands.append(f"40 {y} Td ({escape(str(title))}) Tj")
    y -= 22
    for line in lines:
        safe = escape(str(line)).replace("(", "[").replace(")", "]")[:120]
        commands.append(f"0 -16 Td ({safe}) Tj")
        y -= 16
        if y < 60:
            break
    commands.append("ET")
    stream = "\n".join(commands).encode("latin-1", errors="ignore")
    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        b"5 0 obj << /Length " + str(len(stream)).encode() + b" >> stream\n" + stream + b"\nendstream endobj",
    ]
    pdf = b"%PDF-1.4\n"
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf))
        pdf += obj + b"\n"
    xref = len(pdf)
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    pdf += b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets[1:])
    pdf += f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode()
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}.pdf"'
    return response


def invoice_pdf(invoice):
    tenant = invoice.tenant
    return accounting_pdf_response(
        invoice.invoice_number,
        f"Invoice {invoice.invoice_number}",
        [
            tenant.name if tenant else "Institute",
            getattr(tenant, "address", "") if tenant else "",
            f"Phone: {getattr(tenant, 'phone', '') if tenant else ''} Email: {getattr(tenant, 'email', '') if tenant else ''}",
            f"Invoice date: {format_calendar_date(invoice.created_at.date(), get_module_calendar(tenant, 'invoices'))}",
            f"Due date: {format_calendar_date(invoice.due_date, get_module_calendar(tenant, 'invoices'))}",
            f"Student ID: {invoice.student.student_number or invoice.student.id}",
            f"Student: {invoice.student.name}",
            f"Username: {invoice.student.user.username if invoice.student.user_id else ''}",
            f"Course: {invoice.course.name if invoice.course_id else ''}",
            f"Batch: {invoice.batch.name if invoice.batch_id else ''}",
            f"Billing period: {invoice.billing_month or invoice.month}/{invoice.billing_year or invoice.year}",
            f"Monthly course fee: {invoice.monthly_fee}",
            f"Additional fees: {invoice.amount - invoice.monthly_fee}",
            f"Discount: {invoice.discount}",
            f"Late fee: {invoice.late_fee}",
            f"Previous balance: {invoice.previous_balance}",
            f"Total amount: {invoice.final_amount}",
            f"Amount paid: {invoice.paid_amount}",
            f"Remaining balance: {invoice.balance}",
            f"Status: {invoice.status}",
            "Terms: Please pay by the due date. Keep this document for your records.",
            "Authorized signature: ____________________",
        ],
    )


def receipt_pdf(payment):
    invoice = payment.invoice
    tenant = payment.tenant
    return accounting_pdf_response(
        payment.receipt_number,
        f"Receipt {payment.receipt_number}",
        [
            tenant.name if tenant else "Institute",
            f"Payment date: {format_calendar_date(payment.payment_date, get_module_calendar(tenant, 'fees'))}",
            f"Student ID: {payment.student.student_number if payment.student_id else ''}",
            f"Student: {payment.student.name if payment.student_id else ''}",
            f"Course: {payment.enrollment.course.name if payment.enrollment_id else invoice.course.name if invoice.course_id else ''}",
            f"Batch: {payment.enrollment.batch.name if payment.enrollment_id else invoice.batch.name if invoice.batch_id else ''}",
            f"Invoice: {invoice.invoice_number}",
            f"Method: {payment.payment_method}",
            f"Amount paid: {payment.amount_paid}",
            f"Remaining balance: {invoice.balance}",
            f"Received by: {payment.received_by.get_full_name() or payment.received_by.username}",
            f"Reference: {payment.reference_number}",
            f"Notes: {payment.notes}",
            "Signature: ____________________",
        ],
    )


class AssessmentViewSet(TenantScopedViewSet):
    rbac_resource = "assessments"
    serializer_class = AssessmentSerializer
    queryset = Assessment.objects.select_related("tenant", "course", "batch", "teacher", "created_by").prefetch_related("results")
    search_fields = ["title", "description", "course__name", "teacher__full_name"]
    ordering_fields = ["assessment_date", "publish_date", "created_at", "title"]
    default_ordering = "-assessment_date"
    filter_fields = ["course", "batch", "teacher", "assessment_type", "status"]

    def get_queryset(self):
        queryset = super().get_queryset()
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")
        if date_from:
            queryset = queryset.filter(assessment_date__gte=convert_query_date(date_from, self.request.user.tenant, "assessments"))
        if date_to:
            queryset = queryset.filter(assessment_date__lte=convert_query_date(date_to, self.request.user.tenant, "assessments"))
        user = self.request.user
        role_slug = user.role.slug if user.role_id else ""
        if role_slug == "teacher" and hasattr(user, "teacher_profile"):
            queryset = queryset.filter(teacher=user.teacher_profile)
        if role_slug == "student" and hasattr(user, "student_profile"):
            queryset = queryset.filter(batch__enrollments__student=user.student_profile, status=Assessment.Status.PUBLISHED).distinct()
        return queryset

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        assessment = self.get_object()
        assessment = publish_assessment(assessment, request.user)
        return Response(self.get_serializer(assessment).data)

    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        assessment = self.get_object()
        assessment.status = Assessment.Status.CLOSED
        assessment.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(assessment).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        assessment = self.get_object()
        assessment.status = Assessment.Status.ARCHIVED
        assessment.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(assessment).data)

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        assessment = self.get_object()
        clone = Assessment.objects.create(
            tenant=assessment.tenant,
            course=assessment.course,
            batch=assessment.batch,
            teacher=assessment.teacher,
            title=f"{assessment.title} (Copy)",
            description=assessment.description,
            assessment_type=assessment.assessment_type,
            maximum_marks=assessment.maximum_marks,
            passing_marks=assessment.passing_marks,
            assessment_date=assessment.assessment_date,
            status=Assessment.Status.DRAFT,
            created_by=request.user,
        )
        return Response(self.get_serializer(clone).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="bulk-results")
    def bulk_results(self, request, pk=None):
        assessment = self.get_object()
        serializer = BulkAssessmentResultSerializer(data={"assessment": assessment.id, "results": request.data.get("results", request.data)})
        serializer.is_valid(raise_exception=True)
        results = []
        with transaction.atomic():
            for row in serializer.validated_data["results"]:
                enrollment = Enrollment.objects.select_related("student").get(id=row["enrollment"], tenant=assessment.tenant)
                result = save_assessment_result(
                    assessment=assessment,
                    enrollment=enrollment,
                    marks_obtained=row["marks_obtained"],
                    remarks=row.get("remarks", ""),
                    user=request.user,
                )
                results.append(result)
        return Response(AssessmentResultSerializer(results, many=True).data)


class AssessmentResultViewSet(TenantScopedViewSet):
    rbac_resource = "assessment-results"
    serializer_class = AssessmentResultSerializer
    queryset = AssessmentResult.objects.select_related("tenant", "assessment", "enrollment", "student", "course", "batch", "teacher", "submitted_by")
    search_fields = ["student__name", "assessment__title", "grade"]
    ordering_fields = ["percentage", "grade", "submitted_at", "created_at"]
    filter_fields = ["assessment", "student", "grade", "is_passed"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        role_slug = user.role.slug if user.role_id else ""
        if role_slug == "student" and hasattr(user, "student_profile"):
            queryset = queryset.filter(student=user.student_profile)
        if role_slug == "teacher" and hasattr(user, "teacher_profile"):
            queryset = queryset.filter(assessment__teacher=user.teacher_profile)
        return queryset

    def perform_create(self, serializer):
        result = save_assessment_result(
            assessment=serializer.validated_data["assessment"],
            student=serializer.validated_data["student"],
            marks_obtained=serializer.validated_data["marks_obtained"],
            remarks=serializer.validated_data.get("remarks", ""),
            user=self.request.user,
        )
        serializer.instance = result

    def perform_update(self, serializer):
        result = save_assessment_result(
            assessment=serializer.validated_data.get("assessment", serializer.instance.assessment),
            student=serializer.validated_data.get("student", serializer.instance.student),
            marks_obtained=serializer.validated_data.get("marks_obtained", serializer.instance.marks_obtained),
            remarks=serializer.validated_data.get("remarks", serializer.instance.remarks),
            user=self.request.user,
        )
        serializer.instance = result

    @action(detail=False, methods=["post"], url_path="bulk-upload")
    def bulk_upload(self, request):
        assessment = Assessment.objects.get(id=request.data.get("assessment"), tenant=request.user.tenant)
        rows = request.data.get("results", [])
        results = []
        with transaction.atomic():
            for row in rows:
                enrollment = Enrollment.objects.select_related("student").get(id=row["enrollment"], tenant=request.user.tenant)
                results.append(save_assessment_result(
                    assessment=assessment,
                    enrollment=enrollment,
                    marks_obtained=row["marks_obtained"],
                    remarks=row.get("remarks", ""),
                    user=request.user,
                ))
        return Response(self.get_serializer(results, many=True).data)


class FeePlanViewSet(TenantScopedViewSet):
    rbac_resource = "fee-plans"
    serializer_class = FeePlanSerializer
    queryset = FeePlan.objects.select_related("tenant", "course", "batch", "created_by")
    search_fields = ["course__name", "batch__name", "currency"]
    ordering_fields = ["monthly_fee", "currency", "created_at", "due_day"]
    filter_fields = ["course", "batch", "currency", "is_active"]


class EnrollmentBillingProfileViewSet(TenantScopedViewSet):
    rbac_resource = "enrollment-billing-profiles"
    serializer_class = EnrollmentBillingProfileSerializer
    queryset = EnrollmentBillingProfile.objects.select_related("tenant", "enrollment", "enrollment__student", "enrollment__course", "enrollment__batch", "fee_plan", "created_by")
    search_fields = ["enrollment__student__name", "enrollment__course__name", "enrollment__batch__name", "scholarship"]
    ordering_fields = ["billing_start_date", "billing_status", "created_at"]
    filter_fields = ["enrollment", "fee_plan", "billing_status", "discount_type"]


class InvoiceViewSet(TenantScopedViewSet):
    rbac_resource = "invoices"
    serializer_class = InvoiceSerializer
    queryset = Invoice.objects.select_related("tenant", "enrollment", "student", "course", "batch", "created_by").prefetch_related("payments")
    search_fields = ["invoice_number", "student__name", "student__role_number", "course__name", "batch__name"]
    ordering_fields = ["year", "month", "billing_year", "billing_month", "due_date", "final_amount", "balance", "created_at", "student__name"]
    filter_fields = ["student", "enrollment", "course", "batch", "month", "year", "billing_month", "billing_year", "status"]

    def apply_search(self, queryset):
        search = self.request.query_params.get("search")
        if not search:
            return queryset
        query = Q()
        for field in self.search_fields:
            query |= Q(**{f"{field}__icontains": search})
        if search.isdigit():
            query |= Q(student_id=int(search)) | Q(student__student_number=int(search))
        return queryset.filter(query)

    def get_queryset(self):
        queryset = super().get_queryset()
        payable = self.request.query_params.get("payable")
        if str(payable).lower() in ["1", "true", "yes"]:
            queryset = queryset.exclude(status=Invoice.Status.CANCELLED).filter(balance__gt=0)
        user = self.request.user
        if user.role_id and user.role.slug == "student" and hasattr(user, "student_profile"):
            queryset = queryset.filter(student=user.student_profile)
        return queryset

    def perform_create(self, serializer):
        amount = serializer.validated_data["amount"]
        discount = serializer.validated_data.get("discount") or Decimal("0")
        previous = serializer.validated_data.get("previous_balance") or Decimal("0")
        late_fee = serializer.validated_data.get("late_fee") or Decimal("0")
        final = amount - discount + previous + late_fee
        serializer.save(
            tenant=self.get_tenant(),
            created_by=self.request.user,
            monthly_fee=serializer.validated_data.get("monthly_fee") or amount,
            total_amount=final,
            final_amount=final,
            balance=final,
            billing_month=serializer.validated_data.get("billing_month") or serializer.validated_data.get("month"),
            billing_year=serializer.validated_data.get("billing_year") or serializer.validated_data.get("year"),
            invoice_number=f"INV-MANUAL-{timezone.now():%Y%m%d%H%M%S%f}",
        )

    @action(detail=False, methods=["post"], url_path="generate-monthly")
    def generate_monthly(self, request):
        serializer = GenerateInvoicesSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        invoices = generate_monthly_invoices(
            tenant=request.user.tenant,
            user=request.user,
            **serializer.validated_data,
        )
        return Response(self.get_serializer(invoices, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        try:
            invoice = cancel_invoice(invoice=self.get_object(), user=request.user, notes=request.data.get("notes", ""))
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=["post"])
    def waive(self, request, pk=None):
        invoice = waive_invoice_balance(invoice=self.get_object(), user=request.user, notes=request.data.get("notes", ""))
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=["post"], url_path="apply-discount")
    def apply_discount(self, request, pk=None):
        invoice = apply_invoice_discount(
            invoice=self.get_object(),
            amount=request.data.get("amount", 0),
            user=request.user,
            notes=request.data.get("notes", "Discount applied."),
        )
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=["post"], url_path="apply-scholarship")
    def apply_scholarship(self, request, pk=None):
        invoice = apply_invoice_discount(
            invoice=self.get_object(),
            amount=request.data.get("amount", 0),
            user=request.user,
            notes=request.data.get("notes", "Scholarship applied."),
            transaction_type=StudentLedgerEntry.TransactionType.SCHOLARSHIP_APPLIED,
        )
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=["get"])
    def receipt(self, request, pk=None):
        invoice = self.get_object()
        return Response({
            "invoice": self.get_serializer(invoice).data,
            "payments": PaymentSerializer(invoice.payments.all(), many=True).data,
            "school": invoice.tenant.name if invoice.tenant else "",
        })

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        return invoice_pdf(self.get_object())

    def destroy(self, request, *args, **kwargs):
        return Response({"detail": "Invoices are permanent financial records. Cancel the invoice instead."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=["get"], url_path="revenue-summary")
    def revenue_summary(self, request):
        queryset = self.get_queryset()
        payments = Payment.objects.filter(invoice__in=queryset)
        today = timezone.localdate()
        month_start = today.replace(day=1)
        return Response({
            "expected_monthly_revenue": queryset.filter(billing_year=today.year, billing_month=today.month).aggregate(total=Sum("final_amount"))["total"] or 0,
            "collected_revenue": payments.aggregate(total=Sum("amount_paid"))["total"] or 0,
            "discounts_given": queryset.exclude(status=Invoice.Status.CANCELLED).aggregate(total=Sum("discount"))["total"] or 0,
            "outstanding_revenue": queryset.exclude(status=Invoice.Status.CANCELLED).aggregate(total=Sum("balance"))["total"] or 0,
            "overdue_revenue": queryset.filter(status=Invoice.Status.OVERDUE).aggregate(total=Sum("balance"))["total"] or 0,
            "todays_collections": payments.filter(payment_date=today).aggregate(total=Sum("amount_paid"))["total"] or 0,
            "monthly_collections": payments.filter(payment_date__gte=month_start).aggregate(total=Sum("amount_paid"))["total"] or 0,
            "revenue_by_course": list(queryset.values("course__name").annotate(expected=Sum("final_amount"), collected=Sum("paid_amount"), discounts=Sum("discount"), outstanding=Sum("balance")).order_by("course__name")),
            "revenue_by_month": list(queryset.values("billing_year", "billing_month").annotate(expected=Sum("final_amount"), collected=Sum("paid_amount"), discounts=Sum("discount"), outstanding=Sum("balance")).order_by("billing_year", "billing_month")),
        })


class PaymentViewSet(TenantScopedViewSet):
    rbac_resource = "payments"
    serializer_class = PaymentSerializer
    queryset = Payment.objects.select_related("tenant", "invoice", "student", "enrollment", "enrollment__course", "enrollment__batch", "received_by")
    search_fields = ["receipt_number", "reference_number", "invoice__invoice_number", "student__name"]
    ordering_fields = ["payment_date", "amount_paid", "created_at"]
    filter_fields = ["invoice", "payment_method", "payment_date"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role_id and user.role.slug == "student" and hasattr(user, "student_profile"):
            queryset = queryset.filter(student=user.student_profile)
        return queryset

    def perform_create(self, serializer):
        try:
            payment = record_payment(
                invoice=serializer.validated_data["invoice"],
                amount_paid=serializer.validated_data["amount_paid"],
                payment_method=serializer.validated_data["payment_method"],
                notes=serializer.validated_data.get("notes", ""),
                reference_number=serializer.validated_data.get("reference_number", ""),
                discount_amount=serializer.validated_data.get("discount_amount", 0),
                discount_notes=serializer.validated_data.get("discount_notes", ""),
                received_by=self.request.user,
            )
        except ValueError as exc:
            from rest_framework import serializers

            raise serializers.ValidationError({"detail": str(exc)}) from exc
        serializer.instance = payment

    @action(detail=True, methods=["post"])
    def reverse(self, request, pk=None):
        payment = self.get_object()
        return Response({"detail": f"Payment {payment.receipt_number} is immutable. Create an adjusting payment reversal policy before reversing audit records."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def receipt(self, request, pk=None):
        return receipt_pdf(self.get_object())

    def destroy(self, request, *args, **kwargs):
        return Response({"detail": "Payments are permanent financial records. Use reversal/adjustment instead of deletion."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=["get"])
    def history(self, request):
        return self.list(request)


class StudentLedgerViewSet(TenantScopedViewSet):
    rbac_resource = "student-ledger"
    http_method_names = ["get", "head", "options"]
    serializer_class = StudentLedgerEntrySerializer
    queryset = StudentLedgerEntry.objects.select_related("tenant", "student", "invoice", "payment")
    search_fields = ["student__name", "description", "reference_number", "invoice__invoice_number", "payment__receipt_number"]
    ordering_fields = ["transaction_date", "created_at", "debit", "credit", "balance"]
    filter_fields = ["student", "invoice", "payment", "transaction_type", "reference_number"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role_id and user.role.slug == "student" and hasattr(user, "student_profile"):
            queryset = queryset.filter(student=user.student_profile)
        return queryset

    @action(detail=False, methods=["get"])
    def outstanding(self, request):
        queryset = self.get_queryset()
        latest = queryset.order_by("-transaction_date", "-created_at", "-id").first()
        invoices = Invoice.objects.filter(student__ledger_entries__in=queryset).distinct()
        return Response({
            "current_balance": latest.balance if latest else Decimal("0"),
            "open_invoices": invoices.filter(status__in=[Invoice.Status.PENDING, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE]).count(),
            "overdue_balance": invoices.filter(status=Invoice.Status.OVERDUE).aggregate(total=Sum("balance"))["total"] or 0,
            "outstanding_balance": invoices.exclude(status=Invoice.Status.CANCELLED).aggregate(total=Sum("balance"))["total"] or 0,
        })

    @action(detail=False, methods=["get"])
    def pdf(self, request):
        rows = list(self.get_queryset().select_related("student", "invoice", "payment")[:120])
        student = rows[0].student if rows else None
        lines = [
            f"Student: {student.name if student else 'All students'}",
            "Date | Type | Reference | Description | Debit | Credit | Balance",
        ]
        lines.extend(
            f"{row.transaction_date} | {row.transaction_type} | {row.reference_number} | {row.description} | {row.debit} | {row.credit} | {row.balance}"
            for row in rows
        )
        return accounting_pdf_response("student-ledger", "Student Ledger", lines)


class StationeryItemViewSet(TenantScopedViewSet):
    rbac_resource = "stationery-items"
    serializer_class = StationeryItemSerializer
    queryset = StationeryItem.objects.select_related("tenant", "created_by")
    search_fields = ["item_name", "sku", "barcode", "supplier"]
    ordering_fields = ["item_name", "quantity", "selling_price", "created_at"]
    filter_fields = ["category", "status", "supplier"]

    def perform_create(self, serializer):
        tenant = self.get_tenant()
        next_number = StationeryItem.objects.filter(tenant=tenant).count() + 1
        sku = serializer.validated_data.get("sku") or f"SKU-{tenant.id or 0}-{next_number:05d}"
        barcode = serializer.validated_data.get("barcode") or f"BC{tenant.id or 0}{next_number:08d}"
        item = serializer.save(tenant=tenant, created_by=self.request.user, sku=sku, barcode=barcode)
        refresh_stationery_status(item)

    def perform_update(self, serializer):
        item = serializer.save()
        refresh_stationery_status(item)

    def stock_action(self, request, transaction_type):
        serializer = StockMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            transaction = move_stock(transaction_type=transaction_type, user=request.user, **serializer.validated_data)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(InventoryTransactionSerializer(transaction).data)

    @action(detail=False, methods=["post"], url_path="stock-in")
    def stock_in(self, request):
        return self.stock_action(request, InventoryTransaction.TransactionType.STOCK_IN)

    @action(detail=False, methods=["post"], url_path="stock-out")
    def stock_out(self, request):
        return self.stock_action(request, InventoryTransaction.TransactionType.STOCK_OUT)

    @action(detail=False, methods=["post"])
    def adjust(self, request):
        return self.stock_action(request, InventoryTransaction.TransactionType.ADJUSTMENT)


class InventoryTransactionViewSet(TenantScopedViewSet):
    rbac_resource = "inventory-transactions"
    http_method_names = ["get", "head", "options"]
    serializer_class = InventoryTransactionSerializer
    queryset = InventoryTransaction.objects.select_related("tenant", "item", "created_by")
    search_fields = ["item__item_name", "reference", "notes"]
    ordering_fields = ["created_at", "quantity", "unit_price"]
    filter_fields = ["item", "transaction_type"]


class StationeryPurchaseViewSet(TenantScopedViewSet):
    rbac_resource = "stationery-purchases"
    serializer_class = StationeryPurchaseSerializer
    queryset = StationeryPurchase.objects.select_related("tenant", "created_by").prefetch_related("items", "items__item")
    search_fields = ["receipt_number"]
    ordering_fields = ["date", "total", "created_at"]
    filter_fields = ["payment_status", "date"]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            purchase = create_stationery_purchase(
                tenant=request.user.tenant,
                items=request.data.get("items", []),
                discount=serializer.validated_data.get("discount", 0),
                tax=serializer.validated_data.get("tax", 0),
                payment_status=serializer.validated_data.get("payment_status", StationeryPurchase.PaymentStatus.PENDING),
                user=request.user,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(purchase).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def receipt(self, request, pk=None):
        purchase = self.get_object()
        return Response(self.get_serializer(purchase).data)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [HasRBACPermission]
    rbac_resource = "dashboards"

    def get_permissions(self):
        if getattr(self, "action", None) in ["teacher", "student"]:
            return [IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=["get"])
    def admin(self, request):
        return Response(dashboard_payload(request.user.tenant, request.user))

    @action(detail=False, methods=["get"])
    def teacher(self, request):
        teacher = getattr(request.user, "teacher_profile", None)
        if not teacher:
            raise PermissionDenied("Teacher profile is required.")
        today = timezone.localdate()
        return Response({
            "todays_classes": list(Classes.objects.filter(tenant=request.user.tenant, teachers=teacher).values("id", "name", "start_time", "end_time")),
            "todays_attendance": Attendance.objects.filter(tenant=request.user.tenant, class_fk__teachers=teacher, date=today).count(),
            "pending_assessments": Assessment.objects.filter(tenant=request.user.tenant, teacher=teacher, status__in=[Assessment.Status.DRAFT, Assessment.Status.SCHEDULED]).count(),
            "upcoming_exams": list(Assessment.objects.filter(tenant=request.user.tenant, teacher=teacher, assessment_date__gte=today).values("id", "title", "assessment_date", "assessment_type")[:10]),
            "student_performance": list(AssessmentResult.objects.filter(tenant=request.user.tenant, assessment__teacher=teacher).values("assessment__title").annotate(avg_percentage=Sum("percentage") / Count("id"))[:10]),
            "recent_payments": list(Payment.objects.filter(tenant=request.user.tenant).values("receipt_number", "amount_paid", "payment_date", "invoice__student__name")[:10]),
        })

    @action(detail=False, methods=["get"])
    def student(self, request):
        student = getattr(request.user, "student_profile", None)
        total_attendance = Attendance.objects.filter(student=student).count()
        present = Attendance.objects.filter(student=student, is_present=True).count()
        active_enrollments = Enrollment.objects.filter(student=student, status=Enrollment.Status.ACTIVE) if student else Enrollment.objects.none()
        return Response({
            "attendance_percentage": round((present / total_attendance) * 100, 2) if total_attendance else 0,
            "fees": InvoiceSerializer(Invoice.objects.filter(student=student).order_by("-year", "-month")[:5], many=True).data,
            "current_enrollments": list(active_enrollments.values("id", "course__name", "batch__name", "status", "enrollment_date")),
            "upcoming_exams": list(Assessment.objects.filter(batch__enrollments__in=active_enrollments, assessment_date__gte=timezone.localdate()).values("id", "title", "assessment_date", "assessment_type", "course__name", "batch__name")[:10]) if student else [],
            "assessment_results": AssessmentResultSerializer(AssessmentResult.objects.filter(student=student).order_by("-submitted_at")[:10], many=True).data,
            "payment_history": PaymentSerializer(Payment.objects.filter(invoice__student=student).order_by("-payment_date")[:10], many=True).data,
        })


class ReportViewSet(viewsets.ViewSet):
    permission_classes = [HasRBACPermission]
    rbac_resource = "reports"
    page_size = 25

    def csv_response(self, name, rows):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{name}.csv"'
        writer = csv.writer(response)
        if rows:
            writer.writerow(rows[0].keys())
            for row in rows:
                writer.writerow(row.values())
        return response

    def excel_response(self, name, rows):
        headers = rows[0].keys() if rows else []
        body = "".join(
            "<tr>" + "".join(f"<td>{escape(str(value))}</td>" for value in row.values()) + "</tr>"
            for row in rows
        )
        html = (
            "<html><body><table><thead><tr>"
            + "".join(f"<th>{escape(str(header))}</th>" for header in headers)
            + "</tr></thead><tbody>"
            + body
            + "</tbody></table></body></html>"
        )
        response = HttpResponse(html, content_type="application/vnd.ms-excel")
        response["Content-Disposition"] = f'attachment; filename="{name}.xls"'
        return response

    def pdf_response(self, name, rows):
        lines = [name.replace("-", " ").title()]
        if rows:
            lines.append(" | ".join(str(header) for header in rows[0].keys()))
            lines.extend(" | ".join(str(value) for value in row.values()) for row in rows[:80])
        text = "\\n".join(line[:150].replace("(", "[").replace(")", "]") for line in lines)
        stream = f"BT /F1 9 Tf 40 780 Td ({text}) Tj ET".encode("latin-1", errors="ignore")
        objects = [
            b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
            b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
            b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
            b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
            b"5 0 obj << /Length " + str(len(stream)).encode() + b" >> stream\n" + stream + b"\nendstream endobj",
        ]
        pdf = b"%PDF-1.4\n"
        offsets = [0]
        for obj in objects:
            offsets.append(len(pdf))
            pdf += obj + b"\n"
        xref = len(pdf)
        pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
        pdf += b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets[1:])
        pdf += f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode()
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{name}.pdf"'
        return response

    def tenant_filter(self, model):
        queryset = model.objects.all()
        if not self.request.user.is_super_admin:
            queryset = queryset.filter(tenant=self.request.user.tenant)
        return queryset

    def filtered_dates(self, queryset, field="created_at"):
        start = self.request.query_params.get("start_date")
        end = self.request.query_params.get("end_date")
        module = getattr(self, "action", None) or "reports"
        if start:
            queryset = queryset.filter(**{f"{field}__gte": convert_query_date(start, self.request.user.tenant, module)})
        if end:
            queryset = queryset.filter(**{f"{field}__lte": convert_query_date(end, self.request.user.tenant, module)})
        return queryset

    def apply_exact_filters(self, queryset, mapping):
        for param, lookup in mapping.items():
            value = self.request.query_params.get(param)
            if value not in [None, ""]:
                queryset = queryset.filter(**{lookup: value})
        return queryset

    def apply_text_filters(self, queryset, mapping):
        for param, lookup in mapping.items():
            value = self.request.query_params.get(param)
            if value not in [None, ""]:
                queryset = queryset.filter(**{f"{lookup}__icontains": value})
        return queryset

    def apply_search(self, queryset, fields):
        search = self.request.query_params.get("search")
        if not search:
            return queryset
        query = Q()
        for field in fields:
            query |= Q(**{f"{field}__icontains": search})
        return queryset.filter(query)

    def apply_ordering(self, queryset, allowed, default):
        ordering = self.request.query_params.get("ordering") or default
        if ordering.lstrip("-") in allowed:
            return queryset.order_by(ordering)
        return queryset.order_by(default)

    def paginate_rows(self, rows):
        page = max(int(self.request.query_params.get("page", 1) or 1), 1)
        size = min(max(int(self.request.query_params.get("page_size", self.page_size) or self.page_size), 1), 100)
        start = (page - 1) * size
        return page, size, rows[start:start + size]

    def decimalize(self, value):
        return float(value or 0)

    def chart_period_label(self, value):
        if not value:
            return "Unknown"
        period = value.date() if hasattr(value, "date") else value
        calendar = get_module_calendar(self.request.user.tenant, getattr(self, "action", None) or "reports")
        return format_calendar_date(period, calendar)

    def chart(self, queryset, date_field, amount_field=None, count_field="id"):
        grouped = queryset.annotate(period=TruncMonth(date_field)).values("period")
        if amount_field:
            grouped = grouped.annotate(value=Sum(amount_field))
        else:
            grouped = grouped.annotate(value=Count(count_field))
        return [
            {"label": self.chart_period_label(row["period"]), "value": self.decimalize(row["value"])}
            for row in grouped.order_by("period")
        ]

    def report(self, name, queryset, rows, summary=None, charts=None, last_generated=None):
        rows = convert_rows_dates(rows, self.request.user.tenant, getattr(self, "action", None) or name)
        export = self.request.query_params.get("export")
        if export == "csv":
            return self.csv_response(name, rows)
        if export == "excel":
            return self.excel_response(name, rows)
        if export == "pdf":
            return self.pdf_response(name, rows)
        page, page_size, paged = self.paginate_rows(rows)
        return Response({
            "count": len(rows),
            "page": page,
            "page_size": page_size,
            "summary": summary or {},
            "charts": charts or {},
            "last_generated": last_generated or timezone.now(),
            "results": paged,
        })

    @action(detail=False, methods=["get"])
    def attendance(self, request):
        queryset = self.tenant_filter(Attendance).select_related("student", "class_fk", "course", "teacher")
        queryset = self.filtered_dates(queryset, "date")
        queryset = self.apply_text_filters(queryset, {
            "course": "course__name",
            "class": "class_fk__name",
            "batch": "class_fk__name",
            "teacher": "teacher__full_name",
            "student": "student__name",
        })
        queryset = self.apply_exact_filters(queryset, {"status": "status"})
        queryset = self.apply_search(queryset, ["student__name", "class_fk__name", "course__name", "teacher__full_name", "status"])
        queryset = self.apply_ordering(queryset, {"date", "student__name", "class_fk__name", "status"}, "-date")
        rows = list(queryset.values("id", "date", "student__name", "class_fk__name", "course__name", "teacher__full_name", "status", "is_present"))
        total = queryset.count()
        present = queryset.filter(is_present=True).count()
        summary = {"total_records": total, "present": present, "absent": total - present, "attendance_percentage": round((present / total) * 100, 2) if total else 0}
        charts = {"attendance_trends": self.chart(queryset, "date")}
        return self.report("attendance", queryset, rows, summary, charts, queryset.order_by("-updated_at").values_list("updated_at", flat=True).first())

    @action(detail=False, methods=["get"])
    def assessments(self, request):
        queryset = self.tenant_filter(AssessmentResult).select_related("assessment", "student", "course", "batch", "teacher")
        queryset = self.filtered_dates(queryset, "assessment__assessment_date")
        queryset = self.apply_text_filters(queryset, {"course": "course__name", "teacher": "teacher__full_name", "student": "student__name"})
        queryset = self.apply_exact_filters(queryset, {"assessment_type": "assessment__assessment_type"})
        queryset = self.apply_search(queryset, ["assessment__title", "student__name", "course__name", "teacher__full_name", "grade"])
        queryset = self.apply_ordering(queryset, {"assessment__assessment_date", "student__name", "percentage", "grade"}, "-assessment__assessment_date")
        rows = list(queryset.values("id", "assessment__title", "assessment__assessment_date", "assessment__assessment_type", "student__name", "course__name", "teacher__full_name", "marks_obtained", "percentage", "grade", "is_passed"))
        total = queryset.count()
        passed = queryset.filter(is_passed=True).count()
        summary = {"results": total, "passed": passed, "failed": total - passed, "average_percentage": round(self.decimalize(queryset.aggregate(value=Avg("percentage"))["value"]), 2)}
        charts = {"assessment_trends": self.chart(queryset, "assessment__assessment_date")}
        return self.report("assessments", queryset, rows, summary, charts, queryset.order_by("-updated_at").values_list("updated_at", flat=True).first())

    @action(detail=False, methods=["get"])
    def fees(self, request):
        queryset = self.tenant_filter(Invoice).select_related("student", "course", "batch", "enrollment")
        queryset = self.filtered_dates(queryset, "due_date")
        queryset = self.apply_text_filters(queryset, {
            "student": "student__name",
            "course": "course__name",
            "batch": "batch__name",
            "fee_plan": "enrollment__billing_profile__fee_plan__course__name",
        })
        queryset = self.apply_exact_filters(queryset, {"payment_status": "status"})
        queryset = self.apply_search(queryset, ["invoice_number", "student__name", "course__name", "batch__name", "status"])
        queryset = self.apply_ordering(queryset, {"due_date", "student__name", "final_amount", "paid_amount", "balance", "status"}, "-due_date")
        rows = list(queryset.values("id", "invoice_number", "student__name", "course__name", "batch__name", "billing_month", "billing_year", "due_date", "amount", "discount", "final_amount", "paid_amount", "balance", "status"))
        summary = {
            "invoices": queryset.count(),
            "gross": queryset.aggregate(value=Sum("amount"))["value"] or 0,
            "discounts": queryset.aggregate(value=Sum("discount"))["value"] or 0,
            "expected": queryset.aggregate(value=Sum("final_amount"))["value"] or 0,
            "collected": queryset.aggregate(value=Sum("paid_amount"))["value"] or 0,
            "pending": queryset.aggregate(value=Sum("balance"))["value"] or 0,
        }
        charts = {"fee_collection": self.chart(queryset, "due_date", "paid_amount")}
        return self.report("fees", queryset, rows, summary, charts, queryset.order_by("-updated_at").values_list("updated_at", flat=True).first())

    @action(detail=False, methods=["get"])
    def revenue(self, request):
        queryset = self.tenant_filter(Payment).select_related("invoice", "student", "received_by")
        queryset = self.filtered_dates(queryset, "payment_date")
        queryset = self.apply_text_filters(queryset, {"source": "invoice__course__name", "cashier": "received_by__username"})
        queryset = self.apply_exact_filters(queryset, {"payment_method": "payment_method"})
        queryset = self.apply_search(queryset, ["receipt_number", "student__name", "invoice__invoice_number", "payment_method", "received_by__username"])
        queryset = self.apply_ordering(queryset, {"payment_date", "amount_paid", "payment_method", "receipt_number"}, "-payment_date")
        rows = list(queryset.values("id", "receipt_number", "invoice__invoice_number", "student__name", "payment_date", "payment_method", "amount_paid", "invoice__discount", "received_by__username"))
        paid_invoice_ids = queryset.values_list("invoice_id", flat=True).distinct()
        invoice_discounts = Invoice.objects.filter(id__in=paid_invoice_ids).aggregate(value=Sum("discount"))["value"] or 0
        summary = {
            "payments": queryset.count(),
            "total_revenue": queryset.aggregate(value=Sum("amount_paid"))["value"] or 0,
            "discounts": invoice_discounts,
            "average_payment": round(self.decimalize(queryset.aggregate(value=Avg("amount_paid"))["value"]), 2),
        }
        charts = {"monthly_revenue": self.chart(queryset, "payment_date", "amount_paid")}
        if request.query_params.get("grouping") == "yearly":
            charts["yearly_revenue"] = list(queryset.values("payment_date__year").annotate(value=Sum("amount_paid")).order_by("payment_date__year"))
        return self.report("revenue", queryset, rows, summary, charts, queryset.order_by("-updated_at").values_list("updated_at", flat=True).first())

    @action(detail=False, methods=["get"])
    def students(self, request):
        queryset = self.tenant_filter(Students).prefetch_related("enrollments", "enrollments__course")
        queryset = self.filtered_dates(queryset, "enrollment_date")
        queryset = self.apply_text_filters(queryset, {"course": "enrollments__course__name", "batch": "enrollments__batch__name"})
        queryset = self.apply_exact_filters(queryset, {"status": "is_active"})
        queryset = self.apply_search(queryset, ["name", "f_name", "role_number", "parent_mobile_number"])
        queryset = self.apply_ordering(queryset, {"name", "role_number", "enrollment_date", "is_active"}, "-enrollment_date").distinct()
        rows = list(queryset.values("id", "name", "f_name", "role_number", "parent_mobile_number", "enrollment_date", "is_active"))
        summary = {"students": queryset.count(), "active": queryset.filter(is_active=True).count(), "archived": queryset.filter(is_archived=True).count()}
        charts = {"student_enrollment": self.chart(queryset, "enrollment_date")}
        return self.report("students", queryset, rows, summary, charts, queryset.order_by("-enrollment_date").values_list("enrollment_date", flat=True).first())

    @action(detail=False, methods=["get"])
    def teachers(self, request):
        queryset = self.tenant_filter(Teachers).select_related("user")
        queryset = self.apply_text_filters(queryset, {"department": "department", "subject": "subject"})
        queryset = self.apply_exact_filters(queryset, {"employment_status": "is_active"})
        queryset = self.filtered_dates(queryset, "user__date_joined")
        queryset = self.apply_search(queryset, ["full_name", "email_address", "phone_number", "subject", "department"])
        queryset = self.apply_ordering(queryset, {"full_name", "department", "subject", "user__date_joined"}, "full_name")
        rows = list(queryset.values("id", "full_name", "email_address", "phone_number", "subject", "department", "is_active", "user__date_joined"))
        summary = {"teachers": queryset.count(), "active": queryset.filter(is_active=True).count(), "inactive": queryset.filter(is_active=False).count(), "departments": queryset.values("department").distinct().count()}
        charts = {"teacher_departments": list(queryset.values("department").annotate(value=Count("id")).order_by("department"))}
        return self.report("teachers", queryset, rows, summary, charts, queryset.order_by("-user__date_joined").values_list("user__date_joined", flat=True).first())

    @action(detail=False, methods=["get"])
    def inventory(self, request):
        queryset = self.tenant_filter(StationeryItem)
        queryset = self.apply_exact_filters(queryset, {"category": "category"})
        queryset = self.apply_text_filters(queryset, {"supplier": "supplier"})
        if request.query_params.get("low_stock") in ["1", "true", "yes"]:
            queryset = queryset.filter(Q(status=StationeryItem.Status.LOW_STOCK) | Q(quantity__lte=F("minimum_stock")))
        queryset = self.apply_search(queryset, ["item_name", "sku", "barcode", "category", "supplier", "status"])
        queryset = self.apply_ordering(queryset, {"item_name", "quantity", "minimum_stock", "status", "selling_price"}, "item_name")
        rows = list(queryset.values("id", "item_name", "sku", "category", "quantity", "minimum_stock", "status", "supplier", "selling_price"))
        summary = {"items": queryset.count(), "low_stock": queryset.filter(status=StationeryItem.Status.LOW_STOCK).count(), "out_of_stock": queryset.filter(status=StationeryItem.Status.OUT_OF_STOCK).count(), "stock_value": sum(self.decimalize(row["quantity"]) * self.decimalize(row["selling_price"]) for row in rows)}
        charts = {"stock_distribution": list(queryset.values("category").annotate(value=Sum("quantity")).order_by("category"))}
        return self.report("inventory", queryset, rows, summary, charts, queryset.order_by("-updated_at").values_list("updated_at", flat=True).first())

    @action(detail=False, methods=["get"], url_path="stationery-sales")
    def stationery_sales(self, request):
        queryset = self.tenant_filter(StationeryPurchase).select_related("created_by").prefetch_related("items", "items__item")
        queryset = self.filtered_dates(queryset, "date")
        queryset = self.apply_text_filters(queryset, {"product": "items__item__item_name", "cashier": "created_by__username"})
        queryset = self.apply_exact_filters(queryset, {"payment_method": "payment_status"})
        queryset = self.apply_search(queryset, ["receipt_number", "payment_status", "created_by__username", "items__item__item_name"])
        queryset = self.apply_ordering(queryset, {"date", "total", "payment_status", "receipt_number"}, "-date").distinct()
        rows = list(queryset.values("id", "receipt_number", "date", "total", "payment_status", "created_by__username"))
        summary = {"sales": queryset.count(), "total_sales": queryset.aggregate(value=Sum("total"))["value"] or 0, "paid_sales": queryset.filter(payment_status=StationeryPurchase.PaymentStatus.PAID).count()}
        charts = {"stationery_sales_trends": self.chart(queryset, "date", "total")}
        return self.report("stationery-sales", queryset, rows, summary, charts, queryset.order_by("-updated_at").values_list("updated_at", flat=True).first())


class NotificationViewSet(TenantScopedViewSet):
    rbac_resource = "notifications"
    serializer_class = NotificationSerializer
    queryset = Notification.objects.select_related("tenant", "recipient", "created_by")
    search_fields = ["title", "message"]
    ordering_fields = ["created_at", "is_read"]
    filter_fields = ["notification_type", "is_read"]

    def get_queryset(self):
        ensure_notification_backlog(self.request.user)
        return super().get_queryset().filter(recipient=self.request.user)

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at", "updated_at"])
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        now = timezone.now()
        count = self.get_queryset().filter(is_read=False).update(is_read=True, read_at=now, updated_at=now)
        return Response({"detail": "Notifications marked as read.", "count": count})
