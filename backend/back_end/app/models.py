from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django.utils.text import slugify
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser
from django.db.models import Max
from decimal import Decimal
# Create your models here.

class Tenant(models.Model):
    name = models.CharField(max_length=200)
    public_slug = models.SlugField(max_length=180, unique=True, null=True, blank=True)
    public_site_enabled = models.BooleanField(default=True)
    logo = models.ImageField(
        upload_to="logos/",
        null=True,
        blank=True
    )

    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    subscription_expiry = models.DateField(
    null=True,
    blank=True
)
    subscription_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subscription_notes = models.TextField(blank=True)
    notification_settings = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.public_slug:
            base_slug = slugify(self.name) or "education-center"
            candidate = base_slug
            counter = 2
            queryset = Tenant.objects.exclude(pk=self.pk)
            while queryset.filter(public_slug=candidate).exists():
                candidate = f"{base_slug}-{counter}"
                counter += 1
            self.public_slug = candidate
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class User(AbstractUser):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True
    )
    role = models.ForeignKey(
        "Role",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="users",
    )
    phone = models.CharField(max_length=30, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    is_deactivated = models.BooleanField(default=False)

    @property
    def role_slug(self):
        return self.role.slug if self.role_id else None

    @property
    def is_super_admin(self):
        return self.role_slug == "super-admin" or self.role_slug == "super_admin"


class RBACPermission(models.Model):
    module = models.CharField(max_length=80)
    action = models.CharField(max_length=80)
    code = models.CharField(max_length=160, unique=True)
    label = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["module", "action"]
        indexes = [
            models.Index(fields=["module", "action"]),
            models.Index(fields=["code"]),
        ]

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = f"{self.module}.{self.action}".lower().replace(" ", "_")
        super().save(*args, **kwargs)

    def __str__(self):
        return self.code


class Role(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="roles",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=100)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(RBACPermission, blank=True, related_name="roles")
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    default_dashboard = models.CharField(max_length=120, blank=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_roles",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("tenant", "slug")
        ordering = ["name"]
        indexes = [
            models.Index(fields=["tenant", "slug"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.name


class SoftArchiveMixin(models.Model):
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def archive(self):
        self.is_active = False
        self.is_archived = True
        self.archived_at = timezone.now()
        self.save(update_fields=["is_active", "is_archived", "archived_at"])

    def restore(self):
        self.is_active = True
        self.is_archived = False
        self.archived_at = None
        self.save(update_fields=["is_active", "is_archived", "archived_at"])
class Teachers(SoftArchiveMixin):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='teachers',
        null=True,
        blank=True
    )
    full_name=models.CharField(max_length=150)
    phone_number=models.CharField(max_length=20)
    user = models.OneToOneField(User, on_delete=models.PROTECT, related_name="teacher_profile")
    email_address=models.CharField(max_length=100)
    subject=models.CharField(max_length=50)
    department=models.CharField(max_length=30,null=True,blank=True)

    

    def __str__(self):
        return self.full_name
    

class RoomOfClass(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='roomsOFClasses',
        null=True,
        blank=True
    )
    name=models.CharField(max_length=100,default='Room A')


class Course(SoftArchiveMixin):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="courses",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=40, blank=True)
    description = models.TextField(blank=True)
    duration_weeks = models.PositiveIntegerField(default=0)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("tenant", "code")

    def __str__(self):
        return self.name


class Classes(SoftArchiveMixin):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='classes',
        null=True,
        blank=True
    )
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="batches", null=True, blank=True)
    name=models.CharField(max_length=100)
    roomOfClass=models.ForeignKey(RoomOfClass,on_delete=models.SET_NULL,related_name='classes',null=True,blank=True)
    teachers=models.ManyToManyField(Teachers,related_name='classes',blank=True)
    subjects=models.CharField(max_length=200)
    start_time=models.TimeField(null=True, blank=True)
    end_time=models.TimeField(null=True, blank=True)
    startDate=models.DateField()
    endDate=models.DateField()
    capacity = models.PositiveIntegerField(default=0)

    @property
    def course_name(self):
        return self.course.name if self.course_id else self.name

        
    
    def total_earnings(self):
        return self.invoices.exclude(status=Invoice.Status.CANCELLED).aggregate(total=models.Sum("paid_amount"))["total"] or 0
    
    
    def __str__(self):
        return self.name


    
class Students(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='students',
        null=True,
        blank=True
    )
    name=models.CharField(max_length=100)
    f_name=models.CharField(max_length=100)
    user = models.OneToOneField(User, on_delete=models.PROTECT, related_name="student_profile")
    role_number=models.CharField(max_length=20, blank=True)
    parent_mobile_number=models.CharField(max_length=20)
    address=models.CharField(max_length=200)
    student_number = models.PositiveIntegerField(
            null=True,
            blank=True
        )
    enrollment_date = models.DateField(default=timezone.localdate)
    is_active = models.BooleanField(default=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    def save(self, *args, **kwargs):
        if not self.pk and not self.student_number:
            last_number = Students.objects.filter(
                tenant=self.tenant
            ).aggregate(
                max_number=Max('student_number')
            )['max_number']

            self.student_number = (last_number or 0) + 1
        if not self.role_number and self.student_number:
            self.role_number = self.formatted_student_number

        super().save(*args, **kwargs)

    @property
    def formatted_student_number(self):
        year = (self.enrollment_date or timezone.localdate()).year
        return f"ST{year}{int(self.student_number or 0):05d}"

    
    def __str__(self):
        return self.name

    def archive(self):
        self.is_active = False
        self.is_archived = True
        self.archived_at = timezone.now()
        self.save(update_fields=["is_active", "is_archived", "archived_at"])

    def restore(self):
        self.is_active = True
        self.is_archived = False
        self.archived_at = None
        self.save(update_fields=["is_active", "is_archived", "archived_at"])


class Enrollment(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"
        COMPLETED = "completed", "Completed"
        DROPPED = "dropped", "Dropped"
        TRANSFERRED = "transferred", "Transferred"
        CANCELLED = "cancelled", "Cancelled"
        ARCHIVED = "archived", "Archived"

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="enrollments", null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_enrollments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    student = models.ForeignKey(Students, on_delete=models.PROTECT, related_name="enrollments")
    batch = models.ForeignKey(Classes, on_delete=models.PROTECT, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="enrollments")
    enrollment_date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    completed_date = models.DateField(null=True, blank=True)
    certificate_issued = models.BooleanField(default=False)
    remarks = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ["-enrollment_date", "student__name"]
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["student", "status"]),
            models.Index(fields=["batch", "status"]),
            models.Index(fields=["course", "status"]),
        ]

    def save(self, *args, **kwargs):
        if self.batch_id and not self.course_id:
            self.course = self.batch.course
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.name} - {self.batch.name}"


