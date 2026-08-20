from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .enterprise_services import (
    generate_monthly_invoices,
    move_stock,
    record_payment,
    save_assessment_result,
)
from .rbac import seed_permissions_and_roles
from .services.promotion_service import promote_student
from .services.admission_service import admit_student
from .shamsi import CALENDAR_SHAMSI, to_gregorian
from .models import (
    Assessment,
    Attendance,
    AttendanceSession,
    Classes,
    Course,
    Enrollment,
    EnrollmentBillingProfile,
    FeePlan,
    InventoryTransaction,
    Invoice,
    Marks,
    PromotionHistory,
    PublicAnnouncement,
    PublicAnnouncementComment,
    PublicCourseProgram,
    PublicEvent,
    StationeryItem,
    StudentLedgerEntry,
    Students,
    Teachers,
    Tenant,
    TenantPublicSiteSettings,
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
        self.enrollment = Enrollment.objects.create(
            tenant=self.tenant,
            student=self.student,
            course=self.course,
            batch=self.batch,
            enrollment_date=date(2026, 1, 1),
        )

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

    def test_payment_collection_can_apply_discount_before_payment(self):
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            monthly_fee=Decimal("1000"),
            registration_fee=Decimal("100"),
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

        payment = record_payment(
            invoice=invoice,
            amount_paid=Decimal("900"),
            payment_method="cash",
            received_by=self.admin,
            discount_amount=Decimal("200"),
            discount_notes="Hardship discount",
        )
        invoice.refresh_from_db()
        ledger = list(StudentLedgerEntry.objects.filter(invoice=invoice).order_by("created_at"))

        self.assertEqual(payment.amount_paid, Decimal("900.00"))
        self.assertEqual(invoice.discount, Decimal("200.00"))
        self.assertEqual(invoice.final_amount, Decimal("900.00"))
        self.assertEqual(invoice.paid_amount, Decimal("900.00"))
        self.assertEqual(invoice.balance, Decimal("0.00"))
        self.assertEqual(invoice.status, Invoice.Status.PAID)
        self.assertEqual(ledger[1].transaction_type, StudentLedgerEntry.TransactionType.DISCOUNT_APPLIED)
        self.assertEqual(ledger[1].credit, Decimal("200.00"))
        self.assertEqual(ledger[2].transaction_type, StudentLedgerEntry.TransactionType.PAYMENT_RECEIVED)
        self.assertEqual(ledger[2].credit, Decimal("900.00"))
        self.assertEqual(ledger[2].balance, Decimal("0.00"))

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

    def test_monthly_fee_plan_bills_each_month_even_for_short_batch(self):
        self.batch.startDate = date(2026, 7, 1)
        self.batch.endDate = date(2026, 8, 31)
        self.batch.save(update_fields=["startDate", "endDate"])
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=self.batch,
            monthly_fee=Decimal("600"),
            billing_cycle=FeePlan.BillingCycle.MONTHLY,
            currency="AFN",
            created_by=self.admin,
        )

        july_invoice = generate_monthly_invoices(
            tenant=self.tenant,
            month=7,
            year=2026,
            due_date=date(2026, 7, 20),
            user=self.admin,
            batch=self.batch.id,
        )[0]
        august_invoice = generate_monthly_invoices(
            tenant=self.tenant,
            month=8,
            year=2026,
            due_date=date(2026, 8, 20),
            user=self.admin,
            batch=self.batch.id,
        )[0]

        self.assertEqual(july_invoice.balance, Decimal("600.00"))
        self.assertEqual(august_invoice.balance, Decimal("600.00"))
        self.assertEqual(Invoice.objects.filter(enrollment=self.enrollment).count(), 2)

    def test_shamsi_monthly_invoice_generation_uses_shamsi_period_and_due_date(self):
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            monthly_fee=Decimal("700"),
            billing_cycle=FeePlan.BillingCycle.MONTHLY,
            due_day=10,
            currency="AFN",
            created_by=self.admin,
        )

        invoices = generate_monthly_invoices(
            tenant=self.tenant,
            month=5,
            year=1405,
            user=self.admin,
            period_calendar=CALENDAR_SHAMSI,
        )

        self.assertEqual(len(invoices), 1)
        self.assertEqual(invoices[0].billing_month, 5)
        self.assertEqual(invoices[0].billing_year, 1405)
        self.assertEqual(invoices[0].due_date, to_gregorian(1405, 5, 10))
        self.assertEqual(invoices[0].balance, Decimal("700.00"))

    def test_shamsi_generation_includes_enrollment_started_inside_period(self):
        self.enrollment.enrollment_date = date(2026, 8, 2)
        self.enrollment.save(update_fields=["enrollment_date"])
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=self.batch,
            monthly_fee=Decimal("700"),
            billing_cycle=FeePlan.BillingCycle.MONTHLY,
            currency="AFN",
            created_by=self.admin,
        )

        invoices = generate_monthly_invoices(
            tenant=self.tenant,
            month=5,
            year=1405,
            user=self.admin,
            batch=self.batch.id,
            period_calendar=CALENDAR_SHAMSI,
        )

        self.assertEqual(len(invoices), 1)
        self.assertEqual(invoices[0].enrollment, self.enrollment)
        self.assertEqual(invoices[0].billing_month, 5)
        self.assertEqual(invoices[0].billing_year, 1405)

    def test_invoice_generation_uses_latest_active_batch_fee_plan(self):
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=self.batch,
            monthly_fee=Decimal("500"),
            billing_cycle=FeePlan.BillingCycle.MONTHLY,
            currency="AFN",
            created_by=self.admin,
        )
        latest_plan = FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=self.batch,
            monthly_fee=Decimal("750"),
            billing_cycle=FeePlan.BillingCycle.MONTHLY,
            currency="AFN",
            created_by=self.admin,
        )

        invoices = generate_monthly_invoices(
            tenant=self.tenant,
            month=7,
            year=2026,
            due_date=date(2026, 7, 20),
            user=self.admin,
            batch=self.batch.id,
        )
        self.enrollment.billing_profile.refresh_from_db()

        self.assertEqual(len(invoices), 1)
        self.assertEqual(invoices[0].monthly_fee, Decimal("750.00"))
        self.assertEqual(self.enrollment.billing_profile.fee_plan, latest_plan)

    def test_course_level_monthly_fee_generates_for_all_active_enrollments_in_shamsi_period(self):
        second_user = User.objects.create_user(username="student2", password="pass", role=self.student_role, tenant=self.tenant)
        second_student = Students.objects.create(
            tenant=self.tenant,
            user=second_user,
            name="Student Two",
            f_name="Parent Two",
            role_number="A-2",
            parent_mobile_number="789",
            address="Address",
        )
        second_batch = Classes.objects.create(
            tenant=self.tenant,
            course=self.course,
            name="Class B",
            subjects="Math",
            startDate=date(2026, 1, 1),
            endDate=date(2026, 12, 31),
        )
        second_enrollment = Enrollment.objects.create(tenant=self.tenant, student=second_student, course=self.course, batch=second_batch)
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=None,
            monthly_fee=Decimal("500"),
            billing_cycle=FeePlan.BillingCycle.MONTHLY,
            due_day=8,
            currency="AFN",
            created_by=self.admin,
        )

        invoices = generate_monthly_invoices(
            tenant=self.tenant,
            month=5,
            year=1405,
            user=self.admin,
            course=self.course.id,
            period_calendar=CALENDAR_SHAMSI,
        )

        self.assertEqual(len(invoices), 2)
        self.assertEqual({invoice.enrollment_id for invoice in invoices}, {self.enrollment.id, second_enrollment.id})
        self.assertTrue(all(invoice.billing_month == 5 and invoice.billing_year == 1405 for invoice in invoices))
        self.assertTrue(all(invoice.due_date == to_gregorian(1405, 5, 8) for invoice in invoices))

    def test_batch_fee_plan_bills_only_once_for_enrollment(self):
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=self.batch,
            monthly_fee=Decimal("1200"),
            billing_cycle=FeePlan.BillingCycle.BATCH,
            currency="AFN",
            created_by=self.admin,
        )

        first = generate_monthly_invoices(
            tenant=self.tenant,
            month=7,
            year=2026,
            due_date=date(2026, 7, 20),
            user=self.admin,
            batch=self.batch.id,
        )
        second = generate_monthly_invoices(
            tenant=self.tenant,
            month=8,
            year=2026,
            due_date=date(2026, 8, 20),
            user=self.admin,
            batch=self.batch.id,
        )

        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 0)
        self.assertEqual(first[0].balance, Decimal("1200.00"))
        self.assertEqual(Invoice.objects.filter(enrollment=self.enrollment).count(), 1)

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

    def test_admission_uses_batch_specific_fee_plan_for_first_invoice(self):
        se_5 = Classes.objects.create(
            tenant=self.tenant,
            course=self.course,
            name="SE-5",
            subjects="Software Engineering",
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
        FeePlan.objects.create(
            tenant=self.tenant,
            course=self.course,
            batch=se_5,
            monthly_fee=Decimal("600"),
            currency="AFN",
            created_by=self.admin,
        )

        student, enrollment = admit_student(
            tenant=self.tenant,
            created_by=self.admin,
            student={
                "first_name": "New",
                "last_name": "Student",
                "guardian_name": "Guardian",
                "parent_mobile_number": "555",
                "address": "Address",
            },
            account={
                "username": "new-se5-student",
                "password": "pass12345",
                "create_user": True,
            },
            academic={"batch": se_5.id, "status": Enrollment.Status.ACTIVE},
        )
        invoice = Invoice.objects.get(enrollment=enrollment)
        enrollment.billing_profile.refresh_from_db()

        self.assertEqual(student.tenant, self.tenant)
        self.assertEqual(enrollment.batch, se_5)
        self.assertEqual(enrollment.billing_profile.fee_plan.batch, se_5)
        self.assertEqual(enrollment.billing_profile.monthly_fee, Decimal("600.00"))
        self.assertEqual(invoice.monthly_fee, Decimal("600.00"))
        self.assertEqual(invoice.final_amount, Decimal("600.00"))
        self.assertEqual(invoice.balance, Decimal("600.00"))

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


class SummaryEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(name="Summary School")
        self.admin_role = Role.objects.create(tenant=self.tenant, name="Admin", slug="admin")
        self.teacher_role = Role.objects.create(tenant=self.tenant, name="Teacher", slug="teacher")
        self.student_role = Role.objects.create(tenant=self.tenant, name="Student", slug="student")
        self.admin = User.objects.create_user(username="summary-admin", password="pass", role=self.admin_role, tenant=self.tenant)
        self.teacher_user = User.objects.create_user(username="summary-teacher", password="pass", role=self.teacher_role, tenant=self.tenant)
        self.other_teacher_user = User.objects.create_user(username="other-summary-teacher", password="pass", role=self.teacher_role, tenant=self.tenant)
        self.student_user = User.objects.create_user(username="summary-student", password="pass", role=self.student_role, tenant=self.tenant, phone="555")
        seed_permissions_and_roles(self.tenant, self.admin)

        self.teacher = Teachers.objects.create(
            tenant=self.tenant,
            user=self.teacher_user,
            full_name="Summary Teacher",
            phone_number="123",
            email_address="teacher@example.com",
            subject="Math",
        )
        self.other_teacher = Teachers.objects.create(
            tenant=self.tenant,
            user=self.other_teacher_user,
            full_name="Other Teacher",
            phone_number="999",
            email_address="other@example.com",
            subject="Science",
        )
        self.course = Course.objects.create(tenant=self.tenant, name="Math", code="MTH")
        self.batch = Classes.objects.create(
            tenant=self.tenant,
            course=self.course,
            name="Batch A",
            subjects="Algebra",
            startDate=date(2026, 1, 1),
            endDate=date(2026, 12, 31),
        )
        self.batch.teachers.add(self.teacher)
        self.other_batch = Classes.objects.create(
            tenant=self.tenant,
            course=self.course,
            name="Batch B",
            subjects="Geometry",
            startDate=date(2026, 1, 1),
            endDate=date(2026, 12, 31),
        )
        self.other_batch.teachers.add(self.other_teacher)
        self.archived_batch = Classes.objects.create(
            tenant=self.tenant,
            course=self.course,
            name="Archived Batch",
            subjects="Calculus",
            startDate=date(2026, 1, 1),
            endDate=date(2026, 12, 31),
            is_active=False,
            is_archived=True,
        )
        self.archived_batch.teachers.add(self.teacher)

        self.student = Students.objects.create(
            tenant=self.tenant,
            user=self.student_user,
            name="Summary Student",
            f_name="Summary Parent",
            role_number="S-1",
            parent_mobile_number="777",
            address="Main Street",
        )
        self.enrollment = Enrollment.objects.create(
            tenant=self.tenant,
            student=self.student,
            course=self.course,
            batch=self.batch,
            enrollment_date=date(2026, 1, 1),
        )
        Attendance.objects.create(
            tenant=self.tenant,
            enrollment=self.enrollment,
            student=self.student,
            class_fk=self.batch,
            course=self.course,
            teacher=self.teacher,
            date=date(2026, 8, 1),
            status=Attendance.Status.PRESENT,
            is_present=True,
        )
        Attendance.objects.create(
            tenant=self.tenant,
            enrollment=self.enrollment,
            student=self.student,
            class_fk=self.batch,
            course=self.course,
            teacher=self.teacher,
            date=date(2026, 8, 2),
            status=Attendance.Status.ABSENT,
            is_present=False,
        )
        Marks.objects.create(
            tenant=self.tenant,
            student=self.student,
            marks_obtained=80,
            total_marks=100,
            className="Batch A",
            exam_type="quiz",
        )

    def test_teacher_class_summary_is_scoped_and_counts_active_students(self):
        self.client.force_authenticate(user=self.teacher_user)

        response = self.client.get("/api/classes/?summary=1&active_only=1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.batch.id])
        self.assertEqual(response.data[0]["student_count"], 1)
        self.assertEqual(response.data[0]["teachers_count"], 1)
        self.assertEqual(response.data[0]["teachers_details"][0]["full_name"], "Summary Teacher")

    def test_student_by_class_summary_returns_lightweight_metrics(self):
        self.client.force_authenticate(user=self.teacher_user)

        response = self.client.get(f"/api/students/by-class/{self.batch.id}/?summary=1")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["student_number_display"], self.student.formatted_student_number)
        self.assertEqual(response.data[0]["phone"], "555")
        self.assertEqual(response.data[0]["attendance_percentage"], 50)
        self.assertEqual(response.data[0]["performance_average"], 80.0)

    def test_teacher_cannot_load_students_for_unassigned_class(self):
        self.client.force_authenticate(user=self.teacher_user)

        response = self.client.get(f"/api/students/by-class/{self.other_batch.id}/?summary=1")

        self.assertEqual(response.status_code, 403)

    def test_students_list_returns_lightweight_table_payload(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/students/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        row = response.data[0]
        self.assertEqual(row["name"], "Summary Student")
        self.assertEqual(row["f_name"], "Summary Parent")
        self.assertEqual(row["current_enrollments"][0]["batch_name"], "Batch A")
        self.assertEqual(row["current_enrollments"][0]["course_name"], "Math")
        self.assertNotIn("attendances", row)
        self.assertNotIn("marks", row)

    def test_attendance_sessions_list_omits_records(self):
        self.client.force_authenticate(user=self.admin)
        session = AttendanceSession.objects.create(
            tenant=self.tenant,
            batch=self.batch,
            course=self.course,
            teacher=self.teacher,
            date=date(2026, 8, 1),
            created_by=self.admin,
        )
        self.student.attendances.update(session=session)

        response = self.client.get("/api/attendance-sessions/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["present_count"], 1)
        self.assertEqual(response.data[0]["absent_count"], 1)
        self.assertNotIn("records", response.data[0])


class PublicOnlinePageTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tenant_a = Tenant.objects.create(name="Alpha Center")
        self.tenant_b = Tenant.objects.create(name="Beta Center")
        self.admin_role_a = Role.objects.create(tenant=self.tenant_a, name="Admin", slug="admin")
        self.admin_role_b = Role.objects.create(tenant=self.tenant_b, name="Admin", slug="admin")
        self.admin_a = User.objects.create_user(username="alpha-admin", password="pass", role=self.admin_role_a, tenant=self.tenant_a)
        self.admin_b = User.objects.create_user(username="beta-admin", password="pass", role=self.admin_role_b, tenant=self.tenant_b)
        seed_permissions_and_roles(self.tenant_a, self.admin_a)
        seed_permissions_and_roles(self.tenant_b, self.admin_b)

        TenantPublicSiteSettings.objects.create(
            tenant=self.tenant_a,
            center_name="Alpha Center",
            hero_title="Alpha Learning",
            is_published=True,
            created_by=self.admin_a,
        )
        TenantPublicSiteSettings.objects.create(
            tenant=self.tenant_b,
            center_name="Beta Center",
            hero_title="Beta Learning",
            is_published=True,
            created_by=self.admin_b,
        )

    def test_public_site_returns_only_selected_tenant_published_content(self):
        PublicAnnouncement.objects.create(
            tenant=self.tenant_a,
            title="Alpha Published",
            summary="Visible",
            body="Alpha body",
            is_published=True,
            created_by=self.admin_a,
        )
        PublicAnnouncement.objects.create(
            tenant=self.tenant_a,
            title="Alpha Draft",
            summary="Hidden",
            body="Draft body",
            is_published=False,
            created_by=self.admin_a,
        )
        PublicAnnouncement.objects.create(
            tenant=self.tenant_b,
            title="Beta Published",
            summary="Other tenant",
            body="Beta body",
            is_published=True,
            created_by=self.admin_b,
        )

        response = self.client.get(f"/api/public/sites/{self.tenant_a.public_slug}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["tenant"]["slug"], self.tenant_a.public_slug)
        titles = [item["title"] for item in response.data["announcements"]]
        self.assertEqual(titles, ["Alpha Published"])

    def test_public_site_creates_default_settings_when_missing(self):
        tenant = Tenant.objects.create(name="SDF")

        response = self.client.get(f"/api/public/sites/{tenant.public_slug}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["tenant"]["slug"], tenant.public_slug)
        self.assertEqual(response.data["tenant"]["name"], "SDF")
        self.assertTrue(TenantPublicSiteSettings.objects.get(tenant=tenant).is_published)

    def test_public_site_returns_not_found_when_settings_are_unpublished(self):
        tenant = Tenant.objects.create(name="Draft Center")
        TenantPublicSiteSettings.objects.create(
            tenant=tenant,
            center_name="Draft Center",
            is_published=False,
        )

        response = self.client.get(f"/api/public/sites/{tenant.public_slug}/")

        self.assertEqual(response.status_code, 404)

    def test_public_post_comments_are_pending_until_approved(self):
        post = PublicAnnouncement.objects.create(
            tenant=self.tenant_a,
            title="Commented Post",
            summary="Visible",
            body="Body",
            is_published=True,
            created_by=self.admin_a,
        )

        submit_response = self.client.post(
            f"/api/public/sites/{self.tenant_a.public_slug}/announcements/{post.slug}/comments/",
            {"visitor_name": "Visitor", "visitor_email": "visitor@example.com", "body": "This is useful."},
            format="json",
        )
        detail_response = self.client.get(f"/api/public/sites/{self.tenant_a.public_slug}/announcements/{post.slug}/")
        comment = PublicAnnouncementComment.objects.get(announcement=post)
        comment.status = PublicAnnouncementComment.Status.APPROVED
        comment.save(update_fields=["status"])
        approved_response = self.client.get(f"/api/public/sites/{self.tenant_a.public_slug}/announcements/{post.slug}/")

        self.assertEqual(submit_response.status_code, 201)
        self.assertEqual(comment.tenant, self.tenant_a)
        self.assertEqual(detail_response.data["comments"], [])
        self.assertEqual(len(approved_response.data["comments"]), 1)

    def test_tenant_admin_comment_moderation_is_scoped_to_own_tenant(self):
        own_post = PublicAnnouncement.objects.create(
            tenant=self.tenant_a,
            title="Own Post",
            body="Own body",
            is_published=True,
            created_by=self.admin_a,
        )
        other_post = PublicAnnouncement.objects.create(
            tenant=self.tenant_b,
            title="Other Post",
            body="Other body",
            is_published=True,
            created_by=self.admin_b,
        )
        own_comment = PublicAnnouncementComment.objects.create(
            tenant=self.tenant_a,
            announcement=own_post,
            visitor_name="Own Visitor",
            body="Own comment",
        )
        other_comment = PublicAnnouncementComment.objects.create(
            tenant=self.tenant_b,
            announcement=other_post,
            visitor_name="Other Visitor",
            body="Other comment",
        )

        self.client.force_authenticate(user=self.admin_a)
        list_response = self.client.get("/api/v1/online-page/comments/")
        approve_response = self.client.post(f"/api/v1/online-page/comments/{own_comment.id}/approve/")
        other_response = self.client.post(f"/api/v1/online-page/comments/{other_comment.id}/approve/")
        own_comment.refresh_from_db()

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual([item["id"] for item in list_response.data["results"]], [own_comment.id])
        self.assertEqual(approve_response.status_code, 200)
        self.assertEqual(own_comment.status, PublicAnnouncementComment.Status.APPROVED)
        self.assertEqual(other_response.status_code, 404)

    def test_public_event_detail_is_tenant_scoped(self):
        event = PublicEvent.objects.create(
            tenant=self.tenant_a,
            title="Open Day",
            summary="Visit us",
            description="Full details",
            starts_at=timezone.now(),
            is_published=True,
            created_by=self.admin_a,
        )

        response = self.client.get(f"/api/public/sites/{self.tenant_a.public_slug}/events/{event.slug}/")
        other_response = self.client.get(f"/api/public/sites/{self.tenant_b.public_slug}/events/{event.slug}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["event"]["title"], "Open Day")
        self.assertEqual(other_response.status_code, 404)

    def test_public_sitemap_includes_only_selected_tenant_published_urls(self):
        own_post = PublicAnnouncement.objects.create(
            tenant=self.tenant_a,
            title="Alpha Sitemap Post",
            body="Own body",
            is_published=True,
            created_by=self.admin_a,
        )
        other_post = PublicAnnouncement.objects.create(
            tenant=self.tenant_b,
            title="Beta Sitemap Post",
            body="Other body",
            is_published=True,
            created_by=self.admin_b,
        )

        response = self.client.get(f"/api/public/sites/{self.tenant_a.public_slug}/sitemap.xml")
        body = response.content.decode()

        self.assertEqual(response.status_code, 200)
        self.assertIn(f"/site/{self.tenant_a.public_slug}/news/{own_post.slug}", body)
        self.assertNotIn(f"/site/{self.tenant_b.public_slug}/news/{other_post.slug}", body)

    def test_public_content_slugs_are_normalized_and_unique_per_tenant(self):
        first = PublicAnnouncement.objects.create(
            tenant=self.tenant_a,
            title="Admissions Open",
            slug="Admissions Open!",
            body="First",
            is_published=True,
            created_by=self.admin_a,
        )
        second = PublicAnnouncement.objects.create(
            tenant=self.tenant_a,
            title="Admissions Open",
            slug="Admissions Open!",
            body="Second",
            is_published=True,
            created_by=self.admin_a,
        )

        self.assertEqual(first.slug, "admissions-open")
        self.assertEqual(second.slug, "admissions-open-2")

    def test_public_inquiry_rejects_honeypot_spam(self):
        response = self.client.post(
            f"/api/public/sites/{self.tenant_a.public_slug}/inquiries/",
            {
                "visitor_name": "Bot",
                "visitor_email": "bot@example.com",
                "message": "Please visit http://spam.example now",
                "website": "filled-by-bot",
                "source": "contact",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_publishing_future_announcement_makes_it_public_now(self):
        post = PublicAnnouncement.objects.create(
            tenant=self.tenant_a,
            title="Future Post",
            body="Body",
            is_published=False,
            published_at=timezone.now() + timedelta(days=1),
            created_by=self.admin_a,
        )

        self.client.force_authenticate(user=self.admin_a)
        publish_response = self.client.post(f"/api/v1/online-page/announcements/{post.id}/publish/")
        public_response = self.client.get(f"/api/public/sites/{self.tenant_a.public_slug}/")
        post.refresh_from_db()

        self.assertEqual(publish_response.status_code, 200)
        self.assertTrue(post.is_published)
        self.assertLessEqual(post.published_at, timezone.now())
        self.assertIn("Future Post", [item["title"] for item in public_response.data["announcements"]])

    def test_tenant_admin_online_page_manager_is_scoped_to_own_tenant(self):
        own_course = PublicCourseProgram.objects.create(
            tenant=self.tenant_a,
            title="Alpha Course",
            summary="Own tenant",
            is_published=True,
            created_by=self.admin_a,
        )
        other_course = PublicCourseProgram.objects.create(
            tenant=self.tenant_b,
            title="Beta Course",
            summary="Other tenant",
            is_published=True,
            created_by=self.admin_b,
        )

        self.client.force_authenticate(user=self.admin_a)
        list_response = self.client.get("/api/v1/online-page/courses/")
        patch_response = self.client.patch(
            f"/api/v1/online-page/courses/{other_course.id}/",
            {"title": "Should Not Update"},
            format="json",
        )

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual([item["id"] for item in list_response.data["results"]], [own_course.id])
        self.assertEqual(patch_response.status_code, 404)
        other_course.refresh_from_db()
        self.assertEqual(other_course.title, "Beta Course")

    def test_tenant_admin_can_load_and_update_current_public_site_settings(self):
        self.client.force_authenticate(user=self.admin_a)

        load_response = self.client.get("/api/v1/online-page/settings/current/")
        save_response = self.client.patch(
            "/api/v1/online-page/settings/current/",
            {"center_name": "Alpha Academy", "hero_title": "Learn With Alpha"},
            format="json",
        )

        self.assertEqual(load_response.status_code, 200)
        self.assertEqual(load_response.data["center_name"], "Alpha Center")
        self.assertEqual(save_response.status_code, 200)
        self.assertEqual(save_response.data["center_name"], "Alpha Academy")
        self.assertEqual(save_response.data["hero_title"], "Learn With Alpha")

    def test_tenant_admin_can_publish_and_unpublish_public_site_settings(self):
        self.client.force_authenticate(user=self.admin_a)

        unpublish_response = self.client.post("/api/v1/online-page/settings/unpublish/")
        publish_response = self.client.post("/api/v1/online-page/settings/publish/")

        self.assertEqual(unpublish_response.status_code, 200)
        self.assertFalse(unpublish_response.data["is_published"])
        self.assertEqual(publish_response.status_code, 200)
        self.assertTrue(publish_response.data["is_published"])
