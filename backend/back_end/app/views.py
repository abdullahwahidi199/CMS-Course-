from asyncio import Event
from django.shortcuts import render,get_object_or_404
from django.http import HttpResponse
from rest_framework.decorators import api_view,parser_classes
from rest_framework.response import Response
from .models import Students,Teachers,Events,Classes,Attendance,Staff,Expenses,RoomOfClass,Course,Enrollment,Role
from .models import Assessment, AssessmentResult, Invoice, Notification, Payment, StudentLedgerEntry
from .serializers import StudentsSerializer,TeachersSerializer,EventSerializer,ClassesSerializer,AttendanceSerializer,StaffSerializer,ExpensesSerializer,RoomSerializer,CourseSerializer,EnrollmentSerializer
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from datetime import date
from decimal import Decimal
from django.core.exceptions import ValidationError
from rest_framework import status
from django.db.models import Avg, Max, Min, Sum, Count
import traceback
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import ExpenseHistory
from .serializers import ExpenseHistorySerializer,UserSerializer
from rest_framework.decorators import api_view, permission_classes,action
from rest_framework.permissions import IsAuthenticated, IsAdminUser,AllowAny
from .models import Marks,Assignment,Submission
from .serializers import MarksSerializer,AssignmentSerializer,SubmissionSerializer,TenantSerializer
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.utils.timezone import now
from .models import Tenant,User

def get_tenant(request):
    return request.user.tenant

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_tenant(request):
    serializer=TenantSerializer(get_tenant(request))
    return Response(serializer.data)
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_tenant(request):
    if not request.user.role_id or request.user.role.slug != "admin":
        return Response(
            serializer.errors,
            status=status.HTTP_403_FORBIDDEN
        )
    tenant = get_tenant(request)

    serializer = TenantSerializer(
        tenant,
        data=request.data,
        partial=True
    )
    

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_tenant(request):

    if not request.user.is_super_admin:
        return Response(
            {"error": "Permission denied"},
            status=403
        )

    tenant = Tenant.objects.create(
        name=request.data["name"],
        email=request.data.get("email", ""),
        phone=request.data.get("phone", ""),
        address=request.data.get("address", ""),
        subscription_expiry=request.data.get("expiry_date", None)
    )

    admin_role, _ = Role.objects.get_or_create(tenant=tenant, slug="admin", defaults={"name": "Admin", "is_system": True})
    admin = User.objects.create_user(
        username=request.data["username"],
        password=request.data["password"],
        tenant=tenant,
        role=admin_role
    )

    return Response({
        "tenant_id": tenant.id,
        "admin_id": admin.id
    })



class DashboardView(APIView):
    permission_classes=[IsAuthenticated]
    
    
    def get(self,request):
        tenant=get_tenant(request)
        today=date.today()
        week_start = today - timedelta(days=7)
        month_start = today - timedelta(days=30)
        year_start = today.replace(month=1, day=1)

        total_students=Students.objects.filter(tenant=tenant).count()
        total_teachers=Teachers.objects.filter(tenant=tenant).count()
        total_classes=Classes.objects.filter(tenant=tenant).count()
        total_staff=Staff.objects.filter(tenant=tenant).count()
        total_rooms=RoomOfClass.objects.filter(tenant=tenant).count()
        total_earnings=Students.objects.filter(tenant=tenant).aggregate(
            total=Sum('amount_paid')
        )['total'] or 0
        total_fees=Students.objects.filter(tenant=tenant).aggregate(
            total=Sum('total_fee')
        )['total'] or 0
        total_expenses = Expenses.objects.filter(
            tenant=tenant
        ).aggregate(total=Sum("amount"))["total"] or 0

        pending_fees=total_fees-total_earnings
        net_balance=total_earnings-total_expenses

        total_attendance = Attendance.objects.filter(
    tenant=tenant,
    date=today
).count()
        present_today=Attendance.objects.filter(
            tenant=tenant,
            date=today,
            is_present=True
        ).count()
        absent_today=Attendance.objects.filter(
            tenant=tenant,
            date=today,
            is_present=False
        ).count()
        absent_today=Attendance.objects.filter(date=today,is_present=False).count()
        attendance_percentage=(
            (present_today/total_attendance)*100
            if total_attendance>0 else 0
        )

        class_distribution=Classes.objects.filter(tenant=tenant).annotate(
            student_count=Count('student')
        ).values('id','name','student_count')

        
        recent_expenses=Expenses.objects.filter(tenant=tenant).order_by('-date')[:5]

        def attendance_stats(start_date, end_date):
            total = Attendance.objects.filter(
                tenant=tenant,
                date__range=[start_date, end_date]
            ).count()

            present = Attendance.objects.filter(
                date__range=[start_date, end_date],
                is_present=True
            ).count()

            absent = Attendance.objects.filter(
                date__range=[start_date,end_date],
                is_present=False
            ).count()
            percentage = (present / total * 100) if total > 0 else 0

            return {
                "present": present,
                "absent": absent,
                "percentage": round(percentage, 2)
            }

        attendance={
            "today":attendance_stats(today,today),
            "week":attendance_stats(week_start,today),
            "month":attendance_stats(month_start,today)

        }
        return Response({
            "stats":{
                "students":total_students,
                "teacers":total_teachers,
                "classes":total_classes,
                "staff":total_staff,
                "rooms":total_rooms
            },
            "finance": {
                "total_earnings": total_earnings,
                "total_expenses": total_expenses,
                "pending_fees": pending_fees,
                "net_balance": net_balance,
            },

            "attendance": attendance,
            "class_distribution": list(class_distribution),
            "recent_expenses": [
                {
                    "id": e.id,
                    "name": e.name,
                    "amount": e.amount,
                    "date": e.date
                }
                for e in recent_expenses
            ]
        })
    

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