class PromotionHistory(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="promotion_histories")
    student = models.ForeignKey(Students, on_delete=models.PROTECT, related_name="promotion_histories")
    old_enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name="promotions_from", null=True, blank=True)
    new_enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name="promotions_to")
    old_class = models.ForeignKey(Classes, on_delete=models.PROTECT, related_name="promotions_from")
    new_class = models.ForeignKey(Classes, on_delete=models.PROTECT, related_name="promotions_to")
    promotion_date = models.DateField(default=timezone.localdate)
    promoted_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="promotions_performed", null=True, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-promotion_date", "-created_at"]
        indexes = [
            models.Index(fields=["tenant", "promotion_date"]),
            models.Index(fields=["student", "promotion_date"]),
            models.Index(fields=["new_class", "promotion_date"]),
        ]

    def __str__(self):
        return f"{self.student.name}: {self.old_class.name} -> {self.new_class.name}"

class Marks(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='marks',
        null=True,
        blank=True
    )
    student=models.ForeignKey(Students,on_delete=models.CASCADE, related_name="marks")
    marks_obtained=models.IntegerField()
    total_marks=models.IntegerField()
    className=models.CharField(max_length=50,null=True,blank=True)
    exam_type=models.CharField(max_length=50, choices=[
        ('quiz','Quiz'),
        ('assignment','Assignment'),
        ('midterm','Medterm'),
        ('final','Final exam'),
    ])
    exam_date = models.DateField(null=True, blank=True)
    status=models.CharField(max_length=50,choices=[
        ('present','Present'),
        ('absent','Absent'),
        ('excused','Excused'),

    ],
    default='present')
    remarks = models.TextField(null=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    class Meta:
        
        unique_together=('student','className','exam_type')

    def __str__(self):
        return f"{self.student.name} - {self.exam_type}"
    

class Events(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='events',
        null=True,
        blank=True
    )
    title=models.CharField(max_length=200, null=True,blank=True)
    discription=models.CharField(max_length=300, null=True,blank=True)
    image=models.ImageField(upload_to='event_images/', null=True,blank=True)
    date=models.DateField(null=True,blank=True)

    def __str__(self):
        return self.title
    




class AttendanceSession(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        OPEN = "open", "Open"
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        LOCKED = "locked", "Locked"

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="attendance_sessions", null=True, blank=True)
    batch = models.ForeignKey(Classes, on_delete=models.PROTECT, related_name="attendance_sessions")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="attendance_sessions", null=True, blank=True)
    teacher = models.ForeignKey(Teachers, on_delete=models.SET_NULL, related_name="attendance_sessions", null=True, blank=True)
    date = models.DateField(default=timezone.localdate)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    session_topic = models.CharField(max_length=200, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="created_attendance_sessions", null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="approved_attendance_sessions", null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]
        unique_together = ("tenant", "batch", "date")

    def __str__(self):
        return f"{self.batch.name} - {self.date}"


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        LATE = "late", "Late"
        EXCUSED = "excused", "Excused"
        SICK_LEAVE = "sick_leave", "Sick Leave"
        HOLIDAY = "holiday", "Holiday"

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='attendances',
        null=True,
        blank=True
    )
    session=models.ForeignKey(AttendanceSession,on_delete=models.CASCADE,related_name='records',null=True,blank=True)
    enrollment=models.ForeignKey(Enrollment,on_delete=models.PROTECT,related_name='attendances',null=True,blank=True)
    student=models.ForeignKey(Students,on_delete=models.PROTECT,related_name='attendances')
    class_fk=models.ForeignKey(Classes,on_delete=models.PROTECT,related_name='attendances')    
    course=models.ForeignKey(Course,on_delete=models.PROTECT,related_name='attendances',null=True,blank=True)
    teacher=models.ForeignKey(Teachers,on_delete=models.SET_NULL,related_name='marked_attendances',null=True,blank=True)
    date=models.DateField()
    status=models.CharField(max_length=20,choices=Status.choices,default=Status.ABSENT)
    is_present=models.BooleanField(default=False)
    check_in_time=models.TimeField(null=True,blank=True)
    check_out_time=models.TimeField(null=True,blank=True)
    remarks=models.TextField(blank=True)
    reason_for_absence=models.TextField(blank=True)
    marked_by=models.ForeignKey(User,on_delete=models.SET_NULL,related_name='marked_attendances',null=True,blank=True)
    approved_by=models.ForeignKey(User,on_delete=models.SET_NULL,related_name='approved_attendances',null=True,blank=True)
    is_locked=models.BooleanField(default=False)
    created_at=models.DateTimeField(default=timezone.now)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        unique_together=('student','date','class_fk')


