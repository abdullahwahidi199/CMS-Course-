from django.contrib import admin
from .models import Students,Teachers,Events,Classes,Attendance,Staff,Expenses,ExpenseHistory,RoomOfClass

# Register your models here.
admin.site.register(Students),
admin.site.register(Teachers),
admin.site.register(Events),
admin.site.register(Classes),
admin.site.register(Attendance),
admin.site.register(Staff),
admin.site.register(Expenses)
admin.site.register(ExpenseHistory)


# admin.site.register(RoomOfClass)