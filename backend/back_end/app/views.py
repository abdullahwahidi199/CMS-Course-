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
from django.db.models import Sum
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import ExpenseHistory
from .serializers import ExpenseHistorySerializer,UserSerializer

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

# Create your views here.
@api_view(['GET','POST'])


def studentsApi(request):
    if request.method=='GET':
        students=Students.objects.all()
        serializer=StudentsSerializer(students,many=True)
        return Response(serializer.data)

    if request.method=='POST':
        print(request.data)
        serializer=StudentsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':'student added successfully'})
        print(serializer.errors)
        return Response(serializer.errors,status=400)
    
class studentDetailsView(RetrieveUpdateDestroyAPIView):
    queryset=Students.objects.all()
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
    
class classDetailsView(RetrieveUpdateDestroyAPIView):
    queryset=Classes.objects.all()
    serializer_class=ClassesSerializer
    lookup_field='id'

    def update(self, request, *args, **kwargs):
        print("patch data",request.data)
        return super().update(request, *args, **kwargs)
    
class teacherDetailsView(RetrieveUpdateDestroyAPIView):
    queryset=Teachers.objects.all()
    serializer_class=TeachersSerializer
    lookup_field='id'



@api_view(['GET','POST'])
def teachersApi(request):
    if request.method=='GET':
        teachers=Teachers.objects.all()
        serializer=TeachersSerializer(teachers,many=True)
        return Response(serializer.data)

    if request.method=='POST':
        serializer=TeachersSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':'teacher added successfully'})

        return Response(serializer.errors,status=400)
    



@api_view(['GET','POST'])
def classApi(request):
    if request.method=='GET':
        classes=Classes.objects.all()
        serializer=ClassesSerializer(classes,many=True)
        return Response(serializer.data)
    if request.method=='POST':
        serializer=ClassesSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
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
        class_instance=Classes.objects.get(id=class_id)
    except Classes.DoesNotExist:
        return Response({'error':'Could not find the class'},status=status.HTTP_404_NOT_FOUND)
    
    for record in attendance_data:
        try:
            student=Students.objects.get(id=record['student_id'])
        except Students.DoesNotExist:
            continue

        is_present=record.get('is_present',False)
        Attendance.objects.update_or_create(
            student=student,
            class_fk=class_instance,
            date=attendance_date,
            defaults={'is_present':is_present}
        )
    return Response({'message':'Attendance Marked Successfully!'})

class StudentByClassView(APIView):
    def get(self,request,class_id):
        students=Students.objects.filter(studentClass_id=class_id)
        serializer=StudentsSerializer(students,many=True)
        return Response(serializer.data)
        
@api_view(['GET','POST'])
@parser_classes([MultiPartParser,FormParser])
def eventsApi(request):
    if request.method=='GET':
        events=Events.objects.all()
        serializer=EventSerializer(events,many=True)
        return Response(serializer.data)
    if request.method=='POST':
        serializer=EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':'Event added successfully'})
        print(serializer.errors)
        return Response(serializer.errors,status=400)

@api_view(['GET','POST'])
@parser_classes([MultiPartParser,FormParser])
def staffApi(request):
    if request.method=='GET':
        staff= Staff.objects.all()
        serializer=StaffSerializer(staff,many=True)
        return Response(serializer.data) 

    if request.method=='POST':
        serializer=StaffSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':'Staff added Successfully'})
        print('staff addition errors',serializer.errors)
        return Response(serializer.errors, status=400)

@api_view(['GET','PUT','DELETE'])
@parser_classes([MultiPartParser,FormParser])
def eventDetail(request,id):
    event=get_object_or_404(Events,pk=id)
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
    staff=get_object_or_404(Staff,pk=id)
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
        total_earnings=Students.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
        return Response({'total_earnings':total_earnings})
    
@api_view(['GET','POST'])
def expensesApi(request):
    if request.method=='GET':
        expenses=Expenses.objects.all()
        serializer=ExpensesSerializer(expenses,many=True)
        return Response(serializer.data)
    if request.method=='POST':
        serializer=ExpensesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':'New Expense saved!'})
        
        print(serializer.errors)
        return Response(serializer.errors,status=400)
    
@api_view(['GET','POST'])
def roomApi(request):
    if request.method=='GET':
        rooms=RoomOfClass.objects.all()
        serializer=RoomSerializer(rooms,many=True)
        return Response(serializer.data)
    if request.method=='POST':
        serializer=RoomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':'New room saved!'})
        
        print(serializer.errors)
        return Response(serializer.errors,status=400)

class expenseDetailsView(RetrieveUpdateDestroyAPIView):
    queryset=Expenses.objects.all()
    serializer_class=ExpensesSerializer
    lookup_field='id'

class FinancialSummaryView(APIView):
    def get(self, request):
        total_earnings=Students.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
        total_expenses=Expenses.objects.aggregate(total=Sum('amount'))['total'] or 0
        net_balance=total_earnings-total_expenses

        return Response({
            'total_earnings':total_earnings,
            'total_expenses':total_expenses,
            'net_balance':net_balance
        })

class ExpenseHistoryApiView(generics.ListAPIView):
    queryset=ExpenseHistory.objects.all().order_by('-date_time')
    serializer_class=ExpenseHistorySerializer

class TimetableListView(generics.ListCreateAPIView):
    queryset = Classes.objects.all().order_by('start_time')
    serializer_class = ClassesSerializer