class Staff(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='staffs',
        null=True,
        blank=True
    )
    name=models.CharField(max_length=100)
    phone_number=models.CharField(max_length=20)
    email=models.EmailField(max_length=50,blank=True, null=True)
    role=models.CharField(max_length=60)
    photo=models.ImageField(upload_to='staff_images/',blank=True,null=True)

    def __str__(self):
        return self.name

class ExpenseCategory(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="expense_categories", null=True, blank=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        unique_together = ("tenant", "name")

    def __str__(self):
        return self.name


class Expenses(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='expenses',
        null=True,
        blank=True
    )
    expense_number=models.CharField(max_length=30,blank=True)
    name=models.CharField(max_length=200)
    title=models.CharField(max_length=200,blank=True)
    category=models.ForeignKey(ExpenseCategory,on_delete=models.SET_NULL,related_name='expenses',null=True,blank=True)
    subcategory=models.CharField(max_length=120,blank=True)
    amount=models.DecimalField(max_digits=10, decimal_places=2)
    currency=models.CharField(max_length=3,default="AFN")
    date=models.DateField(default=timezone.localdate)
    expense_date=models.DateField(default=timezone.localdate)
    payment_date=models.DateField(null=True,blank=True)
    description=models.TextField(blank=True)
    notes=models.TextField(blank=True)
    attachment=models.FileField(upload_to="expense_attachments/",null=True,blank=True)
    receipt=models.FileField(upload_to="expense_receipts/",null=True,blank=True)
    created_by=models.ForeignKey(User,on_delete=models.SET_NULL,related_name='created_expenses',null=True,blank=True)
    approved_by=models.ForeignKey(User,on_delete=models.SET_NULL,related_name='approved_expenses',null=True,blank=True)
    approval_date=models.DateTimeField(null=True,blank=True)
    is_archived=models.BooleanField(default=False)
    created_at=models.DateTimeField(default=timezone.now)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-expense_date", "-created_at"]

    def save(self, *args, **kwargs):
        if not self.title:
            self.title = self.name
        if not self.name:
            self.name = self.title
        if not self.expense_number:
            year = timezone.localdate().year
            last = Expenses.objects.filter(tenant=self.tenant, expense_number__startswith=f"EXP-{year}-").aggregate(max_id=Max("id"))["max_id"] or 0
            self.expense_number = f"EXP-{year}-{last + 1:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Budget(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="budgets", null=True, blank=True)
    name = models.CharField(max_length=160)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, related_name="budgets", null=True, blank=True)
    allocated_amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def spent_amount(self):
        qs = Expenses.objects.filter(tenant=self.tenant, expense_date__range=[self.start_date, self.end_date])
        if self.category_id:
            qs = qs.filter(category=self.category)
        return qs.aggregate(total=Sum("amount"))["total"] or Decimal("0")

    @property
    def remaining_amount(self):
        return self.allocated_amount - self.spent_amount

    @property
    def used_percentage(self):
        return round((self.spent_amount / self.allocated_amount) * 100, 2) if self.allocated_amount else 0


