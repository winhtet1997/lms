from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.auth.models import UserOTP
from apps.leaderboard import services
from apps.leaderboard.models import DailyLoginRecord, PointTransaction, UserPoints

User = get_user_model()


class RegistrationPointsTest(TestCase):
    def test_awarded_when_verified_flips_true(self):
        student = User.objects.create_user(
            username="s1", password="x", role=1, is_verified=False
        )
        self.assertFalse(
            PointTransaction.objects.filter(
                user=student, event_type=services.REGISTRATION
            ).exists()
        )

        student.is_verified = True
        student.save()

        self.assertEqual(
            PointTransaction.objects.filter(
                user=student, event_type=services.REGISTRATION
            ).count(),
            1,
        )
        self.assertEqual(UserPoints.objects.get(user=student).total_points, 500)

    def test_not_awarded_twice(self):
        # Mirrors the Google-signup path, which creates the user already verified.
        student = User.objects.create_user(
            username="s1", password="x", role=1, is_verified=True
        )
        self.assertEqual(
            PointTransaction.objects.filter(
                user=student, event_type=services.REGISTRATION
            ).count(),
            1,
        )

        student.full_name = "New Name"
        student.save()

        self.assertEqual(
            PointTransaction.objects.filter(
                user=student, event_type=services.REGISTRATION
            ).count(),
            1,
        )

    def test_not_awarded_for_non_student(self):
        parent = User.objects.create_user(
            username="p1", password="x", role=2, is_verified=True
        )
        self.assertFalse(
            PointTransaction.objects.filter(user=parent).exists()
        )


class VerifyOtpRegistrationPointsTest(APITestCase):
    def test_registration_points_awarded_via_otp_verification(self):
        student = User.objects.create_user(
            username="s1", password="StrongPass123", role=1, is_verified=False
        )
        UserOTP.objects.create(
            user=student,
            code="1234",
            expires_at=timezone.now() + timedelta(hours=1),
            type=1,
        )

        response = self.client.post(reverse("verify-otp"), {"otp": "1234"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student.refresh_from_db()
        self.assertTrue(student.is_verified)
        self.assertEqual(
            PointTransaction.objects.filter(
                user=student, event_type=services.REGISTRATION
            ).count(),
            1,
        )
        self.assertEqual(UserPoints.objects.get(user=student).total_points, 500)


class ProfileCompletionPointsTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="s1", password="x", role=1, is_verified=True
        )
        # Isolate profile-completion assertions from the registration award above.
        PointTransaction.objects.all().delete()
        UserPoints.objects.all().delete()

    def test_awarded_once_all_three_fields_set(self):
        self.student.avatar = SimpleUploadedFile(
            "avatar.jpg", b"filecontent", content_type="image/jpeg"
        )
        self.student.dob = date(2010, 1, 1)
        self.student.gender = "male"
        self.student.save()

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.PROFILE_COMPLETE
            ).count(),
            1,
        )
        self.assertEqual(
            UserPoints.objects.get(user=self.student).total_points, 200
        )

    def test_not_awarded_when_partial(self):
        self.student.dob = date(2010, 1, 1)
        self.student.save()

        self.assertFalse(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.PROFILE_COMPLETE
            ).exists()
        )

    def test_not_awarded_twice(self):
        self.student.avatar = SimpleUploadedFile(
            "avatar.jpg", b"filecontent", content_type="image/jpeg"
        )
        self.student.dob = date(2010, 1, 1)
        self.student.gender = "male"
        self.student.save()

        self.student.full_name = "Updated Name"
        self.student.save()

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.PROFILE_COMPLETE
            ).count(),
            1,
        )


class DailyLoginPointsTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="s1", password="x", role=1, is_verified=True
        )
        PointTransaction.objects.all().delete()
        UserPoints.objects.all().delete()
        DailyLoginRecord.objects.all().delete()

    def test_awarded_once_per_day(self):
        self.student.last_login = timezone.now()
        self.student.save(update_fields=["last_login"])

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.DAILY_LOGIN
            ).count(),
            1,
        )

        self.student.last_login = timezone.now()
        self.student.save(update_fields=["last_login"])

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.DAILY_LOGIN
            ).count(),
            1,
        )

    def test_not_triggered_by_unrelated_field_update(self):
        self.student.full_name = "Changed"
        self.student.save(update_fields=["full_name"])

        self.assertFalse(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.DAILY_LOGIN
            ).exists()
        )
