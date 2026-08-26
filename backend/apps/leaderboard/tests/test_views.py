from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.leaderboard import services
from apps.leaderboard.models import PointTransaction, UserPoints

User = get_user_model()


class LeaderboardListViewTest(APITestCase):
    def setUp(self):
        self.student1 = User.objects.create_user(
            username="s1", email="s1@test.com", password="x", role=1, is_verified=True
        )
        self.student2 = User.objects.create_user(
            username="s2", email="s2@test.com", password="x", role=1, is_verified=True
        )
        self.parent = User.objects.create_user(
            username="p1", email="p1@test.com", password="x", role=2, is_verified=True
        )
        PointTransaction.objects.all().delete()
        UserPoints.objects.all().delete()

        services.award_points(self.student1, services.ITEM_COMPLETE)  # 300
        services.award_points(self.student2, services.ITEM_COMPLETE)
        services.award_points(self.student2, services.DAILY_LOGIN)  # 400

        self.url = reverse("leaderboard-list")

    def test_ranks_students_by_points_desc(self):
        self.client.force_authenticate(self.student1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [row["username"] for row in response.data["results"]]
        self.assertEqual(usernames, ["s2", "s1"])
        self.assertEqual(response.data["results"][0]["rank"], 1)
        self.assertEqual(response.data["results"][1]["rank"], 2)

    def test_excludes_non_students(self):
        self.client.force_authenticate(self.student1)
        response = self.client.get(self.url)

        usernames = [row["username"] for row in response.data["results"]]
        self.assertNotIn("p1", usernames)


class GradeLeaderboardListViewTest(APITestCase):
    def setUp(self):
        self.student1 = User.objects.create_user(
            username="s1", email="s1@test.com", password="x", role=1,
            is_verified=True, grade_level="6",
        )
        self.student2 = User.objects.create_user(
            username="s2", email="s2@test.com", password="x", role=1,
            is_verified=True, grade_level="6",
        )
        self.student_other_grade = User.objects.create_user(
            username="s3", email="s3@test.com", password="x", role=1,
            is_verified=True, grade_level="7",
        )
        self.student_no_grade = User.objects.create_user(
            username="s4", email="s4@test.com", password="x", role=1, is_verified=True
        )
        PointTransaction.objects.all().delete()
        UserPoints.objects.all().delete()

        services.award_points(self.student1, services.ITEM_COMPLETE)  # 300 grade
        services.award_points(self.student2, services.ITEM_COMPLETE)
        services.award_points(self.student2, services.DAILY_LOGIN)  # +100 total, not grade
        services.award_points(self.student_other_grade, services.COURSE_COMPLETE)  # 1000

        self.url = reverse("leaderboard-grade")

    def test_ranks_students_within_own_grade_by_grade_points(self):
        self.client.force_authenticate(self.student1)
        response = self.client.get(self.url, {"grade_level": "6"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [row["username"] for row in response.data["results"]]
        # s1 and s2 both have 300 grade_points; daily_login only bumped s2's total_points.
        self.assertEqual(set(usernames), {"s1", "s2"})
        self.assertNotIn("s3", usernames)
        for row in response.data["results"]:
            self.assertEqual(row["total_points"], 300)

    def test_defaults_to_requesting_users_grade(self):
        self.client.force_authenticate(self.student1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [row["username"] for row in response.data["results"]]
        self.assertEqual(set(usernames), {"s1", "s2"})

    def test_400_when_grade_cannot_be_resolved(self):
        self.client.force_authenticate(self.student_no_grade)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MyLeaderboardStatsViewTest(APITestCase):
    def setUp(self):
        self.student1 = User.objects.create_user(
            username="s1", email="s1@test.com", password="x", role=1,
            is_verified=True, grade_level="6",
        )
        self.student2 = User.objects.create_user(
            username="s2", email="s2@test.com", password="x", role=1,
            is_verified=True, grade_level="6",
        )
        self.parent = User.objects.create_user(
            username="p1", email="p1@test.com", password="x", role=2, is_verified=True
        )
        PointTransaction.objects.all().delete()
        UserPoints.objects.all().delete()

        services.award_points(self.student1, services.ITEM_COMPLETE)  # 300
        services.award_points(self.student2, services.ITEM_COMPLETE)
        services.award_points(self.student2, services.DAILY_LOGIN)  # 400

        self.url = reverse("leaderboard-me")

    def test_returns_rank_and_breakdown(self):
        self.client.force_authenticate(self.student1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_points"], 300)
        self.assertEqual(response.data["rank"], 2)
        breakdown = {row["event_type"]: row["total"] for row in response.data["breakdown"]}
        self.assertEqual(breakdown[services.ITEM_COMPLETE], 300)

    def test_returns_grade_rank_and_points(self):
        self.client.force_authenticate(self.student1)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["grade_level"], "6")
        self.assertEqual(response.data["grade_points"], 300)
        # Both students have 300 grade_points (daily_login doesn't count), so rank 1.
        self.assertEqual(response.data["grade_rank"], 1)

    def test_forbidden_for_non_student(self):
        self.client.force_authenticate(self.parent)
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