class RecurringExpense(models.Model):
    class Frequency(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        QUARTERLY = "quarterly", "Quarterly"
        YEARLY = "yearly", "Yearly"

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="recurring_expenses", null=True, blank=True)
    title = models.CharField(max_length=200)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.SET_NULL, related_name="recurring_expenses", null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="AFN")
    frequency = models.CharField(max_length=20, choices=Frequency.choices, default=Frequency.MONTHLY)
    next_run_date = models.DateField()
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ExpenseHistory(models.Model):
    ACTION_CHOICES=[
        ('created','Created'),
        ('updated','Updated'),
        ('deleted','Deleted')
    ]
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='expense_histories',
        null=True,
        blank=True
    )
    name=models.CharField(max_length=200)
    amount=models.DecimalField(max_digits=10, decimal_places=2)
    date_time=models.DateTimeField(default=timezone.now)
    changed_fields=models.JSONField(blank=True,null=True)
    action=models.CharField(max_length=10,choices=ACTION_CHOICES,default='Created')
    description=models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.action} on {self.date_time.strftime('%Y-%m-%d %H:%M')}"
    


class Assignment(models.Model):
        tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='assignments',
        null=True,
        blank=True
    )
        class_assigned=models.ForeignKey(Classes,on_delete=models.PROTECT, related_name="assignments")
        title=models.CharField(max_length=255)
        discription=models.TextField()
        attachment=models.FileField(upload_to="assignment_attachments/", null=True, blank=True)
        due_date=models.DateField()
        total_marks=models.IntegerField(default=100)
        created_at=models.DateTimeField(auto_now_add=True)
        created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

        def __str__(self):
            return f"{self.title} - {self.class_assigned.name}"

class Submission(models.Model):
    STATUS_CHOICES=[
        ('pending','Pending'),
        ('submitted','Submitted'),
        ('late','Late'),
        ('not_submitted','Not Submitted')
    ]
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='submissions',
        null=True,
        blank=True
    )
    assignment=models.ForeignKey(Assignment,on_delete=models.PROTECT,related_name='submissions')
    enrollment=models.ForeignKey(Enrollment,on_delete=models.PROTECT,related_name='submissions',null=True,blank=True)
    student=models.ForeignKey(Students,models.PROTECT,related_name='submissions')
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default='pending')
    submitted_file=models.FileField(upload_to="assignment_submissions/", null=True, blank=True)
    marks_obtained=models.FloatField(null=True,blank=True)
    suggestion=models.TextField(null=True,blank=True)
    submitted_at=models.DateTimeField(null=True,blank=True)
    graded_at=models.DateTimeField(null=True,blank=True)

    class Meta:
        unique_together = ("student", "assignment")  
    def __str__(self):
        return f"{self.student.name} - {self.assignment.title}"


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class TenantOwnedModel(TimeStampedModel):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name="%(class)ss",
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_%(class)ss",
    )

    class Meta:
        abstract = True


def public_site_upload_path(instance, filename):
    tenant_id = instance.tenant_id or "unassigned"
    model_name = instance.__class__.__name__.lower()
    return f"public_site/{tenant_id}/{model_name}/{filename}"


def ensure_unique_tenant_slug(instance, source_field="title"):
    source = getattr(instance, "slug", None) or getattr(instance, source_field, "") or "item"
    base_slug = slugify(source) or "item"
    candidate = base_slug
    counter = 2
    queryset = instance.__class__.objects.filter(tenant=instance.tenant).exclude(pk=instance.pk)
    while queryset.filter(slug=candidate).exists():
        candidate = f"{base_slug}-{counter}"
        counter += 1
    instance.slug = candidate


class OptimizedImageMixin:
    image_fields = ()

    def save(self, *args, **kwargs):
        from .services.image_service import delete_replaced_model_image_fields, optimize_model_image_fields

        old_file_names = {}
        if self.pk:
            try:
                old_instance = self.__class__.objects.only(*self.image_fields).get(pk=self.pk)
                old_file_names = {
                    field_name: getattr(old_instance, field_name).name
                    for field_name in self.image_fields
                    if getattr(old_instance, field_name, None)
                }
            except self.__class__.DoesNotExist:
                old_file_names = {}
        optimize_model_image_fields(self, self.image_fields)
        super().save(*args, **kwargs)
        delete_replaced_model_image_fields(self, self.image_fields, old_file_names)

    def delete(self, *args, **kwargs):
        from .services.image_service import delete_model_image_fields

        file_names = {
            field_name: getattr(self, field_name).name
            for field_name in self.image_fields
            if getattr(self, field_name, None)
        }
        result = super().delete(*args, **kwargs)
        delete_model_image_fields(self, self.image_fields, file_names)
        return result


