from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("superadmin-login/", views.SuperadminLoginAPIView.as_view(),
         name="admin-login"),
    path("student-login/", views.StudentLoginAPIView.as_view(),
         name="student-login"),
    path("parent-login/", views.ParentLoginAPIView.as_view(),
         name="parent-login"),
    path("tutor-login/", views.TutorLoginAPIView.as_view(),
         name="tutor-login"),
    path(
        "parent-register/",
        views.ParentRegisterAPIView.as_view(),
        name="parent-register",
    ),
    path(
        "student-register/",
        views.StudentRegisterAPIView.as_view(),
        name="student-register",
    ),
    path(
        "tutor-register/", views.TutorRegisterAPIView.as_view(),
        name="tutor-register"
    ),
    path("me/", views.MeApiView.as_view(), name="me"),
    path("users/", views.UserListApiView.as_view(), name="users"),
    path("users/<int:pk>/", views.UserDetailApiView.as_view(),
         name="user-detail"),
    path("children/", views.ChildrenListApiView.as_view(), name="children-list"),
    path("children/search/", views.ChildSearchApiView.as_view(), name="children-search"),
    path("children/link/", views.LinkChildApiView.as_view(), name="children-link"),
    path("children/<int:pk>/unlink/", views.ChildUnlinkApiView.as_view(),
         name="children-unlink"),
    path(
        "forgot-password/channels/",
        views.ForgotPasswordChannelsAPIView.as_view(),
        name="forgot-password-channels",
    ),
    path(
        "forgot-password/",
        views.ForgotPasswordOtpAPIView.as_view(),
        name="forgot-password-otp",
    ),
    path(
        "reset-password/",
        views.ResetPasswordAPIView.as_view(),
        name="reset-password",
    ),
    path(
        "verify-otp/",
        views.VerifyOtpAPIView.as_view(),
        name="verify-otp",
    ),
    path(
        "resend-verification-otp/",
        views.ResendVerificationOtpAPIView.as_view(),
        name="resend-verification-otp",
    ),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("google-auth/", views.GoogleAuthAPIView.as_view(), name="google-auth"),
    path(
        "google-complete-setup/",
        views.GoogleCompleteSetupAPIView.as_view(),
        name="google-complete-setup",
    ),
    path("groups/", views.CustomGroupListView.as_view(), name="group-list"),
    path("groups/<int:pk>/", views.CustomGroupDetailView.as_view(),
         name="group-detail"),
    path("groups/available-permissions/",
         views.AvailablePermissionsView.as_view(),
         name="available-permissions"),
]