# Create your views here.
@api_view(['GET','POST'])

@permission_classes([IsAuthenticated])
def studentsApi(request):
    if request.method=='GET':
        students = Students.objects.filter(
    tenant=get_tenant(request)
).prefetch_related(
    "marks",
    "submissions",
    "attendances",
    "enrollments",
)
        serializer=StudentsSerializer(students,many=True)
        return Response(serializer.data)

    if request.method=='POST':
        print(request.data)
        serializer=StudentsSerializer(data=request.data)
        if serializer.is_valid():
            student=serializer.save(tenant=get_tenant(request))
            return Response(StudentsSerializer(student).data, status=201)
        print(serializer.errors)
        return Response(serializer.errors,status=400)
@permission_classes([IsAuthenticated])  
class studentDetailsView(RetrieveUpdateDestroyAPIView):
    def get_queryset(self):
        return Students.objects.filter(
            tenant=self.request.user.tenant
        )
    serializer_class=StudentsSerializer
    lookup_field='id'

    def update(self, request, *args, **kwargs):
        student = self.get_object()
        payment = request.data.get('payment', None)

        
        if payment is not None:
            try:
                payment = Decimal(str(payment))
            except ValueError:
                return Response({"error": "Invalid payment amount"}, status=status.HTTP_400_BAD_REQUEST)

            if payment <= 0:
                return Response({"error": "Payment must be positive"}, status=status.HTTP_400_BAD_REQUEST)

         
            if student.amount_paid + payment > student.total_fee:
                return Response({"error": "Payment exceeds remaining fee"}, status=status.HTTP_400_BAD_REQUEST)

            student.amount_paid += payment
            student.save()
            serializer = self.get_serializer(student)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # ✅ If it's a normal update (PUT/PATCH of other fields)
        return super().update(request, *args, **kwargs)
    def destroy(self, request, *args, **kwargs):
        student = self.get_object()
        student.archive()
        student.user.is_active = False
        student.user.is_deactivated = True
        student.user.save(update_fields=["is_active", "is_deactivated"])
        return Response(StudentsSerializer(student).data, status=status.HTTP_200_OK)

@permission_classes([IsAuthenticated])    
class classDetailsView(RetrieveUpdateDestroyAPIView):
    def get_queryset(self):
        return Classes.objects.filter(
            tenant=self.request.user.tenant
        )
    serializer_class=ClassesSerializer
    lookup_field='id'

    def update(self, request, *args, **kwargs):
        print("patch data",request.data)
        return super().update(request, *args, **kwargs)
