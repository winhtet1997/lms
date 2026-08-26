from django.urls import path

from . import views

urlpatterns = [
    path("subjects/", views.SubjectListView.as_view(), name="ai-chat-subjects"),
    path("subjects/<str:subject_id>/", views.SubjectDetailView.as_view(), name="ai-chat-subject-detail"),
    path("access/", views.AccessCheckView.as_view(), name="ai-chat-access"),
    path("threads/start/", views.StartThreadView.as_view(), name="ai-chat-thread-start"),
    path("threads/", views.ThreadListView.as_view(), name="ai-chat-thread-list"),
    path("threads/<int:thread_id>/", views.ThreadDetailView.as_view(), name="ai-chat-thread-detail"),
    path(
        "threads/<int:thread_id>/messages/",
        views.ThreadMessageView.as_view(),
        name="ai-chat-thread-messages",
    ),
    path("course-mappings/", views.CourseMappingListView.as_view(), name="ai-chat-course-mappings"),
    path(
        "course-mappings/<int:course_id>/",
        views.CourseMappingDetailView.as_view(),
        name="ai-chat-course-mapping-detail",
    ),
    path("chapter-mappings/", views.ChapterMappingListView.as_view(), name="ai-chat-chapter-mappings"),
    path(
        "chapter-mappings/<int:chapter_id>/",
        views.ChapterMappingDetailView.as_view(),
        name="ai-chat-chapter-mapping-detail",
    ),
]
