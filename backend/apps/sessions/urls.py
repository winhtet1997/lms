from django.urls import path
from . import views

urlpatterns = [
    # Tutor discovery
    path("tutors/", views.TutorListView.as_view(), name="tutor-list"),
    path("tutors/<int:tutor_id>/availability/", views.TutorAvailabilityView.as_view(), name="tutor-availability"),

    # Tutor's own availability
    path("availability/", views.MyAvailabilityView.as_view(), name="my-availability"),
    path("availability/<int:pk>/", views.MyAvailabilityDetailView.as_view(), name="my-availability-detail"),

    # Session booking (student)
    path("", views.SessionListView.as_view(), name="session-list"),
    path("<int:pk>/", views.SessionDetailView.as_view(), name="session-detail"),

    # Tutor approval & session list
    path("tutor/pending/", views.TutorPendingSessionsView.as_view(), name="tutor-pending"),
    path("tutor/all/", views.TutorSessionListView.as_view(), name="tutor-session-list"),
    path("tutor/stats/", views.TutorSessionStatsView.as_view(), name="tutor-session-stats"),
    path("<int:pk>/approve/", views.ApproveSessionView.as_view(), name="session-approve"),
    path("<int:pk>/reject/", views.RejectSessionView.as_view(), name="session-reject"),

    # Live session
    path("<int:pk>/join/", views.JoinSessionView.as_view(), name="session-join"),
    path("<int:pk>/end/", views.EndSessionView.as_view(), name="session-end"),

    # Group sessions
    path("group/", views.GroupSessionCreateView.as_view(), name="group-session-create"),
    path("<int:pk>/register/", views.RegisterGroupSessionView.as_view(), name="group-session-register"),

    # Rating
    path("<int:pk>/rate/", views.RateSessionView.as_view(), name="session-rate"),

    # Admin
    path("admin/", views.AdminSessionListView.as_view(), name="admin-session-list"),
    path("admin/stats/", views.AdminSessionStatsView.as_view(), name="admin-session-stats"),

    # Daily.co webhook
    path("webhook/daily/", views.DailyWebhookView.as_view(), name="daily-webhook"),
]
