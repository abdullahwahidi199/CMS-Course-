from django.urls import path,include
from .views import studentsApi,teachersApi,eventsApi,classApi,eventDetail,studentDetailsView,classDetailsView,teacherDetailsView,Mark_attendance_view,StudentByClassView,staffApi,staffDetailsView
from .views import student_lifecycle, teacher_lifecycle
from .views import SchoolTotalEarnings,expensesApi,expenseDetailsView,FinancialSummaryView,ExpenseHistoryApiView,TimetableListView,roomApi,MarksViewSet,CourseViewSet,EnrollmentViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserProfileView,student_profile,teacher_profile,AssignmetViewSet,SubmissionViewSet,roomDetailsView,DashboardView,create_tenant
from rest_framework.routers import DefaultRouter
from .views import get_current_tenant,update_tenant
from .views import student_dashboard, student_assessments, student_enrollments, student_attendance, student_fees, student_invoice_download, student_payment_receipt, student_ledger_download, student_certificate_download
from .auth_views import change_password, forgot_password, logout, me, reset_password, update_profile

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename="courses")
router.register(r'enrollments', EnrollmentViewSet, basename="enrollments")
router.register(r'marks', MarksViewSet, basename="marks")
router.register(r'assignments',AssignmetViewSet,basename='assignments')
router.register(r'submissions',SubmissionViewSet,basename='submissions')

urlpatterns=[
    path('auth/me/', me, name='auth-me'),
    path('auth/profile/', update_profile, name='auth-profile'),
    path('auth/change-password/', change_password, name='auth-change-password'),
    path('auth/forgot-password/', forgot_password, name='auth-forgot-password'),
    path('auth/reset-password/', reset_password, name='auth-reset-password'),
    path('auth/logout/', logout, name='auth-logout'),
    path('v1/', include('app.enterprise_urls')),
    path('get-tenant/',get_current_tenant),
    path('update-tenant/',update_tenant),
    path('create-tenant/',create_tenant,name='create-tenant'),
    path('students/',studentsApi),
    path('students/<int:id>/',studentDetailsView.as_view()),
    path('students/<int:id>/<str:action_name>/', student_lifecycle),
    path('classes/<int:id>/',classDetailsView.as_view()),
    path('teachers/',teachersApi),
    path('teachers/<int:id>/',teacherDetailsView.as_view()),
    path('teachers/<int:id>/<str:action_name>/', teacher_lifecycle),
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
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", UserProfileView.as_view(), name="user_profile"),
    path("student/profile/",student_profile, name='student-profile'),
    path("student/dashboard/", student_dashboard, name="student-dashboard"),
    path("student/assessments/", student_assessments, name="student-assessments"),
    path("student/enrollments/", student_enrollments, name="student-enrollments"),
    path("student/attendance/", student_attendance, name="student-attendance"),
    path("student/fees/", student_fees, name="student-fees"),
    path("student/invoices/<int:invoice_id>/download/", student_invoice_download, name="student-invoice-download"),
    path("student/payments/<int:payment_id>/receipt/", student_payment_receipt, name="student-payment-receipt"),
    path("student/ledger/download/", student_ledger_download, name="student-ledger-download"),
    path("student/certificates/<int:enrollment_id>/download/", student_certificate_download, name="student-certificate-download"),
    path("teacher/profile/",teacher_profile,name="teacher-profile"),
    path("dashboard/",DashboardView.as_view(),name='dashboard'),
    # path('assignemts',AssignmetViewSet,name='assignments'),
    # path('submissions',SubmissionViewSet,name='submissions'),
    
    path("", include(router.urls)),

   
] 
