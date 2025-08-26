from django.urls import path
from .views import studentsApi,teachersApi,eventsApi,classApi,eventDetail,studentDetailsView,classDetailsView,teacherDetailsView,Mark_attendance_view,StudentByClassView,staffApi,staffDetailsView
from .views import SchoolTotalEarnings,expensesApi,expenseDetailsView,FinancialSummaryView,ExpenseHistoryApiView,TimetableListView,roomApi
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserProfileView
urlpatterns=[
    path('students/',studentsApi),
    path('students/<int:id>/',studentDetailsView.as_view()),
    path('classes/<int:id>/',classDetailsView.as_view()),
    path('teachers/',teachersApi),
    path('teachers/<int:id>',teacherDetailsView.as_view()),
    path('events/',eventsApi),
    path('events/<int:id>/',eventDetail),
    path('classes/',classApi),
    path('attendance/mark/<int:class_id>/',Mark_attendance_view),
    path('students/by-class/<int:class_id>/',StudentByClassView.as_view()),
    path('staff/',staffApi),
    path('staff/<int:id>/',staffDetailsView),
    path('school/earnings/',SchoolTotalEarnings.as_view(),name='school-earnings'),
    path('expenses/',expensesApi),
    path('expenses/<int:id>/',expenseDetailsView.as_view()),
    path('school/financial-summary/',FinancialSummaryView.as_view()),
    path('school/expenses/history/',ExpenseHistoryApiView.as_view(),name='expenses'),
    path('timetable/', TimetableListView.as_view(), name='timetable'),
    path('rooms/',roomApi),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/profile/", UserProfileView.as_view(), name="user_profile"),
   
] 