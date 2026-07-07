from rest_framework import serializers
from .models import Students,Teachers,Events,Classes,Attendance,Staff,Expenses,ExpenseHistory,RoomOfClass,User,Marks
from .models import Course, Enrollment, Role
from .models import Assignment,Submission,Tenant
from .services.student_service import create_student, update_student
from .services.teacher_service import create_teacher, update_teacher



class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = "__all__"
class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model=Attendance
        fields='__all__'


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
        fields=['id','name','course','course_name','startDate','endDate','roomOfClass','start_time','end_time','roomOfClass_details']


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    batch_name = serializers.CharField(source="batch.name", read_only=True)

    class Meta:
        model = Enrollment
        fields = "__all__"
        read_only_fields = ["tenant", "created_by", "created_at", "updated_at"]



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
    class Meta:
        model=Students
        fields=[
            'id','username','password','first_name','last_name','email','phone','user_is_active',
            'name','f_name','role_number','parent_mobile_number','student_number','address',
            'total_fee','amount_paid','enrollment_date','is_active','is_archived',
            'current_enrollments','previous_enrollments','attendances','marks'
        ]
        read_only_fields = ["name", "student_number", "enrollment_date", "is_archived"]

    def get_current_enrollments(self, obj):
        return EnrollmentSerializer(obj.enrollments.filter(status=Enrollment.Status.ACTIVE), many=True).data

    def get_previous_enrollments(self, obj):
        return EnrollmentSerializer(obj.enrollments.exclude(status=Enrollment.Status.ACTIVE), many=True).data
    
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
    classes=ClassesMiniSerialiser(many=True,read_only=True)
    class Meta:
        model=Teachers
        fields=['id','username','password','user_is_active','full_name','email_address','subject','phone_number','department','classes','is_active','is_archived']
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
        return create_teacher(
            tenant=validated_data.pop("tenant"),
            username=user_data.get("username"),
            password=password,
            email=validated_data.get("email_address"),
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
    teachers_details=TeachersSerializer(many=True,source='teachers',required=False)
    roomOfClass_details = RoomMiniSerializer(
        source='roomOfClass', read_only=True
    )
    student_count=serializers.SerializerMethodField()
    teachers_count=serializers.SerializerMethodField()
    assignments=AssignmentSerializer(many=True,read_only=True)
    
    class Meta:
        model=Classes
        fields=['id','name','course','course_name','subjects','teachers','teachers_details','startDate','endDate','enrollments','student_count','teachers_count',
                'total_earnings','roomOfClass','start_time','end_time','assignments','roomOfClass_details','is_active','is_archived']

    def get_total_earnings(self, obj):
        return obj.total_earnings()
    
        
    def get_teachers_count(self, obj):
        return obj.teachers.count()
    def get_student_count(self, obj):
        return obj.enrollments.filter(status=Enrollment.Status.ACTIVE).count()


class CourseSerializer(serializers.ModelSerializer):
    batches = ClassesMiniSerialiser(many=True, read_only=True)

    class Meta:
        model = Course
        fields = "__all__"

    def get_teachers_count(self, obj):
        return len(obj.teachers.all())

    
    def update(self,instance,validated_data):
        new_teachers=validated_data.pop('teachers',[])
        instance=super().update(instance,validated_data)

        for teacher in new_teachers:
            instance.teachers.add(teacher)
        return instance
    
    def update(self,instance,validated_data):
        if 'teachers' in validated_data:
            teachers=validated_data.pop('teachers')
            instance.teachers.set(teachers)
        return super().update(instance,validated_data)

    
    def validate(self, data):
        
        instance_id = self.instance.id if self.instance else None

        
        start_time = data.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = data.get('end_time', getattr(self.instance, 'end_time', None))

        
        room_id = None
        if 'roomOfClass' in data:
            room_val = data.get('roomOfClass')
            
            if isinstance(room_val, dict):
                room_id = room_val.get('id')
            else:
                room_id = room_val
        else:
           
            room_id = getattr(self.instance, 'roomOfClass_id', None)

        
        if 'teachers' in data:
            
            teachers_in = data.get('teachers')  
            if teachers_in is None:
                teacher_ids = []
            else:
               
                if len(teachers_in) > 0 and hasattr(teachers_in[0], 'id'):
                    teacher_ids = [t.id for t in teachers_in]
                else:
                    teacher_ids = [int(t) for t in teachers_in]
        else:
            if self.instance:
                teacher_ids = list(self.instance.teachers.values_list('id', flat=True))
            else:
                teacher_ids = []

        
        if room_id is not None and start_time and end_time:
            room_conflict_qs = Classes.objects.filter(
                roomOfClass_id=room_id,
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            if instance_id:
                room_conflict_qs = room_conflict_qs.exclude(pk=instance_id)
            if room_conflict_qs.exists():
                raise serializers.ValidationError({
                    'non_field_errors': ["This room is taken at this time!"]
                })

        
        if teacher_ids and start_time and end_time:
           
            from .models import Teachers as TeacherModel
            teachers_qs = TeacherModel.objects.filter(id__in=teacher_ids)
            for teacher in teachers_qs:
                teacher_conflict_qs = Classes.objects.filter(
                    teachers=teacher,
                    start_time__lt=end_time,
                    end_time__gt=start_time
                )
                if instance_id:
                    teacher_conflict_qs = teacher_conflict_qs.exclude(pk=instance_id)
                if teacher_conflict_qs.exists():
                    raise serializers.ValidationError({
                        'non_field_errors': [f"Teacher {teacher.name} already has a class at this time."]
                    })

        return data


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model=Staff
        fields='__all__'

class ExpensesSerializer(serializers.ModelSerializer):
    class Meta:
        model=Expenses
        fields='__all__'
    
class ExpenseHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model=ExpenseHistory
        fields='__all__'
class RoomSerializer(serializers.ModelSerializer):
    classes=ClassesSerializer(many=True,required=False)
    class Meta:
        model=RoomOfClass
        fields=['id','name','classes']

