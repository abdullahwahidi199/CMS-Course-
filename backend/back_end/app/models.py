from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser
from django.db.models import Max
# Create your models here.

class Tenant(models.Model):
    name = models.CharField(max_length=200)
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

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='student')
class Teachers(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='teachers',
        null=True,
        blank=True
    )
    full_name=models.CharField(max_length=150)
    phone_number=models.CharField(max_length=20)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
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
    

class Classes(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='classes',
        null=True,
        blank=True
    )
    name=models.CharField(max_length=100)
    roomOfClass=models.ForeignKey(RoomOfClass,on_delete=models.CASCADE,related_name='classes',null=True,blank=True)
    teachers=models.ManyToManyField(Teachers,related_name='classes',blank=True)
    subjects=models.CharField(max_length=200)
    start_time=models.TimeField(null=True, blank=True)
    end_time=models.TimeField(null=True, blank=True)
    startDate=models.DateField()
    endDate=models.DateField()
    
    
        
    
    def total_earnings(self):
        return self.student.aggregate(total=models.Sum('amount_paid'))['total'] or 0
    
    
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
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    role_number=models.CharField(max_length=20)
    parent_mobile_number=models.CharField(max_length=20)
    address=models.CharField(max_length=200)
    studentClass=models.ForeignKey(Classes, on_delete=models.CASCADE, related_name='student', null=True, blank=True)
    student_number = models.PositiveIntegerField(
            null=True,
            blank=True
        )
    total_fee=models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid=models.DecimalField(max_digits=10, decimal_places=2, default=0)
    def save(self, *args, **kwargs):
        if not self.pk and self.studentClass and not self.student_number:
            last_number = Students.objects.filter(
                studentClass=self.studentClass
            ).aggregate(
                max_number=Max('student_number')
            )['max_number']

            self.student_number = (last_number or 0) + 1

        super().save(*args, **kwargs)

    
    def __str__(self):
        return self.name

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
    




class Attendance(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='attendances',
        null=True,
        blank=True
    )
    student=models.ForeignKey(Students,on_delete=models.CASCADE,related_name='attendances')
    class_fk=models.ForeignKey(Classes,on_delete=models.CASCADE,related_name='attendances')    
    date=models.DateField()
    is_present=models.BooleanField(default=False)

    class Meta:
        unique_together=('student','date')


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

class Expenses(models.Model):
    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='expenses',
        null=True,
        blank=True
    )
    name=models.CharField(max_length=200)
    amount=models.DecimalField(max_digits=10, decimal_places=2)
    date=models.DateField(auto_now_add=True)
    description=models.TextField(blank=True)

    def __str__(self):
        return self.name

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
        return f'{self.name} - {self.action} on {self.date_time.strftime('%Y-%m-%d %H:%M')}'
    


class Assignment(models.Model):
        tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='assignments',
        null=True,
        blank=True
    )
        class_assigned=models.ForeignKey(Classes,on_delete=models.CASCADE, related_name="assignments")
        title=models.CharField(max_length=255)
        discription=models.TextField()
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
    assignment=models.ForeignKey(Assignment,on_delete=models.CASCADE,related_name='submissions')
    student=models.ForeignKey(Students,models.CASCADE,related_name='submissions')
    status=models.CharField(max_length=20,choices=STATUS_CHOICES,default='pending')
    marks_obtained=models.FloatField(null=True,blank=True)
    suggestion=models.TextField(null=True,blank=True)
    submitted_at=models.DateTimeField(null=True,blank=True)
    graded_at=models.DateTimeField(null=True,blank=True)

    class Meta:
        unique_together = ("student", "assignment")  
    def __str__(self):
        return f"{self.student.name} - {self.assignment.title}"