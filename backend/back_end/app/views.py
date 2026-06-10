from asyncio import Event
from django.shortcuts import render,get_object_or_404
from rest_framework.decorators import api_view,parser_classes
from rest_framework.response import Response
from .models import Students,Teachers,Events,Classes,Attendance,Staff,Expenses,RoomOfClass
from .serializers import StudentsSerializer,TeachersSerializer,EventSerializer,ClassesSerializer,AttendanceSerializer,StaffSerializer,ExpensesSerializer,RoomSerializer
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from datetime import date
from decimal import Decimal
from django.core.exceptions import ValidationError
from rest_framework import status
from django.db.models import Sum,Count
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
    if request.user.role !="admin":
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

    if not request.user.role == "super_admin":
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

    admin = User.objects.create_user(
        username=request.data["username"],
        password=request.data["password"],
        tenant=tenant,
        role="admin"
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

@permission_classes([AllowAny])
def studentsApi(request):
    if request.method=='GET':
        students = Students.objects.filter(
    tenant=get_tenant(request)
).select_related(
    "studentClass"
).prefetch_related(
    "marks",
    "submissions",
    "attendances"
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
@permission_classes([AllowAny])
class teacherDetailsView(RetrieveUpdateDestroyAPIView):
    def get_queryset(self):
        return Teachers.objects.filter(
            tenant=self.request.user.tenant
        )
    serializer_class=TeachersSerializer
    lookup_field='id'



@api_view(['GET','POST'])
# @permission_classes([IsAuthenticated])
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
            return Response({'message':'teacher added successfully'})
        print(serializer.errors)    
        return Response(serializer.errors,status=400)
    



@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def classApi(request):
    if request.method=='GET':
        classes = Classes.objects.filter(
    tenant=request.user.tenant
).select_related(
    "roomOfClass"
).prefetch_related(
    "teachers",
    "student",
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
        # Use (student, date) as the lookup to respect the model's unique_together
        # and set class_fk and is_present in defaults. This avoids IntegrityError
        # when a record for the same student+date exists but with a different class_fk.
        Attendance.objects.update_or_create(
            student=student,
            date=attendance_date,
            defaults={'class_fk': class_instance, 'is_present': is_present}
        )
    return Response({'message':'Attendance Marked Successfully!'})

class StudentByClassView(APIView):
    def get(self,request,class_id):
        students = Students.objects.filter(
    tenant=request.user.tenant,
    studentClass_id=class_id
)
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

            # get all students of the class
            students = assignment.class_assigned.student.all()  # <-- FIXED
            submissions = [
    Submission(
        assignment=assignment,
        student=s,
        status="pending",
        tenant=request.user.tenant
    )
    for s in students
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