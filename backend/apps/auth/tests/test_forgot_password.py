from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from apps.auth.models import User, UserOTP


class ForgotPasswordOTPTestCase(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="otpuser",
            email="otp@example.com",
            full_name="OTP User",
            password="oldpassword123",
            is_verified=True, role=1
        )

        self.forgot_url = "/api/auth/forgot-password/"
        self.reset_url = "/api/auth/reset-password/"

    def test_otp_created_on_forgot_password(self):
        response = self.client.post(self.forgot_url,
                                    {"email": "otp@example.com"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(UserOTP.objects.filter(user=self.user).count(), 1)

    def test_expired_otp_fails(self):
        UserOTP.objects.create(
            user=self.user,
            code="111111",
            expires_at=timezone.now() - timedelta(minutes=5),
        )

        response = self.client.post(
            self.reset_url,
            {
                "otp": "111111",
                "password": "newpass123",
                "confirm_password": "newpass123",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_invalid_otp_fails(self):
        UserOTP.objects.create(
            user=self.user,
            code="111111",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response = self.client.post(
            self.reset_url,
            {
                "otp": "999999",
                "password": "newpass123",
                "confirm_password": "newpass123",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_otp_cannot_be_reused(self):
        UserOTP.objects.create(
            user=self.user,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response1 = self.client.post(
            self.reset_url,
            {
                "otp": "123456",
                "password": "newpass123",
                "confirm_password": "newpass123",
            },
        )

        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        response2 = self.client.post(
            self.reset_url,
            {
                "otp": "123456",
                "password": "anotherpass",
                "confirm_password": "anotherpass",
            },
        )

        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_latest_otp_is_used(self):
        UserOTP.objects.create(
            user=self.user,
            code="111111",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        UserOTP.objects.create(
            user=self.user,
            code="222222",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response = self.client.post(
            self.reset_url,
            {
                "otp": "222222",
                "password": "newpass123",
                "confirm_password": "newpass123",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_otp_not_sent_for_invalid_user(self):
        response = self.client.post(self.forgot_url,
                                    {"email": "notfound@example.com"})

        self.assertEqual(response.status_code, 400)
        self.assertEqual(UserOTP.objects.count(), 0)

    def test_otp_limit_after_5_attempts(self):
        for _ in range(5):
            UserOTP.objects.create(
                user=self.user,
                code="111111",
                expires_at=timezone.now() + timedelta(minutes=10),
            )

        response = self.client.post(self.forgot_url,
                                    {"email": "otp@example.com"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(UserOTP.objects.filter(user=self.user).count(), 5)

    def test_otp_status_success(self):
        UserOTP.objects.create(
            user=self.user,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response = self.client.post(
            self.reset_url,
            {
                "otp": "123456",
                "password": "newpass123",
                "confirm_password": "newpass123",
            },
        )

        self.assertEqual(response.status_code, 200)
        # self.assertEqual(response.data.get("otp_status"), 0)

    def test_otp_status_invalid(self):
        UserOTP.objects.create(
            user=self.user,
            code="123456",
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        response = self.client.post(
            self.reset_url,
            {
                "otp": "999999",
                "password": "newpass123",
                "confirm_password": "newpass123",
            },
        )
        self.assertEqual(response.status_code, 400)