class Assessment(TenantOwnedModel):
    class AssessmentType(models.TextChoices):
        QUIZ = "quiz", "Quiz"
        HOMEWORK = "homework", "Homework"
        ASSIGNMENT = "assignment", "Assignment"
        MIDTERM = "midterm", "Midterm"
        FINAL_EXAM = "final_exam", "Final Exam"
        ORAL_EXAM = "oral_exam", "Oral Exam"
        PRACTICAL_EXAM = "practical_exam", "Practical Exam"
        MONTHLY_TEST = "monthly_test", "Monthly Test"
        SURPRISE_TEST = "surprise_test", "Surprise Test"
        CUSTOM = "custom", "Custom"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SCHEDULED = "scheduled", "Scheduled"
        PUBLISHED = "published", "Published"
        CLOSED = "closed", "Closed"
        ARCHIVED = "archived", "Archived"

    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="assessments", null=True, blank=True)
    batch = models.ForeignKey(Classes, on_delete=models.PROTECT, related_name="assessments", null=True, blank=True)
    teacher = models.ForeignKey(Teachers, on_delete=models.PROTECT, related_name="assessments")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assessment_type = models.CharField(max_length=30, choices=AssessmentType.choices)
    maximum_marks = models.DecimalField(max_digits=8, decimal_places=2)
    passing_marks = models.DecimalField(max_digits=8, decimal_places=2)
    assessment_date = models.DateField()
    publish_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    class Meta:
        ordering = ["-assessment_date", "-created_at"]
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["course", "assessment_date"]),
            models.Index(fields=["batch", "assessment_date"]),
            models.Index(fields=["teacher", "assessment_date"]),
        ]

    def clean(self):
        if self.maximum_marks <= 0:
            raise ValidationError({"maximum_marks": "Maximum marks must be greater than zero."})
        if self.passing_marks < 0 or self.passing_marks > self.maximum_marks:
            raise ValidationError({"passing_marks": "Passing marks must be between 0 and maximum marks."})

    def __str__(self):
        return f"{self.title} - {self.course.name if self.course_id else self.batch.name}"


class AssessmentResult(TenantOwnedModel):
    assessment = models.ForeignKey(Assessment, on_delete=models.PROTECT, related_name="results")
    enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name="assessment_results", null=True, blank=True)
    student = models.ForeignKey(Students, on_delete=models.PROTECT, related_name="assessment_results")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="assessment_results", null=True, blank=True)
    batch = models.ForeignKey(Classes, on_delete=models.PROTECT, related_name="assessment_results", null=True, blank=True)
    teacher = models.ForeignKey(Teachers, on_delete=models.PROTECT, related_name="assessment_results", null=True, blank=True)
    marks_obtained = models.DecimalField(max_digits=8, decimal_places=2)
    percentage = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    grade = models.CharField(max_length=5, blank=True)
    is_passed = models.BooleanField(default=False)
    remarks = models.TextField(blank=True)
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="submitted_assessment_results",
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["assessment", "student__name"]
        unique_together = ("assessment", "enrollment")
        indexes = [
            models.Index(fields=["tenant", "assessment"]),
            models.Index(fields=["enrollment", "assessment"]),
            models.Index(fields=["student", "assessment"]),
            models.Index(fields=["course", "batch"]),
            models.Index(fields=["grade"]),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.assessment.title}"


class FeePlan(TenantOwnedModel):
    class BillingCycle(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        BATCH = "batch", "Batch / One-time"

    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="fee_plans")
    batch = models.ForeignKey(Classes, on_delete=models.PROTECT, related_name="fee_plans", null=True, blank=True)
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    registration_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exam_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_allowed = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")
    billing_cycle = models.CharField(max_length=20, choices=BillingCycle.choices, default=BillingCycle.MONTHLY)
    due_day = models.PositiveSmallIntegerField(default=5)
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grace_period_days = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["course__name", "batch__name", "-created_at"]
        indexes = [
            models.Index(fields=["tenant", "is_active"]),
            models.Index(fields=["course", "batch"]),
            models.Index(fields=["currency"]),
        ]

    def __str__(self):
        label = f"{self.course.name}"
        if self.batch_id:
            label = f"{label} / {self.batch.name}"
        return f"{label} fee plan"


