from rest_framework import serializers
from django.db.models import Sum
from .models import Students,Teachers,Events,Classes,Attendance,AttendanceSession,Staff,Expenses,ExpenseCategory,Budget,RecurringExpense,ExpenseHistory,RoomOfClass,User,Marks
from .models import Course, Enrollment, Role
from .models import Assignment,PromotionHistory,Submission,Tenant
from .services.student_service import create_student, update_student
from .services.teacher_service import create_teacher, update_teacher



class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = "__all__"
class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_number = serializers.CharField(source="student.formatted_student_number", read_only=True)
    guardian_name = serializers.CharField(source="student.f_name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    batch_name = serializers.CharField(source="class_fk.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    marked_by_username = serializers.CharField(source="marked_by.username", read_only=True)

    class Meta:
        model=Attendance
        fields='__all__'


class AttendanceSessionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    records = AttendanceSerializer(many=True, read_only=True)
    present_count = serializers.SerializerMethodField()
    absent_count = serializers.SerializerMethodField()
    late_count = serializers.SerializerMethodField()
    leave_count = serializers.SerializerMethodField()
    attendance_percentage = serializers.SerializerMethodField()

    class Meta:
        model=AttendanceSession
        fields='__all__'
        read_only_fields=["tenant","created_by","approved_by","approved_at","created_at","updated_at"]

    def _records(self, obj):
        return obj.records.all()

    def get_present_count(self, obj):
        return self._records(obj).filter(status=Attendance.Status.PRESENT).count()

    def get_absent_count(self, obj):
        return self._records(obj).filter(status=Attendance.Status.ABSENT).count()

    def get_late_count(self, obj):
        return self._records(obj).filter(status=Attendance.Status.LATE).count()

    def get_leave_count(self, obj):
        return self._records(obj).filter(status__in=[Attendance.Status.EXCUSED, Attendance.Status.SICK_LEAVE]).count()

    def get_attendance_percentage(self, obj):
        total = self._records(obj).exclude(status=Attendance.Status.HOLIDAY).count()
        attended = self._records(obj).filter(status__in=[Attendance.Status.PRESENT, Attendance.Status.LATE, Attendance.Status.EXCUSED]).count()
        return round((attended / total) * 100, 2) if total else 0


class MarksSerializer(serializers.ModelSerializer):
    class Meta:
        model=Marks
        fields='__all__'





class SubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Submission
        fields = "__all__"

class AssignmentSerializer(serializers.ModelSerializer):
    submissions = SubmissionSerializer(many=True, read_only=True)

    class Meta:
        model = Assignment
        fields = "__all__"
        read_only_fields = ("created_at", "created_by")

class secondClassMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model=Classes
        fields='__all__'
class RoomMiniSerializer(serializers.ModelSerializer):
    # classes=secondClassMiniSerializer(many=True,read_only=True)
    class Meta:
        model=RoomOfClass
        fields='__all__'
       

class ClassesMiniSerialiser(serializers.ModelSerializer):
    # # student=StudentsSerializer(many=True,read_only=True)
    roomOfClass = serializers.PrimaryKeyRelatedField(
        queryset=RoomOfClass.objects.all(), required=False, allow_null=True
    )
    roomOfClass_details = RoomMiniSerializer(
        source='roomOfClass', read_only=True
    )

    class Meta:
        model=Classes
        fields=['id','name','course','course_name','startDate','endDate','roomOfClass','start_time','end_time','roomOfClass_details','capacity','is_active','is_archived']


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)

    class Meta:
        model = Enrollment
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]


class PromotionHistorySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_number = serializers.CharField(source="student.formatted_student_number", read_only=True)
    old_class_name = serializers.CharField(source="old_class.name", read_only=True)
    new_class_name = serializers.CharField(source="new_class.name", read_only=True)
    old_course_name = serializers.CharField(source="old_class.course.name", read_only=True)
    new_course_name = serializers.CharField(source="new_class.course.name", read_only=True)
    promoted_by_username = serializers.CharField(source="promoted_by.username", read_only=True)

    class Meta:
        model = PromotionHistory
        fields = [
            "id",
            "tenant",
            "student",
            "student_name",
            "student_number",
            "old_enrollment",
            "new_enrollment",
            "old_class",
            "old_class_name",
            "old_course_name",
            "new_class",
            "new_class_name",
            "new_course_name",
            "promotion_date",
            "promoted_by",
            "promoted_by_username",
            "remarks",
            "created_at",
        ]
        read_only_fields = fields


class PromotionCreateSerializer(serializers.Serializer):
    student = serializers.IntegerField()
    new_batch = serializers.IntegerField()
    promotion_date = serializers.DateField(required=False)
    remarks = serializers.CharField(required=False, allow_blank=True)


class StudentsSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    email = serializers.EmailField(source="user.email", required=False, allow_blank=True)
    phone = serializers.CharField(source="user.phone", required=False, allow_blank=True)
    user_is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    attendances=AttendanceSerializer(many=True,read_only=True)
    marks=MarksSerializer(many=True,read_only=True)
    current_enrollments=serializers.SerializerMethodField()
    previous_enrollments=serializers.SerializerMethodField()
    student_number_display = serializers.CharField(source="formatted_student_number", read_only=True)
    billing_total = serializers.SerializerMethodField()
    billing_paid = serializers.SerializerMethodField()
    billing_outstanding = serializers.SerializerMethodField()
    billing_invoice_count = serializers.SerializerMethodField()
    class Meta:
        model=Students
        fields=[
            'id','username','password','first_name','last_name','email','phone','user_is_active',
            'name','f_name','role_number','parent_mobile_number','student_number','student_number_display','address',
            'enrollment_date','is_active','is_archived',
            'current_enrollments','previous_enrollments','attendances','marks',
            'billing_total','billing_paid','billing_outstanding','billing_invoice_count'
        ]
        read_only_fields = ["name", "role_number", "student_number", "student_number_display", "enrollment_date", "is_archived"]

    def get_current_enrollments(self, obj):
        return EnrollmentSerializer(obj.enrollments.filter(status=Enrollment.Status.ACTIVE), many=True).data

    def get_previous_enrollments(self, obj):
        return EnrollmentSerializer(obj.enrollments.exclude(status=Enrollment.Status.ACTIVE), many=True).data

    def get_billing_total(self, obj):
        return getattr(obj, "billing_total", 0) or 0

    def get_billing_paid(self, obj):
        return getattr(obj, "billing_paid", 0) or 0

    def get_billing_outstanding(self, obj):
        return getattr(obj, "billing_outstanding", 0) or 0

    def get_billing_invoice_count(self, obj):
        return getattr(obj, "billing_invoice_count", 0) or 0
    
    def validate(self, attrs):
        user_data = attrs.get("user", {})
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Password is required when creating a student."})
        if self.instance is None:
            for field in ["username", "first_name", "last_name"]:
                if not user_data.get(field):
                    raise serializers.ValidationError({field: f"{field.replace('_', ' ').title()} is required."})
        return attrs

    def create(self, validated_data):
        user_data = validated_data.pop("user", {})
        password = validated_data.pop("password")
        return create_student(
            tenant=validated_data.pop("tenant"),
            username=user_data.get("username"),
            password=password,
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            email=user_data.get("email", ""),
            phone=user_data.get("phone", ""),
            **validated_data,
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        password = validated_data.pop("password", None)
        return update_student(
            instance,
            username=user_data.get("username"),
            password=password,
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            email=user_data.get("email"),
            phone=user_data.get("phone"),
            **validated_data,
        )

class TeachersSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    user_is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    user_is_deactivated = serializers.BooleanField(source="user.is_deactivated", read_only=True)
    classes=ClassesMiniSerialiser(many=True,read_only=True)
    class Meta:
        model=Teachers
        fields=['id','username','password','user_is_active','user_is_deactivated','full_name','email_address','subject','phone_number','department','classes','is_active','is_archived']
        read_only_fields = ["is_archived"]

    def validate(self, attrs):
        user_data = attrs.get("user", {})
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Password is required when creating a teacher."})
        if self.instance is None and not user_data.get("username"):
            raise serializers.ValidationError({"username": "Username is required."})
        if self.instance is None and not attrs.get("email_address"):
            raise serializers.ValidationError({"email_address": "Email is required."})
        return attrs

    def create(self, validated_data):
        user_data = validated_data.pop("user", {})
        password = validated_data.pop("password")
        email = validated_data.pop("email_address", "")
        return create_teacher(
            tenant=validated_data.pop("tenant"),
            username=user_data.get("username"),
            password=password,
            email=email,
            **validated_data,
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        password = validated_data.pop("password", None)
        return update_teacher(
            instance,
            username=user_data.get("username"),
            password=password,
            email=validated_data.get("email_address"),
            full_name=validated_data.get("full_name"),
            phone_number=validated_data.get("phone_number"),
            subject=validated_data.get("subject"),
            department=validated_data.get("department"),
            is_active=validated_data.get("is_active"),
        )

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Events
        fields=['id','title','discription','image','date']

class UserSerializer(serializers.ModelSerializer):
    teacher_profile = TeachersSerializer(read_only=True)
    student_profile = StudentsSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'role_slug', 'teacher_profile', 'student_profile']

class ClassesSerializer(serializers.ModelSerializer):
    enrollments=EnrollmentSerializer(many=True, read_only=True)
    roomOfClass = serializers.PrimaryKeyRelatedField(
        queryset=RoomOfClass.objects.all(), required=False, allow_null=True
    )
    total_earnings = serializers.SerializerMethodField()
    teachers=serializers.PrimaryKeyRelatedField(
        many=True,queryset=Teachers.objects.all(), required=False
    )
    teachers_details=TeachersSerializer(many=True, source='teachers', read_only=True)
    roomOfClass_details = RoomMiniSerializer(
        source='roomOfClass', read_only=True
    )
    student_count=serializers.SerializerMethodField()
    teachers_count=serializers.SerializerMethodField()
    assignments=AssignmentSerializer(many=True,read_only=True)
    
    class Meta:
        model=Classes
        fields=['id','name','course','course_name','subjects','teachers','teachers_details','startDate','endDate','enrollments','student_count','teachers_count',
                'total_earnings','roomOfClass','start_time','end_time','capacity','assignments','roomOfClass_details','is_active','is_archived']

    def get_total_earnings(self, obj):
        return obj.total_earnings()
    
        
    def get_teachers_count(self, obj):
        return obj.teachers.count()
    def get_student_count(self, obj):
        return obj.enrollments.filter(status=Enrollment.Status.ACTIVE).count()


class CourseSerializer(serializers.ModelSerializer):
    batches = ClassesMiniSerialiser(many=True, read_only=True)
    batch_count = serializers.SerializerMethodField()
    active_student_count = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "tenant",
            "name",
            "code",
            "description",
            "duration_weeks",
            "fee",
            "is_active",
            "is_archived",
            "archived_at",
            "created_at",
            "updated_at",
            "batches",
            "batch_count",
            "active_student_count",
            "total_revenue",
        ]
        read_only_fields = ["tenant", "archived_at", "created_at", "updated_at", "batch_count", "active_student_count", "total_revenue", "batches"]

    def get_batch_count(self, obj):
        return obj.batches.count()

    def get_active_student_count(self, obj):
        return Enrollment.objects.filter(course=obj, status=Enrollment.Status.ACTIVE).count()

    def get_total_revenue(self, obj):
        from .models import Invoice
        return Invoice.objects.filter(course=obj).exclude(status=Invoice.Status.CANCELLED).aggregate(total=Sum("paid_amount"))["total"] or 0

    def get_teachers_count(self, obj):
        return 0


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model=Staff
        fields='__all__'