@permission_classes([IsAuthenticated])
class teacherDetailsView(RetrieveUpdateDestroyAPIView):
    def get_queryset(self):
        return Teachers.objects.filter(
            tenant=self.request.user.tenant
        )
    serializer_class=TeachersSerializer
    lookup_field='id'

    def destroy(self, request, *args, **kwargs):
        teacher = self.get_object()
        teacher.archive()
        teacher.user.is_active = False
        teacher.user.is_deactivated = True
        teacher.user.save(update_fields=["is_active", "is_deactivated"])
        return Response(TeachersSerializer(teacher).data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def student_lifecycle(request, id, action_name):
    student = get_object_or_404(Students, id=id, tenant=request.user.tenant)
    if action_name == "archive":
        student.archive()
        student.user.is_active = False
        student.user.is_deactivated = True
    elif action_name == "restore":
        student.restore()
        student.user.is_active = True
        student.user.is_deactivated = False
    elif action_name == "deactivate":
        student.is_active = False
        student.user.is_active = False
        student.user.is_deactivated = True
        student.save(update_fields=["is_active"])
    else:
        return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
    student.user.save(update_fields=["is_active", "is_deactivated"])
    return Response(StudentsSerializer(student).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def teacher_lifecycle(request, id, action_name):
    teacher = get_object_or_404(Teachers, id=id, tenant=request.user.tenant)
    if action_name == "archive":
        teacher.archive()
        teacher.user.is_active = False
        teacher.user.is_deactivated = True
    elif action_name == "restore":
        teacher.restore()
        teacher.user.is_active = True
        teacher.user.is_deactivated = False
    elif action_name == "deactivate":
        teacher.is_active = False
        teacher.user.is_active = False
        teacher.user.is_deactivated = True
        teacher.save(update_fields=["is_active"])
    else:
        return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
    teacher.user.save(update_fields=["is_active", "is_deactivated"])
    return Response(TeachersSerializer(teacher).data)



@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def teachersApi(request):
    if request.method=='GET':
        teachers = Teachers.objects.filter(
            tenant=request.user.tenant
        ).prefetch_related("classes")
        serializer=TeachersSerializer(teachers,many=True)
        return Response(serializer.data)

    if request.method=='POST':
        serializer=TeachersSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
    tenant=request.user.tenant
)
            return Response(TeachersSerializer(serializer.instance).data, status=201)
        print(serializer.errors)    
        return Response(serializer.errors,status=400)
    



@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def classApi(request):
    if request.method=='GET':
        classes = Classes.objects.filter(
    tenant=request.user.tenant
).select_related(
    "roomOfClass",
    "course"
).prefetch_related(
    "teachers",
    "enrollments",
    "attendances",
    "assignments"
)
        serializer=ClassesSerializer(classes,many=True)
        return Response(serializer.data)
    if request.method=='POST':
        serializer=ClassesSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save(
    tenant=request.user.tenant
)
                return Response({'message':'class added successfully'})
            except ValidationError as e:
                return Response({"error": e.message_dict if hasattr(e, 'message_dict') else str(e)},status=status.HTTP_400_BAD_REQUEST)
        print(serializer.errors)
        return Response(serializer.errors,status=400)


@api_view(['POST'])
def Mark_attendance_view(request,class_id):
    attendance_data=request.data.get('attendance')
    attendance_date=request.data.get('date',str(date.today()))

    try:
        tenant = get_tenant(request)

        class_instance = get_object_or_404(
            Classes,
            id=class_id,
            tenant=tenant
        )
    except Classes.DoesNotExist:
        return Response({'error':'Could not find the class'},status=status.HTTP_404_NOT_FOUND)
    
    for record in attendance_data:
        try:
            student = Students.objects.get(
    id=record["student_id"],
    tenant=tenant
)
        except Students.DoesNotExist:
            continue

        is_present=record.get('is_present',False)
        enrollment = Enrollment.objects.filter(
            tenant=tenant,
            student=student,
            batch=class_instance,
            status=Enrollment.Status.ACTIVE,
        ).first()
        # Use (student, date) as the lookup to respect the model's unique_together
        # and set class_fk and is_present in defaults. This avoids IntegrityError
        # when a record for the same student+date exists but with a different class_fk.
        Attendance.objects.update_or_create(
            student=student,
            date=attendance_date,
            defaults={'class_fk': class_instance, 'enrollment': enrollment, 'is_present': is_present}
        )
    return Response({'message':'Attendance Marked Successfully!'})

class StudentByClassView(APIView):
    def get(self,request,class_id):
        students = Students.objects.filter(
    tenant=request.user.tenant,
    enrollments__batch_id=class_id,
    enrollments__status=Enrollment.Status.ACTIVE
).distinct()
        serializer=StudentsSerializer(students,many=True)
        return Response(serializer.data)
        
@api_view(['GET','POST'])
@parser_classes([MultiPartParser,FormParser])
def eventsApi(request):
    if request.method=='GET':
        events = Events.objects.filter(
    tenant=request.user.tenant
)
        serializer=EventSerializer(events,many=True)
        return Response(serializer.data)
    if request.method=='POST':
        serializer=EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(tenant=request.user.tenant)
            return Response({'message':'Event added successfully'})
        print(serializer.errors)
        return Response(serializer.errors,status=400)

@api_view(['GET','POST'])
@parser_classes([MultiPartParser,FormParser])
def staffApi(request):
    if request.method=='GET':
        staff = Staff.objects.filter(
    tenant=request.user.tenant
)
        serializer=StaffSerializer(staff,many=True)
        return Response(serializer.data) 

    if request.method=='POST':
        serializer=StaffSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(tenant=request.user.tenant)
            return Response({'message':'Staff added Successfully'})
        print('staff addition errors',serializer.errors)
        return Response(serializer.errors, status=400)

@api_view(['GET','PUT','DELETE'])
@parser_classes([MultiPartParser,FormParser])
def eventDetail(request,id):
    event = get_object_or_404(
    Events,
    pk=id,
    tenant=request.user.tenant
)
    if request.method=='GET':
        serialiezer=EventSerializer(event)
        return Response(serialiezer.data)
    elif request.method=='PUT':
        serialiezer=EventSerializer(event,data=request.data,partial=True)
        if serialiezer.is_valid():
            serialiezer.save()
            return Response(serialiezer.data)
        return Response(serialiezer.errors)
    elif request.method=='DELETE':
        event.delete()
        return Response()

@api_view(['GET','PUT','DELETE'])
@parser_classes([MultiPartParser,FormParser])
def staffDetailsView(request,id):
    staff = get_object_or_404(
    Staff,
    pk=id,
    tenant=request.user.tenant
)
    if request.method=='GET':
        serializer=StaffSerializer(staff)
        return Response(serializer.data)
    elif request.method=='PUT':
        serializer=StaffSerializer(staff,data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    elif request.method=='DELETE':
        staff.delete()
        return Response()
        
class SchoolTotalEarnings(APIView):
    def get(self,request):
        total_earnings=Students.objects.filter(
    tenant=request.user.tenant
).aggregate(total=Sum('amount_paid'))['total'] or 0
        return Response({'total_earnings':total_earnings})
    
@api_view(['GET','POST'])
def expensesApi(request):
    if request.method=='GET':
        expenses = Expenses.objects.filter(
    tenant=request.user.tenant
)
        serializer=ExpensesSerializer(expenses,many=True)
        return Response(serializer.data)
    if request.method=='POST':
        serializer=ExpensesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
    tenant=request.user.tenant
)
            return Response({'message':'New Expense saved!'})
        
        print(serializer.errors)
        return Response(serializer.errors,status=400)
    
@api_view(['GET','POST'])
def roomApi(request):
    if request.method=='GET':
        rooms = RoomOfClass.objects.filter(
    tenant=request.user.tenant
).prefetch_related("classes")
        serializer=RoomSerializer(rooms,many=True)
        return Response(serializer.data)
    if request.method=='POST':
        serializer=RoomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
    tenant=request.user.tenant
)
            return Response({'message':'New room saved!'})
        
        print(serializer.errors)
        return Response(serializer.errors,status=400)
