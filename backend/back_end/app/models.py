from django.db import models
from django.db.models import Sum
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser
# Create your models here.

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
class Teachers(models.Model):
    full_name=models.CharField(max_length=150)
    phone_number=models.CharField(max_length=20)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="teacher_profile")
    email_address=models.CharField(max_length=100)
    subject=models.CharField(max_length=50)
    department=models.CharField(max_length=30)

    def __str__(self):
        return self.full_name
    

class RoomOfClass(models.Model):
    name=models.CharField(max_length=100,default='Room A')
    

class Classes(models.Model):
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
    name=models.CharField(max_length=100)
    f_name=models.CharField(max_length=100)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    role_number=models.CharField(max_length=20)
    parent_mobile_number=models.CharField(max_length=20)
    address=models.CharField(max_length=200)
    studentClass=models.ForeignKey(Classes, on_delete=models.CASCADE, related_name='student', null=True, blank=True)

    total_fee=models.DecimalField(max_digits=10, decimal_places=2, default=0)
    amount_paid=models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return self.name


class Events(models.Model):
    title=models.CharField(max_length=200, null=True,blank=True)
    discription=models.CharField(max_length=300, null=True,blank=True)
    image=models.ImageField(upload_to='event_images/', null=True,blank=True)
    date=models.DateField(null=True,blank=True)

    def __str__(self):
        return self.title
    




class Attendance(models.Model):
    student=models.ForeignKey(Students,on_delete=models.CASCADE,related_name='attendances')
    class_fk=models.ForeignKey(Classes,on_delete=models.CASCADE,related_name='attendances')    
    date=models.DateField()
    is_present=models.BooleanField(default=False)

    class Meta:
        unique_together=('student','date')


class Staff(models.Model):
    name=models.CharField(max_length=100)
    phone_number=models.CharField(max_length=20)
    email=models.EmailField(max_length=50,blank=True, null=True)
    role=models.CharField(max_length=60)
    photo=models.ImageField(upload_to='staff_images/',blank=True,null=True)

    def __str__(self):
        return self.name

class Expenses(models.Model):
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
    name=models.CharField(max_length=200)
    amount=models.DecimalField(max_digits=10, decimal_places=2)
    date_time=models.DateTimeField(default=timezone.now)
    changed_fields=models.JSONField(blank=True,null=True)
    action=models.CharField(max_length=10,choices=ACTION_CHOICES,default='Created')
    description=models.TextField(blank=True)

    def __str__(self):
        return f'{self.name} - {self.action} on {self.date_time.strftime('%Y-%m-%d %H:%M')}'
    



# class TimeTable(models.Model):
#     class_assigned=models.ForeignKey(Classes,on_delete=models.CASCADE)
#     teacher=models.ForeignKey(Teachers,on_delete=models.CASCADE)
#     room=models.ForeignKey(Room,on_delete=models.CASCADE)
#     start_time=models.TimeField()
#     end_time=models.TimeField()

#     class Meta:
#         unique_together=('room','start_time','end_time')

#     def clean(self):
#         teacher_conflict=TimeTable.objects.filter(
#             teacher=self.teacher
#         ).exclude(id=self.id).filter(
#             start_time=self.end_time,
#             end_time=self.start_time
#         )

#         if teacher_conflict.exists():
#             raise ValidationError('teacher is already assigned to another class at this time!')
        
#         room_conflict = TimeTable.objects.filter(
#             room=self.room,
            
#         ).exclude(id=self.id).filter(
#             start_time__lt=self.end_time,
#             end_time__gt=self.start_time
#         )
#         if room_conflict.exists():
#             raise ValidationError("This room is already booked for another class at this time.")
        
#     def __str__(self):
#         return f"{self.subject} - {self.class_assigned}"