class EnrollmentBillingProfile(TenantOwnedModel):
    class DiscountType(models.TextChoices):
        NONE = "none", "None"
        FIXED = "fixed", "Fixed Amount"
        PERCENTAGE = "percentage", "Percentage"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        CLOSED = "closed", "Closed"

    enrollment = models.OneToOneField(Enrollment, on_delete=models.PROTECT, related_name="billing_profile")
    fee_plan = models.ForeignKey(FeePlan, on_delete=models.PROTECT, related_name="billing_profiles")
    fee_plan_name = models.CharField(max_length=180, blank=True)
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    registration_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    exam_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_allowed = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default="USD")
    billing_cycle = models.CharField(max_length=20, default=FeePlan.BillingCycle.MONTHLY)
    due_day = models.PositiveSmallIntegerField(default=5)
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grace_period_days = models.PositiveSmallIntegerField(default=0)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.NONE)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    scholarship = models.CharField(max_length=150, blank=True)
    billing_start_date = models.DateField(default=timezone.localdate)
    billing_end_date = models.DateField(null=True, blank=True)
    billing_status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["enrollment__student__name", "enrollment__course__name"]
        indexes = [
            models.Index(fields=["tenant", "billing_status"]),
            models.Index(fields=["fee_plan"]),
        ]

    def __str__(self):
        return f"Billing profile for {self.enrollment}"


class Invoice(TenantOwnedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIAL = "partial", "Partial"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"
        OVERDUE = "overdue", "Overdue"

    invoice_number = models.CharField(max_length=40, unique=True)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name="invoices", null=True, blank=True)
    student = models.ForeignKey(Students, on_delete=models.PROTECT, related_name="invoices")
    course = models.ForeignKey(Course, on_delete=models.PROTECT, related_name="invoices", null=True, blank=True)
    batch = models.ForeignKey(Classes, on_delete=models.PROTECT, related_name="invoices", null=True, blank=True)
    month = models.PositiveSmallIntegerField()
    year = models.PositiveIntegerField()
    billing_month = models.PositiveSmallIntegerField(default=1)
    billing_year = models.PositiveIntegerField(default=2000)
    due_date = models.DateField()
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    previous_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ["-billing_year", "-billing_month", "student__name"]
        unique_together = ("tenant", "enrollment", "billing_month", "billing_year")
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["student", "year", "month"]),
            models.Index(fields=["enrollment", "billing_year", "billing_month"]),
            models.Index(fields=["course", "batch"]),
            models.Index(fields=["due_date"]),
        ]

    def __str__(self):
        return self.invoice_number


class Payment(TenantOwnedModel):
    class Method(models.TextChoices):
        CASH = "cash", "Cash"
        BANK = "bank", "Bank"
        CARD = "card", "Card"
        MOBILE_MONEY = "mobile_money", "Mobile Money"
        OTHER = "other", "Other"

    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    student = models.ForeignKey(Students, on_delete=models.PROTECT, related_name="payments", null=True, blank=True)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.PROTECT, related_name="payments", null=True, blank=True)
    payment_date = models.DateField(default=timezone.localdate)
    payment_method = models.CharField(max_length=20, choices=Method.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    reference_number = models.CharField(max_length=100, blank=True)
    receipt_number = models.CharField(max_length=40, unique=True)
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name="received_payments")

    class Meta:
        ordering = ["-payment_date", "-created_at"]
        indexes = [
            models.Index(fields=["tenant", "payment_date"]),
            models.Index(fields=["receipt_number"]),
        ]

    def __str__(self):
        return self.receipt_number


class StudentLedgerEntry(TenantOwnedModel):
    class TransactionType(models.TextChoices):
        INVOICE_GENERATED = "invoice_generated", "Invoice Generated"
        INVOICE_UPDATED = "invoice_updated", "Invoice Updated"
        PAYMENT_RECEIVED = "payment_received", "Payment Received"
        PARTIAL_PAYMENT = "partial_payment", "Partial Payment"
        DISCOUNT_APPLIED = "discount_applied", "Discount Applied"
        SCHOLARSHIP_APPLIED = "scholarship_applied", "Scholarship Applied"
        LATE_FEE_ADDED = "late_fee_added", "Late Fee Added"
        INVOICE_CANCELLED = "invoice_cancelled", "Invoice Cancelled"
        REFUND = "refund", "Refund"
        ADJUSTMENT = "adjustment", "Adjustment"

    student = models.ForeignKey(Students, on_delete=models.PROTECT, related_name="ledger_entries")
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name="ledger_entries")
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name="ledger_entries")
    transaction_date = models.DateField(default=timezone.localdate)
    transaction_type = models.CharField(max_length=40, choices=TransactionType.choices, default=TransactionType.ADJUSTMENT)
    description = models.CharField(max_length=255)
    debit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reference_number = models.CharField(max_length=80, blank=True)

    class Meta:
        ordering = ["student", "transaction_date", "created_at"]
        indexes = [
            models.Index(fields=["tenant", "student"]),
            models.Index(fields=["transaction_type"]),
            models.Index(fields=["reference_number"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.description}"


class StationeryItem(TenantOwnedModel):
    class Category(models.TextChoices):
        BOOKS = "books", "Books"
        NOTEBOOKS = "notebooks", "Notebooks"
        PENS = "pens", "Pens"
        PENCILS = "pencils", "Pencils"
        BAGS = "bags", "Bags"
        UNIFORMS = "uniforms", "Uniforms"
        COPIES = "copies", "Copies"
        MARKERS = "markers", "Markers"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        IN_STOCK = "in_stock", "In Stock"
        LOW_STOCK = "low_stock", "Low Stock"
        OUT_OF_STOCK = "out_of_stock", "Out of Stock"

    item_name = models.CharField(max_length=255)
    sku = models.CharField(max_length=80)
    barcode = models.CharField(max_length=80, blank=True)
    category = models.CharField(max_length=30, choices=Category.choices)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    selling_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=0)
    minimum_stock = models.PositiveIntegerField(default=0)
    supplier = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_STOCK)

    class Meta:
        ordering = ["item_name"]
        unique_together = ("tenant", "sku")
        indexes = [
            models.Index(fields=["tenant", "category"]),
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["barcode"]),
        ]

    def __str__(self):
        return self.item_name


