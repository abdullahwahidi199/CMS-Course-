from rest_framework import serializers
from .models import Students,Teachers,Events,Classes,Attendance,Staff,Expenses,ExpenseHistory,RoomOfClass,User,Marks
from .models import Assignment,Submission,Tenant



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
        fields=['id','name','startDate','endDate','roomOfClass','start_time','end_time','roomOfClass_details']



class StudentsSerializer(serializers.ModelSerializer):
    attendances=AttendanceSerializer(many=True,read_only=True)
    marks=MarksSerializer(many=True,read_only=True)
    studentClass_details=ClassesMiniSerialiser(source='studentClass',read_only=True)
    class Meta:
        model=Students
        fields=['id','name','f_name','role_number','parent_mobile_number','student_number','address','studentClass','studentClass_details','total_fee','amount_paid','attendances','marks']
    
    def create(self,validated_data):
        user=User.objects.create_user(
            username=validated_data['name'],
            password=validated_data['name']+'000',
            role='student'
        )
        student=Students.objects.create(user=user,**validated_data)
        return student

class TeachersSerializer(serializers.ModelSerializer):
    classes=ClassesMiniSerialiser(many=True,read_only=True)
    class Meta:
        model=Teachers
        fields=['id','full_name','email_address','subject','phone_number','department','classes']
    def create(self,validated_data):
        user=User.objects.create_user(
            username=validated_data['full_name'],
            password=validated_data['full_name']+'123',
            role='teacher'
        )
        teacher=Teachers.objects.create(user=user,**validated_data)
        return teacher

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Events
        fields=['id','title','discription','image','date']

class UserSerializer(serializers.ModelSerializer):
    teacher_profile = TeachersSerializer(read_only=True)
    student_profile = StudentsSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'teacher_profile', 'student_profile']
    #     extra_kwargs = {
    #         'password': {'write_only': True}
    #     }
    
    # def create(self,validated_data):
    #     role=validated_data.get('role')
    #     password=validated_data.pop('password',None)

    #     user=User(**validated_data)

    #     if password:
    #         user.set_password(password)
    #     user.save()

    #     if role=='teacher':
    #         Teachers.objects.create(user=user,full_name=user.username,email_address=user.email,)
    #     elif role=='student':
    #         Students.objects.create(user=user,name=user.username)
    #     return user

class ClassesSerializer(serializers.ModelSerializer):
    student=StudentsSerializer(many=True, read_only=True)
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
        fields=['id','name','subjects','teachers','teachers_details','startDate','endDate','student','student_count','teachers_count',
                'total_earnings','roomOfClass','start_time','end_time','assignments','roomOfClass_details']

    def get_total_earnings(self, obj):
        return obj.total_earnings()
    
        
    
    def get_student_count(self, obj):
        return len(obj.student.all())

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

