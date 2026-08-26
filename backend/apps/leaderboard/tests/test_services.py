from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.leaderboard import services
from apps.leaderboard.models import PointTransaction, UserPoints

User = get_user_model()


class AwardPointsTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="lb_student", email="lb_student@test.com", password="pass1234", role=1
        )
        self.parent = User.objects.create_user(
            username="lb_parent", email="lb_parent@test.com", password="pass1234", role=2
        )

    def test_awards_points_and_updates_total(self):
        services.award_points(self.student, services.ITEM_COMPLETE)

        self.assertEqual(PointTransaction.objects.filter(user=self.student).count(), 1)
        self.assertEqual(
            UserPoints.objects.get(user=self.student).total_points, 300
        )

        services.award_points(self.student, services.DAILY_LOGIN)
        self.assertEqual(
            UserPoints.objects.get(user=self.student).total_points, 400
        )
        self.assertEqual(PointTransaction.objects.filter(user=self.student).count(), 2)

    def test_noop_for_non_student(self):
        services.award_points(self.parent, services.ITEM_COMPLETE)

        self.assertFalse(PointTransaction.objects.filter(user=self.parent).exists())
        self.assertFalse(UserPoints.objects.filter(user=self.parent).exists())

    def test_grade_points_only_track_qualifying_events(self):
        services.award_points(self.student, services.DAILY_LOGIN)  # not qualifying
        self.assertEqual(
            UserPoints.objects.get(user=self.student).grade_points, 0
        )

        services.award_points(self.student, services.ITEM_COMPLETE)  # qualifying
        user_points = UserPoints.objects.get(user=self.student)
        self.assertEqual(user_points.total_points, 100 + 300)
        self.assertEqual(user_points.grade_points, 300)
