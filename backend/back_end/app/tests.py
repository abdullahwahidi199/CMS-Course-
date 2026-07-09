from datetime import date
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from .enterprise_services import (
    generate_monthly_invoices,
    move_stock,
    record_payment,
    save_assessment_result,
)
from .services.promotion_service import promote_student
from .models import (
    Assessment,
    Classes,
    Course,
    Enrollment,
    EnrollmentBillingProfile,
    FeePlan,
    InventoryTransaction,
    Invoice,
    PromotionHistory,
    StationeryItem,
    Students,
    Teachers,
    Tenant,
    User,
    Role,
)


class EnterpriseServiceTests(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name="Demo School")
        self.admin_role = Role.objects.create(tenant=self.tenant, name="Admin", slug="admin")
        self.teacher_role = Role.objects.create(tenant=self.tenant, name="Teacher", slug="teacher")
        self.student_role = Role.objects.create(tenant=self.tenant, name="Student", slug="student")
        self.admin = User.objects.create_user(username="admin", password="pass", role=self.admin_role, tenant=self.tenant)
        self.teacher_user = User.objects.create_user(username="teacher", password="pass", role=self.teacher_role, tenant=self.tenant)
        self.student_user = User.objects.create_user(username="student", password="pass", role=self.student_role, tenant=self.tenant)
        self.teacher = Teachers.objects.create(
            tenant=self.tenant,
            user=self.teacher_user,
            full_name="Teacher One",
            phone_number="123",
            email_address="teacher@example.com",
            subject="Math",
        )
        self.course = Course.objects.create(tenant=self.tenant, name="English", code="ENG")
        self.batch = Classes.objects.create(
            tenant=self.tenant,
            course=self.course,
            name="Class A",
            subjects="Math",
            startDate=date(2026, 1, 1),
            endDate=date(2026, 12, 31),
        )
        self.batch.teachers.add(self.teacher)
        self.student = Students.objects.create(
            tenant=self.tenant,
            user=self.student_user,
            name="Student One",
            f_name="Parent One",
            role_number="A-1",
            parent_mobile_number="456",
            address="Address",
        )
        self.enrollment = Enrollment.objects.create(tenant=self.tenant, student=self.student, course=self.course, batch=self.batch)

    def test_assessment_result_calculates_percentage_grade_and_pass_status(self):
        assessment = Assessment.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=self.batch,
            teacher=self.teacher,
            title="Midterm",
            assessment_type=Assessment.AssessmentType.MIDTERM,
            maximum_marks=Decimal("100"),
            passing_marks=Decimal("60"),
            assessment_date=timezone.localdate(),
            created_by=self.admin,
        )

        result = save_assessment_result(
            assessment=assessment,
            enrollment=self.enrollment,
            marks_obtained=95,
            remarks="Excellent",
            user=self.admin,
        )

        self.assertEqual(result.percentage, Decimal("95.00"))
        self.assertEqual(result.grade, "A+")
        self.assertTrue(result.is_passed)

    def test_invoice_generation_and_partial_payment_update_balance(self):
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            monthly_fee=Decimal("1000"),
            registration_fee=Decimal("100"),
            discount_allowed=Decimal("50"),
            currency="USD",
            created_by=self.admin,
        )

        invoices = generate_monthly_invoices(
            tenant=self.tenant,
            month=7,
            year=2026,
            due_date=date(2026, 7, 20),
            user=self.admin,
        )
        repeated = generate_monthly_invoices(
            tenant=self.tenant,
            month=7,
            year=2026,
            due_date=date(2026, 7, 20),
            user=self.admin,
        )
        invoice = invoices[0]
        payment = record_payment(
            invoice=invoice,
            amount_paid=Decimal("400"),
            payment_method="cash",
            received_by=self.admin,
        )
        invoice.refresh_from_db()

        self.assertEqual(len(repeated), 0)
        self.assertEqual(payment.amount_paid, Decimal("400"))
        self.assertEqual(invoice.paid_amount, Decimal("400"))
        self.assertEqual(invoice.balance, Decimal("700.00"))
        self.assertEqual(invoice.status, "partial")

    def test_new_invoice_does_not_roll_previous_unpaid_balance_into_amount(self):
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            monthly_fee=Decimal("400"),
            registration_fee=Decimal("0"),
            material_fee=Decimal("0"),
            exam_fee=Decimal("0"),
            currency="USD",
            created_by=self.admin,
        )

        july_invoice = generate_monthly_invoices(
            tenant=self.tenant,
            month=7,
            year=2026,
            due_date=date(2026, 7, 20),
            user=self.admin,
        )[0]
        august_invoice = generate_monthly_invoices(
            tenant=self.tenant,
            month=8,
            year=2026,
            due_date=date(2026, 8, 20),
            user=self.admin,
        )[0]

        self.assertEqual(july_invoice.balance, Decimal("400.00"))
        self.assertEqual(august_invoice.final_amount, Decimal("400.00"))
        self.assertEqual(august_invoice.balance, Decimal("400.00"))
        self.assertEqual(august_invoice.previous_balance, Decimal("0.00"))

    def test_payment_cannot_exceed_invoice_balance(self):
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            monthly_fee=Decimal("400"),
            currency="USD",
            created_by=self.admin,
        )
        invoice = generate_monthly_invoices(
            tenant=self.tenant,
            month=7,
            year=2026,
            due_date=date(2026, 7, 20),
            user=self.admin,
        )[0]

        with self.assertRaises(ValueError):
            record_payment(
                invoice=invoice,
                amount_paid=Decimal("401"),
                payment_method="cash",
                received_by=self.admin,
            )

    def test_student_promotion_transfers_old_enrollment_and_creates_new_active_enrollment(self):
        next_batch = Classes.objects.create(
            tenant=self.tenant,
            course=self.course,
            name="Class B",
            subjects="Math",
            startDate=date(2026, 1, 1),
            endDate=date(2026, 12, 31),
        )
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            monthly_fee=Decimal("1200"),
            currency="USD",
            created_by=self.admin,
        )

        new_enrollment, promotion = promote_student(
            self.student,
            next_batch,
            user=self.admin,
            remarks="Promoted after completing level 1",
        )
        self.enrollment.refresh_from_db()

        self.assertEqual(self.enrollment.status, Enrollment.Status.TRANSFERRED)
        self.assertEqual(new_enrollment.status, Enrollment.Status.ACTIVE)
        self.assertEqual(new_enrollment.batch, next_batch)
        self.assertEqual(
            Enrollment.objects.filter(student=self.student, status=Enrollment.Status.ACTIVE).count(),
            1,
        )
        self.assertEqual(promotion.old_class, self.batch)
        self.assertEqual(promotion.new_class, next_batch)
        self.assertTrue(PromotionHistory.objects.filter(student=self.student).exists())
        self.assertTrue(EnrollmentBillingProfile.objects.filter(enrollment=new_enrollment).exists())
        new_invoice = Invoice.objects.get(enrollment=new_enrollment)
        self.assertEqual(new_invoice.paid_amount, Decimal("0.00"))
        self.assertEqual(new_invoice.balance, Decimal("1200.00"))
        self.assertEqual(new_invoice.status, Invoice.Status.PENDING)

    def test_batch_fee_plan_replaces_promoted_student_course_plan_invoice(self):
        next_batch = Classes.objects.create(
            tenant=self.tenant,
            course=self.course,
            name="Class B",
            subjects="Math",
            startDate=date(2026, 1, 1),
            endDate=date(2026, 12, 31),
        )
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            monthly_fee=Decimal("1200"),
            currency="AFN",
            created_by=self.admin,
        )

        new_enrollment, _ = promote_student(
            self.student,
            next_batch,
            user=self.admin,
            remarks="Promoted before batch fee was configured",
            promotion_date=date(2026, 7, 8),
        )
        promoted_invoice = Invoice.objects.get(enrollment=new_enrollment)
        self.assertEqual(promoted_invoice.balance, Decimal("1200.00"))

        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=next_batch,
            monthly_fee=Decimal("600"),
            currency="AFN",
            created_by=self.admin,
        )
        generated = generate_monthly_invoices(
            tenant=self.tenant,
            month=7,
            year=2026,
            due_date=date(2026, 7, 20),
            user=self.admin,
            batch=next_batch.id,
        )
        promoted_invoice.refresh_from_db()
        new_enrollment.billing_profile.refresh_from_db()

        self.assertEqual(len(generated), 1)
        self.assertEqual(new_enrollment.billing_profile.monthly_fee, Decimal("600.00"))
        self.assertEqual(promoted_invoice.final_amount, Decimal("600.00"))
        self.assertEqual(promoted_invoice.paid_amount, Decimal("0.00"))
        self.assertEqual(promoted_invoice.balance, Decimal("600.00"))

    def test_student_promotion_to_batch_without_course_carries_current_course(self):
        batch_without_course = Classes.objects.create(
            tenant=self.tenant,
            name="Unassigned Batch",
            subjects="Math",
            startDate=date(2026, 1, 1),
            endDate=date(2026, 12, 31),
        )

        new_enrollment, _ = promote_student(self.student, batch_without_course, user=self.admin)

        self.assertEqual(new_enrollment.course, self.course)
        self.assertEqual(new_enrollment.batch, batch_without_course)

    def test_stock_out_updates_inventory_status(self):
        item = StationeryItem.objects.create(
            tenant=self.tenant,
            item_name="Notebook",
            sku="NB-001",
            category="notebooks",
            cost_price=Decimal("1"),
            selling_price=Decimal("2"),
            quantity=10,
            minimum_stock=5,
            supplier="Supplier",
            created_by=self.admin,
        )

        move_stock(
            item=item,
            transaction_type=InventoryTransaction.TransactionType.STOCK_OUT,
            quantity=6,
            unit_price=Decimal("2"),
            user=self.admin,
        )
        item.refresh_from_db()

        self.assertEqual(item.quantity, 4)
        self.assertEqual(item.status, "low_stock")
