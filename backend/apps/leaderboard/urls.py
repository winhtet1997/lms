from django.urls import path

from . import views

urlpatterns = [
    path("", views.LeaderboardListView.as_view(), name="leaderboard-list"),
    path("grade/", views.GradeLeaderboardListView.as_view(), name="leaderboard-grade"),
    path("me/", views.MyLeaderboardStatsView.as_view(), name="leaderboard-me"),
]