class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model=ExpenseCategory
        fields='__all__'
        read_only_fields=["tenant","created_at"]


class ExpensesSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model=Expenses
        fields='__all__'
        read_only_fields=["tenant","expense_number","created_by","approved_by","approval_date","created_at","updated_at"]

    def validate(self, attrs):
        title = attrs.get("title") or attrs.get("name")
        if not title:
            raise serializers.ValidationError({"title": "Expense title is required."})
        amount = attrs.get("amount", getattr(self.instance, "amount", None))
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than zero."})
        return attrs


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    spent_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    used_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model=Budget
        fields='__all__'
        read_only_fields=["tenant","created_at","updated_at","spent_amount","remaining_amount","used_percentage"]


class RecurringExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model=RecurringExpense
        fields='__all__'
        read_only_fields=["tenant","created_at"]
    
class ExpenseHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model=ExpenseHistory
        fields='__all__'
class RoomSerializer(serializers.ModelSerializer):
    classes=ClassesSerializer(many=True,required=False)
    class Meta:
        model=RoomOfClass
        fields=['id','name','classes']


# class AdmissionSerializer(serializers.Serializer):
#     student = serializers.DictField()
#     account = serializers.DictField(required=False)
#     academic = serializers.DictField()

#     def validate(self, attrs):
#         student = attrs.get("student") or {}
#         account = attrs.get("account") or {}
#         academic = attrs.get("academic") or {}
#         if not student.get("first_name") or not student.get("last_name"):
#             raise serializers.ValidationError({"student": "First name and last name are required."})
#         if account.get("create_user", True) and (not account.get("username") or not account.get("password")):
#             raise serializers.ValidationError({"account": "Username and password are required when account creation is enabled."})
#         if not academic.get("batch"):
#             raise serializers.ValidationError({"academic": "Batch is required."})
#         return attrs



class AdmissionStudentSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    guardian_name = serializers.CharField(required=False, allow_blank=True)
    parent_mobile_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)


class AdmissionAccountSerializer(serializers.Serializer):
    create_user = serializers.BooleanField(default=True)
    username = serializers.CharField(required=False)
    password = serializers.CharField(required=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)


class AdmissionAcademicSerializer(serializers.Serializer):
    batch = serializers.IntegerField()
    enrollment_date = serializers.DateField(required=False)
    status = serializers.CharField(default="active")

class AdmissionSerializer(serializers.Serializer):
    student = AdmissionStudentSerializer()
    account = AdmissionAccountSerializer(required=False)
    academic = AdmissionAcademicSerializer()

    def validate(self, attrs):
        account = attrs.get("account") or {}

        if account.get("create_user", True):
            if not account.get("username") or not account.get("password"):
                raise serializers.ValidationError({
                    "account": "Username and password are required when account creation is enabled."
                })

        return attrs
