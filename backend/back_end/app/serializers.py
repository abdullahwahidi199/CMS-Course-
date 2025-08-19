from rest_framework import serializers
from .models import Students,Teachers,Events,Classes,Attendance,Staff,Expenses,ExpenseHistory,RoomOfClass

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model=Attendance
        fields='__all__'

class StudentsSerializer(serializers.ModelSerializer):
    attendances=AttendanceSerializer(many=True,read_only=True)
    class Meta:
        model=Students
        fields='__all__'
class RoomMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model=RoomOfClass
        fields='__all__'

class ClassesMiniSerialiser(serializers.ModelSerializer):
    class Meta:
        model=Classes
        fields=['id','name']
class TeachersSerializer(serializers.ModelSerializer):
    classes=ClassesMiniSerialiser(many=True,read_only=True)
    class Meta:
        model=Teachers
        fields=['id','full_name','email_address','subject','phone_number','department','classes']

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model=Events
        fields=['id','title','discription','image','date']

class ClassesSerializer(serializers.ModelSerializer):
    student=StudentsSerializer(many=True, read_only=True)
    roomOfClass=RoomMiniSerializer(read_only=True)
    total_earnings = serializers.SerializerMethodField()
    teachers=serializers.PrimaryKeyRelatedField(
        many=True,queryset=Teachers.objects.all(), required=False
    )
    teachers_details=TeachersSerializer(many=True,source='teachers',required=False)
    
    student_count=serializers.SerializerMethodField()
    teachers_count=serializers.SerializerMethodField()
    
    
    class Meta:
        model=Classes
        fields=['id','name','subjects','teachers','teachers_details','startDate','endDate','student','student_count','teachers_count','total_earnings','roomOfClass','start_time','end_time']

    def get_total_earnings(self, obj):
        return obj.total_earnings()
    
        
    
    def get_student_count(self,obj):
        print(obj)
        return obj.student.count()
    def get_teachers_count(self,obj):
        return obj.teachers.count()
    
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

        # teachers: get list of ids
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
    classes=ClassesSerializer(many=True)
    class Meta:
        model=RoomOfClass
        fields='__all__'
# class TimeTableSerializer(serializers.ModelSerializer):
#     class Meta:
#         model=TimeTable
#         fields='__all__'
