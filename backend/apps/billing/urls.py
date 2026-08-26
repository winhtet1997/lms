from django.urls import path
from . import views

urlpatterns = [
     path("plans/", views.SubscriptionPlanListApiView.as_view(),
          name="subscription-plan-list"),
     path("plans/<int:pk>/", views.SubscriptionPlanDetailApiView.as_view(),
          name="subscription-plan-detail"),
     path("enrollments/", views.EnrollmentListApiView.as_view(),
          name="enrollment-list"),
     path("enrollments/me/", views.MyEnrollmentApiView.as_view(),
          name="enrollment-me"),
     path("enrollments/<int:pk>/", views.EnrollmentDetailApiView.as_view(),
          name="enrollment-detail"),
     path("payments/initialize/", views.InitializePaymentApiView.as_view(),
          name="payment-initialize"),
     path("payments/status/<str:order_number>/", views.PaymentStatusApiView.as_view(),
          name="payment-status"),
     path("payments/callback/", views.DingerCallbackApiView.as_view(),
          name="payment-callback"),
     path("payment-transactions/", views.PaymentTransactionListApiView.as_view(),
          name="payment-transaction-list"),
]