class InventoryTransaction(TenantOwnedModel):
    class TransactionType(models.TextChoices):
        STOCK_IN = "stock_in", "Stock In"
        STOCK_OUT = "stock_out", "Stock Out"
        ADJUSTMENT = "adjustment", "Adjustment"
        STUDENT_PURCHASE = "student_purchase", "Student Purchase"

    item = models.ForeignKey(StationeryItem, on_delete=models.CASCADE, related_name="transactions")
    transaction_type = models.CharField(max_length=30, choices=TransactionType.choices)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    reference = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant", "transaction_type"]),
            models.Index(fields=["item", "created_at"]),
        ]

    def __str__(self):
        return f"{self.item.item_name} - {self.transaction_type}"


class StationeryPurchase(TenantOwnedModel):
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIAL = "partial", "Partial"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"

    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    receipt_number = models.CharField(max_length=40, unique=True)
    date = models.DateField(default=timezone.localdate)

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["tenant", "payment_status"]),
            models.Index(fields=["receipt_number"]),
        ]

    def __str__(self):
        return self.receipt_number


class StationeryPurchaseItem(TimeStampedModel):
    purchase = models.ForeignKey(StationeryPurchase, on_delete=models.CASCADE, related_name="items")
    item = models.ForeignKey(StationeryItem, on_delete=models.PROTECT, related_name="purchase_items")
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ["purchase", "item__item_name"]
        indexes = [models.Index(fields=["purchase", "item"])]

    def __str__(self):
        return f"{self.item.item_name} x {self.quantity}"


class Notification(TenantOwnedModel):
    class NotificationType(models.TextChoices):
        ASSESSMENT_PUBLISHED = "assessment_published", "Assessment Published"
        FEE_DUE = "fee_due", "Fee Due"
        FEE_OVERDUE = "fee_overdue", "Fee Overdue"
        PAYMENT_RECEIVED = "payment_received", "Payment Received"
        INVENTORY_LOW = "inventory_low", "Inventory Low"
        STATIONERY_SALE = "stationery_sale", "Stationery Sale"
        EXAM_REMINDER = "exam_reminder", "Exam Reminder"

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=40, choices=NotificationType.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant", "recipient", "is_read"]),
            models.Index(fields=["notification_type"]),
        ]

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"


class TenantPublicSiteSettings(OptimizedImageMixin, TimeStampedModel):
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name="public_site_settings")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_public_site_settings",
    )
    is_published = models.BooleanField(default=False)
    center_name = models.CharField(max_length=220, blank=True)
    tagline = models.CharField(max_length=260, blank=True)
    brand_logo = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    banner_image = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    primary_color = models.CharField(max_length=20, default="#0f766e")
    accent_color = models.CharField(max_length=20, default="#f59e0b")

    hero_kicker = models.CharField(max_length=140, blank=True)
    hero_title = models.CharField(max_length=220, blank=True)
    hero_subtitle = models.TextField(blank=True)
    hero_image = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    hero_primary_label = models.CharField(max_length=80, blank=True)
    hero_primary_url = models.CharField(max_length=260, blank=True)
    hero_secondary_label = models.CharField(max_length=80, blank=True)
    hero_secondary_url = models.CharField(max_length=260, blank=True)

    about_title = models.CharField(max_length=220, blank=True)
    about_body = models.TextField(blank=True)
    about_image = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    about_highlights = models.JSONField(default=list, blank=True)

    contact_title = models.CharField(max_length=220, blank=True)
    contact_body = models.TextField(blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=40, blank=True)
    contact_address = models.TextField(blank=True)
    office_hours = models.CharField(max_length=180, blank=True)
    map_url = models.URLField(blank=True)

    chat_enabled = models.BooleanField(default=True)
    chat_title = models.CharField(max_length=160, blank=True)
    chat_welcome_message = models.CharField(max_length=260, blank=True)
    whatsapp_number = models.CharField(max_length=40, blank=True)
    telegram_url = models.URLField(blank=True)
    messenger_url = models.URLField(blank=True)

    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    seo_keywords = models.CharField(max_length=320, blank=True)
    social_image = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    footer_note = models.CharField(max_length=220, blank=True)

    image_fields = ("brand_logo", "banner_image", "hero_image", "about_image", "social_image")

    class Meta:
        verbose_name = "Tenant public site settings"
        verbose_name_plural = "Tenant public site settings"

    def __str__(self):
        return f"Public site settings - {self.tenant.name}"


