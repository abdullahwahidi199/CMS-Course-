from django.contrib import admin
from .models import Students,Teachers,Events,Classes,Attendance,Staff,Expenses,ExpenseHistory,RoomOfClass,User,Marks,Assignment,Submission

# Register your models here.
admin.site.register(Students),
admin.site.register(Teachers),
admin.site.register(Events),
admin.site.register(Classes),
admin.site.register(Attendance),
admin.site.register(Staff),
admin.site.register(Expenses),
admin.site.register(ExpenseHistory),
admin.site.register(User),
admin.site.register(Marks),
admin.site.register(Assignment),
admin.site.register(Submission)


# admin.site.register(RoomOfClass)