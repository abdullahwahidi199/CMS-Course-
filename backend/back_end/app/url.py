from django.urls import path,include
from .views import studentsApi,teachersApi,eventsApi,classApi,eventDetail,studentDetailsView,classDetailsView,teacherDetailsView,Mark_attendance_view,StudentByClassView,staffApi,staffDetailsView
from .views import SchoolTotalEarnings,expensesApi,expenseDetailsView,FinancialSummaryView,ExpenseHistoryApiView,TimetableListView,roomApi,MarksViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserProfileView,student_profile,teacher_profile,AssignmetViewSet,SubmissionViewSet,roomDetailsView,DashboardView,create_tenant
from rest_framework.routers import DefaultRouter
from .views import get_current_tenant,update_tenant

router = DefaultRouter()
router.register(r'marks', MarksViewSet, basename="marks")
router.register(r'assignments',AssignmetViewSet,basename='assignments')
router.register(r'submissions',SubmissionViewSet,basename='submissions')

urlpatterns=[
    path('get-tenant/',get_current_tenant),
    path('update-tenant/',update_tenant),
    path('create-tenant/',create_tenant,name='create-tenant'),
    path('students/',studentsApi),
    path('students/<int:id>/',studentDetailsView.as_view()),
    path('classes/<int:id>/',classDetailsView.as_view()),
    path('teachers/',teachersApi),
    path('teachers/<int:id>/',teacherDetailsView.as_view()),
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
    path('rooms/<int:id>/',roomDetailsView.as_view()),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/profile/", UserProfileView.as_view(), name="user_profile"),
    path("student/profile/",student_profile, name='student-profile'),
    path("teacher/profile/",teacher_profile,name="teacher-profile"),
    path("dashboard/",DashboardView.as_view(),name='dashboard'),
    # path('assignemts',AssignmetViewSet,name='assignments'),
    # path('submissions',SubmissionViewSet,name='submissions'),
    
    path("", include(router.urls)),

   
] 