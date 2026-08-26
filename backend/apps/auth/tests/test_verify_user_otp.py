from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from apps.auth.models import UserOTP

User = get_user_model()


class BaseOTPFlowTest:
    endpoint = None
    expected_role = None

    def register_user(self, email="test@test.com", phone=None):
        url = reverse(self.endpoint)

        payload = {
            "username": f"{self.endpoint}_user",
            "full_name": "Test User",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
        }
        if email:
            payload["email"] = email
        if phone:
            payload["phone"] = phone

        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user = User.objects.get(username=payload["username"])
        self.assertEqual(user.role, self.expected_role)

        return user

    def test_full_registration_to_verification_flow(self):
        user = self.register_user()
        self.assertFalse(user.is_verified)

        otp = UserOTP.objects.filter(user=user).first()
        self.assertIsNotNone(otp)
        verify_url = reverse("verify-otp")
        response = self.client.post(verify_url, {"otp": otp.code})

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.is_verified)

        self.assertFalse(UserOTP.objects.filter(id=otp.id).exists())

    def test_verify_user_with_invalid_otp(self):
        user = self.register_user()

        verify_url = reverse("verify-otp")
        response = self.client.post(verify_url, {"otp": "9999"})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        user.refresh_from_db()
        self.assertFalse(user.is_verified)

    def test_verify_user_with_expired_otp(self):
        user = self.register_user()

        otp = UserOTP.objects.filter(user=user).first()

        otp.expires_at = timezone.now() - timedelta(minutes=1)
        otp.save()

        verify_url = reverse("verify-otp")
        response = self.client.post(verify_url, {"otp": otp.code})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        user.refresh_from_db()
        self.assertFalse(user.is_verified)

    def test_otp_code_max_length_valid(self):
        user = self.register_user()

        otp = UserOTP.objects.filter(user=user).first()

        self.assertEqual(len(otp.code), 4)

    def test_otp_code_cannot_exceed_max_length(self):
        user = self.register_user()

        otp = UserOTP(
            user=user,
            code="12345",
            expires_at=timezone.now() + timedelta(hours=1),
            type=1
        )

        with self.assertRaises(ValidationError):
            otp.full_clean()


class StudentOTPFlowTest(BaseOTPFlowTest, APITestCase):
    endpoint = "student-register"
    expected_role = 1


class ParentOTPFlowTest(BaseOTPFlowTest, APITestCase):
    endpoint = "parent-register"
    expected_role = 2


class TutorOTPFlowTest(BaseOTPFlowTest, APITestCase):
    endpoint = "tutor-register"
    expected_role = 3