class PublicCourseProgram(OptimizedImageMixin, TenantOwnedModel):
    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, blank=True)
    summary = models.CharField(max_length=320, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    duration = models.CharField(max_length=120, blank=True)
    price_label = models.CharField(max_length=120, blank=True)
    level = models.CharField(max_length=120, blank=True)
    mode = models.CharField(max_length=120, blank=True)
    button_label = models.CharField(max_length=80, blank=True)
    button_url = models.CharField(max_length=260, blank=True)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)

    image_fields = ("image",)

    class Meta:
        ordering = ["order", "title"]
        unique_together = ("tenant", "slug")
        indexes = [
            models.Index(fields=["tenant", "is_published"]),
            models.Index(fields=["tenant", "slug"]),
        ]

    def save(self, *args, **kwargs):
        ensure_unique_tenant_slug(self)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class PublicAnnouncement(OptimizedImageMixin, TenantOwnedModel):
    title = models.CharField(max_length=240)
    slug = models.SlugField(max_length=260, blank=True)
    summary = models.CharField(max_length=360, blank=True)
    body = models.TextField()
    category = models.CharField(max_length=120, blank=True)
    image = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(default=timezone.now)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)

    image_fields = ("image",)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        unique_together = ("tenant", "slug")
        indexes = [
            models.Index(fields=["tenant", "is_published", "published_at"]),
            models.Index(fields=["tenant", "slug"]),
            models.Index(fields=["tenant", "category"]),
        ]

    def save(self, *args, **kwargs):
        ensure_unique_tenant_slug(self)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class PublicAnnouncementComment(TenantOwnedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        HIDDEN = "hidden", "Hidden"
        SPAM = "spam", "Spam"

    announcement = models.ForeignKey(PublicAnnouncement, on_delete=models.CASCADE, related_name="comments")
    visitor_name = models.CharField(max_length=160)
    visitor_email = models.EmailField(blank=True)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=260, blank=True)
    is_spam = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["tenant", "announcement", "status"]),
            models.Index(fields=["tenant", "status", "created_at"]),
        ]

    def __str__(self):
        return f"{self.visitor_name} on {self.announcement.title}"


class PublicEvent(OptimizedImageMixin, TenantOwnedModel):
    title = models.CharField(max_length=240)
    slug = models.SlugField(max_length=260, blank=True)
    summary = models.CharField(max_length=360, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    location = models.CharField(max_length=220, blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    order = models.PositiveIntegerField(default=0)

    image_fields = ("image",)

    class Meta:
        ordering = ["starts_at", "order", "title"]
        unique_together = ("tenant", "slug")
        indexes = [
            models.Index(fields=["tenant", "is_published", "starts_at"]),
            models.Index(fields=["tenant", "slug"]),
        ]

    def save(self, *args, **kwargs):
        ensure_unique_tenant_slug(self)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class PublicAchievement(OptimizedImageMixin, TenantOwnedModel):
    title = models.CharField(max_length=240)
    slug = models.SlugField(max_length=260, blank=True)
    summary = models.CharField(max_length=360, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to=public_site_upload_path, null=True, blank=True)
    metric_value = models.CharField(max_length=80, blank=True)
    metric_label = models.CharField(max_length=120, blank=True)
    achieved_on = models.DateField(null=True, blank=True)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)

    image_fields = ("image",)

    class Meta:
        ordering = ["order", "-achieved_on", "title"]
        unique_together = ("tenant", "slug")
        indexes = [
            models.Index(fields=["tenant", "is_published"]),
            models.Index(fields=["tenant", "slug"]),
        ]

    def save(self, *args, **kwargs):
        ensure_unique_tenant_slug(self)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class PublicInquiry(TenantOwnedModel):
    class Source(models.TextChoices):
        CONTACT = "contact", "Contact"
        CHAT = "chat", "Chat"

    class Status(models.TextChoices):
        NEW = "new", "New"
        READ = "read", "Read"
        CLOSED = "closed", "Closed"

    visitor_name = models.CharField(max_length=160)
    visitor_email = models.EmailField(blank=True)
    visitor_phone = models.CharField(max_length=40, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.CONTACT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "source"]),
        ]

    def __str__(self):
        return f"{self.visitor_name} - {self.subject or self.source}"