class roomDetailsView(RetrieveUpdateDestroyAPIView):
    def get_queryset(self):
        return RoomOfClass.objects.filter(
            tenant=self.request.user.tenant
        )
    serializer_class=RoomSerializer
    lookup_field='id'

class expenseDetailsView(RetrieveUpdateDestroyAPIView):
    def get_queryset(self):
        return Expenses.objects.filter(
            tenant=self.request.user.tenant
        )
    serializer_class=ExpensesSerializer
    lookup_field='id'

class FinancialSummaryView(APIView):
    def get(self, request):
        tenant = request.user.tenant

        total_earnings = Students.objects.filter(
            tenant=tenant
        ).aggregate(
            total=Sum("amount_paid")
        )["total"] or 0

        total_expenses = Expenses.objects.filter(
            tenant=tenant
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0
        net_balance=total_earnings-total_expenses

        return Response({
            'total_earnings':total_earnings,
            'total_expenses':total_expenses,
            'net_balance':net_balance
        })

class ExpenseHistoryApiView(generics.ListAPIView):
    def get_queryset(self):
        return ExpenseHistory.objects.filter(
            tenant=self.request.user.tenant
        ).order_by("-date_time")
    serializer_class=ExpenseHistorySerializer

class TimetableListView(generics.ListCreateAPIView):
    def get_queryset(self):
        return Classes.objects.filter(
            tenant=self.request.user.tenant
        ).order_by("start_time")
    serializer_class = ClassesSerializer

@api_view(['GET'])
def student_profile(request):
    try:
        student=request.user.student_profile
        serializer=StudentsSerializer(student)
        return Response(serializer.data)
    except Students.DoesNotExist:
        return Response({"error": "Student profile not found"}, status=404)


def student_dashboard_payload(user):
    student = Students.objects.select_related("user", "tenant").prefetch_related(
        "enrollments__course",
        "enrollments__batch__teachers",
        "attendances__class_fk",
        "assessment_results__assessment",
        "assessment_results__course",
        "assessment_results__batch",
        "assessment_results__teacher",
        "invoices__payments",
    ).get(user=user)

    enrollments = list(student.enrollments.select_related("course", "batch").prefetch_related("batch__teachers"))
    active_enrollments = [item for item in enrollments if item.status == Enrollment.Status.ACTIVE and not item.is_archived]
    past_enrollments = [item for item in enrollments if item not in active_enrollments]

    published_results = list(
        AssessmentResult.objects.filter(student=student, assessment__status=Assessment.Status.PUBLISHED)
        .select_related("assessment", "course", "batch", "teacher", "enrollment")
        .order_by("-assessment__assessment_date", "-submitted_at")
    )
    attendance_records = list(
        Attendance.objects.filter(student=student).select_related("enrollment", "class_fk", "class_fk__course").order_by("-date")
    )
    invoices = list(
        Invoice.objects.filter(student=student)
        .select_related("enrollment", "course", "batch")
        .prefetch_related("payments")
        .order_by("-billing_year", "-billing_month", "-created_at")
    )
    payments = list(
        Payment.objects.filter(student=student)
        .select_related("invoice", "enrollment", "enrollment__course", "enrollment__batch")
        .order_by("-payment_date", "-created_at")
    )
    ledger_entries = list(
        StudentLedgerEntry.objects.filter(student=student)
        .select_related("invoice", "payment", "created_by")
        .order_by("-transaction_date", "-created_at")[:120]
    )

    result_stats = AssessmentResult.objects.filter(student=student, assessment__status=Assessment.Status.PUBLISHED).aggregate(
        average=Avg("percentage"),
        highest=Max("percentage"),
        lowest=Min("percentage"),
    )
    total_attendance = len(attendance_records)
    present_attendance = len([row for row in attendance_records if row.is_present])
    completed_enrollments = len([item for item in enrollments if item.status == Enrollment.Status.COMPLETED])

    course_scores = {}
    for result in published_results:
        label = result.course.name if result.course_id else "Unassigned"
        course_scores.setdefault(label, []).append(float(result.percentage or 0))
    course_averages = [
        {"course": course, "average": round(sum(scores) / len(scores), 2)}
        for course, scores in course_scores.items()
        if scores
    ]
    strongest = max(course_averages, key=lambda item: item["average"], default=None)
    weakest = min(course_averages, key=lambda item: item["average"], default=None)

    monthly_attendance = {}
    attendance_by_course = {}
    for record in attendance_records:
        month = record.date.strftime("%Y-%m")
        monthly_attendance.setdefault(month, {"month": month, "present": 0, "absent": 0})
        monthly_attendance[month]["present" if record.is_present else "absent"] += 1
        course_name = record.class_fk.course.name if record.class_fk_id and record.class_fk.course_id else record.class_fk.name
        attendance_by_course.setdefault(course_name, {"course": course_name, "present": 0, "absent": 0})
        attendance_by_course[course_name]["present" if record.is_present else "absent"] += 1

    fee_summary = {
        "total_invoiced": sum(float(invoice.final_amount or 0) for invoice in invoices),
        "total_paid": sum(float(invoice.paid_amount or 0) for invoice in invoices),
        "outstanding": sum(float(invoice.balance or 0) for invoice in invoices),
        "paid_invoices": len([invoice for invoice in invoices if invoice.status == Invoice.Status.PAID]),
        "due_invoices": len([invoice for invoice in invoices if invoice.status in [Invoice.Status.PENDING, Invoice.Status.PARTIAL, Invoice.Status.OVERDUE]]),
    }

    def enrollment_row(enrollment):
        teachers = [teacher.full_name for teacher in enrollment.batch.teachers.all()] if enrollment.batch_id else []
        total_days = max((enrollment.batch.endDate - enrollment.batch.startDate).days, 1) if enrollment.batch_id else 1
        elapsed_days = max((timezone.localdate() - enrollment.batch.startDate).days, 0) if enrollment.batch_id else 0
        return {
            "id": enrollment.id,
            "course": enrollment.course_id,
            "course_name": enrollment.course.name,
            "batch": enrollment.batch_id,
            "batch_name": enrollment.batch.name,
            "teachers": teachers,
            "start_date": enrollment.batch.startDate if enrollment.batch_id else enrollment.enrollment_date,
            "end_date": enrollment.batch.endDate if enrollment.batch_id else enrollment.completed_date,
            "enrollment_date": enrollment.enrollment_date,
            "status": enrollment.status,
            "completed_date": enrollment.completed_date,
            "certificate_issued": enrollment.certificate_issued,
            "remarks": enrollment.remarks,
            "progress": min(100, round((elapsed_days / total_days) * 100, 2)),
        }

    return {
        "profile": {
            "id": student.id,
            "name": student.name,
            "username": user.username,
            "email": user.email,
            "phone": user.phone or student.parent_mobile_number,
            "father_name": student.f_name,
            "roll_number": student.role_number,
            "address": student.address,
            "status": "active" if student.is_active and user.is_active else "inactive",
        },
        "current_enrollments": [enrollment_row(item) for item in active_enrollments],
        "past_enrollments": [enrollment_row(item) for item in past_enrollments],
        "assessment_results": [
            {
                "id": result.id,
                "assessment": result.assessment.title,
                "course": result.course.name if result.course_id else "",
                "course_id": result.course_id,
                "batch": result.batch.name if result.batch_id else "",
                "batch_id": result.batch_id,
                "teacher": result.teacher.full_name if result.teacher_id else "",
                "date": result.assessment.assessment_date,
                "marks_obtained": float(result.marks_obtained),
                "maximum_marks": float(result.assessment.maximum_marks),
                "percentage": float(result.percentage),
                "grade": result.grade,
                "remarks": result.remarks,
                "is_passed": result.is_passed,
                "status": result.assessment.status,
            }
            for result in published_results
        ],
        "attendance": {
            "summary": {
                "total": total_attendance,
                "present": present_attendance,
                "absent": total_attendance - present_attendance,
                "percentage": round((present_attendance / total_attendance) * 100, 2) if total_attendance else 0,
            },
            "by_month": list(monthly_attendance.values()),
            "by_course": [
                {
                    **row,
                    "percentage": round((row["present"] / (row["present"] + row["absent"])) * 100, 2) if row["present"] + row["absent"] else 0,
                }
                for row in attendance_by_course.values()
            ],
            "history": [
                {
                    "id": record.id,
                    "date": record.date,
                    "course": record.class_fk.course.name if record.class_fk_id and record.class_fk.course_id else record.class_fk.name,
                    "batch": record.class_fk.name if record.class_fk_id else "",
                    "is_present": record.is_present,
                }
                for record in attendance_records[:120]
            ],
        },
        "fees": {
            "summary": fee_summary,
            "current_month_invoice": next(
                (
                    invoice.id
                    for invoice in invoices
                    if (invoice.billing_month or invoice.month) == timezone.localdate().month and (invoice.billing_year or invoice.year) == timezone.localdate().year
                ),
                None,
            ),
            "upcoming_due_date": min([invoice.due_date for invoice in invoices if invoice.balance > 0], default=None),
            "invoices": [
                {
                    "id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "enrollment": invoice.enrollment_id,
                    "course": invoice.course.name if invoice.course_id else "",
                    "batch": invoice.batch.name if invoice.batch_id else "",
                    "month": invoice.billing_month or invoice.month,
                    "year": invoice.billing_year or invoice.year,
                    "due_date": invoice.due_date,
                    "monthly_fee": float(invoice.monthly_fee or invoice.amount),
                    "discount": float(invoice.discount or 0),
                    "previous_balance": float(invoice.previous_balance or 0),
                    "late_fee": float(invoice.late_fee or 0),
                    "total_amount": float(invoice.total_amount or invoice.final_amount),
                    "final_amount": float(invoice.final_amount),
                    "paid_amount": float(invoice.paid_amount),
                    "balance": float(invoice.balance),
                    "status": invoice.status,
                }
                for invoice in invoices
            ],
            "payments": [
                {
                    "id": payment.id,
                    "receipt_number": payment.receipt_number,
                    "invoice": payment.invoice.invoice_number,
                    "course": payment.enrollment.course.name if payment.enrollment_id else "",
                    "batch": payment.enrollment.batch.name if payment.enrollment_id else "",
                    "payment_date": payment.payment_date,
                    "payment_method": payment.payment_method,
                    "amount_paid": float(payment.amount_paid),
                    "reference_number": payment.reference_number,
                }
                for payment in payments
            ],
            "ledger": [
                {
                    "id": entry.id,
                    "date": entry.transaction_date,
                    "type": entry.transaction_type,
                    "description": entry.description,
                    "debit": float(entry.debit),
                    "credit": float(entry.credit),
                    "balance": float(entry.balance),
                    "reference_number": entry.reference_number,
                    "invoice": entry.invoice.invoice_number if entry.invoice_id else "",
                    "payment": entry.payment.receipt_number if entry.payment_id else "",
                    "created_by": entry.created_by.username if entry.created_by_id else "",
                }
                for entry in ledger_entries
            ],
        },
        "certificates": [
            {
                "id": enrollment.id,
                "course": enrollment.course.name,
                "batch": enrollment.batch.name,
                "completed_date": enrollment.completed_date,
            }
            for enrollment in enrollments
            if enrollment.certificate_issued
        ],
        "notifications": list(
            Notification.objects.filter(recipient=user).values("id", "title", "message", "notification_type", "is_read", "created_at")[:20]
        ),
        "announcements": list(
            Events.objects.filter(tenant=student.tenant).order_by("-date").values("id", "title", "discription", "date", "image")[:10]
        ),
        "analytics": {
            "average_score": round(float(result_stats["average"] or 0), 2),
            "highest_score": round(float(result_stats["highest"] or 0), 2),
            "lowest_score": round(float(result_stats["lowest"] or 0), 2),
            "gpa": round((float(result_stats["average"] or 0) / 100) * 4, 2),
            "attendance_rate": round((present_attendance / total_attendance) * 100, 2) if total_attendance else 0,
            "course_completion_rate": round((completed_enrollments / len(enrollments)) * 100, 2) if enrollments else 0,
            "strongest_course": strongest,
            "weakest_course": weakest,
            "performance_trend": [
                {"date": result.assessment.assessment_date, "assessment": result.assessment.title, "percentage": float(result.percentage)}
                for result in reversed(published_results)
            ],
            "course_averages": course_averages,
        },
    }


def simple_pdf_response(filename, lines):
    text = "\\n".join(str(line)[:150].replace("(", "[").replace(")", "]") for line in lines)
    stream = f"BT /F1 10 Tf 40 780 Td ({text}) Tj ET".encode("latin-1", errors="ignore")
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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_dashboard(request):
    if not hasattr(request.user, "student_profile"):
        return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)
    return Response(student_dashboard_payload(request.user))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_assessments(request):
    return Response({"assessment_results": student_dashboard_payload(request.user)["assessment_results"]})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_enrollments(request):
    payload = student_dashboard_payload(request.user)
    return Response({"current_enrollments": payload["current_enrollments"], "past_enrollments": payload["past_enrollments"]})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_attendance(request):
    return Response(student_dashboard_payload(request.user)["attendance"])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_fees(request):
    return Response(student_dashboard_payload(request.user)["fees"])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_invoice_download(request, invoice_id):
    student = getattr(request.user, "student_profile", None)
    invoice = get_object_or_404(Invoice.objects.select_related("student", "course", "batch"), id=invoice_id, student=student)
    return simple_pdf_response(
        invoice.invoice_number,
        [
            f"Invoice {invoice.invoice_number}",
            f"Student: {invoice.student.name}",
            f"Course: {invoice.course.name if invoice.course_id else ''}",
            f"Batch: {invoice.batch.name if invoice.batch_id else ''}",
            f"Period: {invoice.billing_month or invoice.month}/{invoice.billing_year or invoice.year}",
            f"Due date: {invoice.due_date}",
            f"Total: {invoice.final_amount}",
            f"Paid: {invoice.paid_amount}",
            f"Balance: {invoice.balance}",
            f"Status: {invoice.status}",
        ],
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_payment_receipt(request, payment_id):
    student = getattr(request.user, "student_profile", None)
    payment = get_object_or_404(Payment.objects.select_related("invoice", "student", "enrollment__course", "enrollment__batch"), id=payment_id, student=student)
    return simple_pdf_response(
        payment.receipt_number,
        [
            f"Receipt {payment.receipt_number}",
            f"Invoice: {payment.invoice.invoice_number}",
            f"Student: {payment.student.name if payment.student_id else ''}",
            f"Course: {payment.enrollment.course.name if payment.enrollment_id else ''}",
            f"Batch: {payment.enrollment.batch.name if payment.enrollment_id else ''}",
            f"Date: {payment.payment_date}",
            f"Method: {payment.payment_method}",
            f"Amount: {payment.amount_paid}",
            f"Reference: {payment.reference_number}",
        ],
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_ledger_download(request):
    student = getattr(request.user, "student_profile", None)
    rows = StudentLedgerEntry.objects.filter(student=student).order_by("transaction_date", "created_at")[:200]
    lines = [
        f"Student: {student.name if student else ''}",
        "Date | Type | Reference | Debit | Credit | Balance | Description",
    ]
    lines.extend(
        f"{row.transaction_date} | {row.transaction_type} | {row.reference_number} | {row.debit} | {row.credit} | {row.balance} | {row.description}"
        for row in rows
    )
    return simple_pdf_response("student-ledger", lines)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def student_certificate_download(request, enrollment_id):
    student = getattr(request.user, "student_profile", None)
    enrollment = get_object_or_404(Enrollment.objects.select_related("student", "course", "batch"), id=enrollment_id, student=student, certificate_issued=True)
    return simple_pdf_response(
        f"{enrollment.course.name}-certificate",
        [
            "Course Completion Certificate",
            f"Student: {enrollment.student.name}",
            f"Course: {enrollment.course.name}",
            f"Batch: {enrollment.batch.name}",
            f"Completed date: {enrollment.completed_date}",
            "Certificate status: Issued",
        ],
    )
    
@api_view(["GET"])
def teacher_profile(request):
    try:
        teacher=request.user.teacher_profile
        serializer=TeachersSerializer(teacher)
        return Response(serializer.data)
    except Teachers.DoesNotExist:
        return Response({"error": "Teacher profile not found"}, status=404)
    


class MarksViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Marks.objects.filter(
            tenant=self.request.user.tenant
        ).select_related("student")
    serializer_class = MarksSerializer

    def create(self, request, *args, **kwargs):
        if isinstance(request.data, list):
            serializer = self.get_serializer(data=request.data, many=True)
            serializer.is_valid(raise_exception=True)
            self.perform_bulk_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return super().create(request, *args, **kwargs)

    def perform_bulk_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=["patch"])
    def bulk_update(self,request,*args,**kwargs):
        if not isinstance(request.data,list):
            return Response({'detail':'Expected a list of objects'},
                             status=status.HTTP_400_BAD_REQUEST)
        
        updated=[]
        errors=[]

        for item in request.data:
            try:
                mark = Marks.objects.get(
    id=item["id"],
    tenant=request.user.tenant
)
                serializer=self.get_serializer(mark,data=item,partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save()
                updated.append(serializer.data)
            except Exception as e:
                errors.append({"id": item.get("id"), "error": str(e)})
        return Response({"updated": updated, "errors": errors}, status=status.HTTP_200_OK)


class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CourseSerializer

    def get_queryset(self):
        return Course.objects.filter(tenant=self.request.user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        course = self.get_object()
        course.archive()
        return Response(self.get_serializer(course).data)

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        course = self.get_object()
        course.restore()
        return Response(self.get_serializer(course).data)


class EnrollmentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EnrollmentSerializer

    def get_queryset(self):
        return Enrollment.objects.filter(tenant=self.request.user.tenant).select_related("student", "course", "batch")

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)

    def set_status(self, status_value):
        enrollment = self.get_object()
        enrollment.status = status_value
        if status_value == Enrollment.Status.COMPLETED:
            enrollment.completed_date = timezone.localdate()
        if status_value == Enrollment.Status.ARCHIVED:
            enrollment.is_archived = True
        enrollment.save()
        return Response(self.get_serializer(enrollment).data)

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        return self.set_status(Enrollment.Status.COMPLETED)

    @action(detail=True, methods=["post"])
    def drop(self, request, pk=None):
        return self.set_status(Enrollment.Status.DROPPED)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        return self.set_status(Enrollment.Status.CANCELLED)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        return self.set_status(Enrollment.Status.ARCHIVED)

    @action(detail=True, methods=["post"])
    def transfer(self, request, pk=None):
        enrollment = self.get_object()
        batch = get_object_or_404(Classes, id=request.data.get("batch"), tenant=request.user.tenant)
        enrollment.status = Enrollment.Status.TRANSFERRED
        enrollment.save(update_fields=["status", "updated_at"])
        new_enrollment = Enrollment.objects.create(
            tenant=request.user.tenant,
            created_by=request.user,
            student=enrollment.student,
            batch=batch,
            course=batch.course,
            enrollment_date=timezone.localdate(),
            remarks=request.data.get("remarks", f"Transferred from {enrollment.batch.name}"),
        )
        return Response(self.get_serializer(new_enrollment).data, status=status.HTTP_201_CREATED)
    
class AssignmetViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        queryset = Assignment.objects.filter(
            tenant=self.request.user.tenant
        ).select_related(
            "class_assigned"
        ).prefetch_related(
            "submissions"
        )

        class_id = self.request.query_params.get("class_id")

        if class_id:
            queryset = queryset.filter(class_assigned_id=class_id)

        return queryset

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            assignment = serializer.save(
            tenant=request.user.tenant,
            created_by=request.user
        )

            enrollments = assignment.class_assigned.enrollments.filter(status=Enrollment.Status.ACTIVE).select_related("student")
            submissions = [
    Submission(
        assignment=assignment,
        enrollment=enrollment,
        student=enrollment.student,
        status="pending",
        tenant=request.user.tenant
    )
    for enrollment in enrollments
]
            Submission.objects.bulk_create(submissions)

            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            print("ERROR in create assignment:", e)
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    def get_queryset(self):
        return Submission.objects.filter(
            tenant=self.request.user.tenant
        ).select_related(
            "assignment",
            "student"
        )

    @action(detail=False, methods=["patch"])
    def bulk_update(self, request):
        data = request.data
        updated_submissions = []

        for item in data:
            submission_id = item.get("id")
            student_id = item.get("student")
            assignment_id = item.get("assignment")

            # If submission exists, update
            if submission_id:
                try:
                    submission = Submission.objects.get(
    id=submission_id,
    tenant=request.user.tenant
)
                    submission.marks_obtained = item.get("marks_obtained")
                    submission.suggestion = item.get("suggestion", "")
                    submission.status = item.get("status", "pending")
                    submission.tenant = request.user.tenant
                    submission.save()
                    updated_submissions.append(submission)
                except Submission.DoesNotExist:
                    continue

            # If new submission (id is None but student is provided)
            elif student_id and assignment_id:
                submission, created = Submission.objects.get_or_create(
    tenant=request.user.tenant,
    student_id=student_id,
    assignment_id=assignment_id,
    defaults={
        "marks_obtained": item.get("marks_obtained"),
        "suggestion": item.get("suggestion", ""),
        "status": item.get("status", "pending"),
    },
)
                if not created:
                    # If it already exists, update values
                    submission.marks_obtained = item.get("marks_obtained")
                    submission.suggestion = item.get("suggestion", "")
                    submission.status = item.get("status", "pending")
                    submission.save()
                updated_submissions.append(submission)

        serializer = self.get_serializer(updated_submissions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
