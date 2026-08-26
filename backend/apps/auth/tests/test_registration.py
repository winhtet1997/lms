from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.auth.models import UserOTP

User = get_user_model()


class BaseRegistrationTest:
    endpoint = None
    expected_role = None

    def get_url(self):
        return reverse(self.endpoint)

    def get_valid_payload(self, email="test@test.com", phone=None,
                          username="testuser"):
        payload = {
            "username": username,
            "full_name": "Test User",
            "password": "StrongPass123",
            "confirm_password": "StrongPass123",
        }
        if email:
            payload["email"] = email
        if phone:
            payload["phone"] = phone
        return payload

    def register_and_assert_success(self, payload=None):
        if payload is None:
            payload = self.get_valid_payload()

        initial_count = User.objects.count()
        response = self.client.post(self.get_url(), payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.count(), initial_count + 1)

        user = User.objects.latest("id")
        self.assertEqual(user.role, self.expected_role)
        self.assertTrue(user.check_password("StrongPass123"))
        self.assertFalse(user.is_verified)

        return response, user

    def register_and_assert_failure(self, payload):
        initial_count = User.objects.count()
        response = self.client.post(self.get_url(), payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.count(), initial_count)

        return response

    def test_successful_registration(self):
        response, _ = self.register_and_assert_success()
        self.assertIn("message", response.data)

    def test_otp_is_generated_after_registration(self):
        _, user = self.register_and_assert_success()

        otp_exists = UserOTP.objects.filter(user=user).exists()

        self.assertTrue(otp_exists)

    def test_generated_otp_is_verify_type(self):
        _, user = self.register_and_assert_success()
        otp = UserOTP.objects.filter(user=user).first()
        self.assertIsNotNone(otp)
        self.assertEqual(otp.type, 1)

    def test_passwords_must_match(self):
        data = self.get_valid_payload()
        data["confirm_password"] = "WrongPass"
        self.register_and_assert_failure(data)

    def test_email_or_phone_required(self):
        data = self.get_valid_payload(email=None, phone=None)
        self.register_and_assert_failure(data)

    def test_can_register_with_phone_only(self):
        data = self.get_valid_payload(email=None, phone="01712345678")
        _, user = self.register_and_assert_success(data)
        self.assertEqual(user.phone, "01712345678")

    def test_username_required(self):
        data = self.get_valid_payload()
        data.pop("username")
        self.register_and_assert_failure(data)

    def test_username_must_be_unique(self):
        User.objects.create_user(
            username="testuser",
            email="existing@test.com",
            password="pass",
            role=self.expected_role,
        )
        data = self.get_valid_payload(username="testuser",
                                      email="new@test.com")
        self.register_and_assert_failure(data)

    def test_email_must_be_unique(self):
        User.objects.create_user(
            username="user1",
            email="test@test.com",
            password="pass",
            role=self.expected_role,
        )
        data = self.get_valid_payload(email="test@test.com",
                                      username="newuser")
        self.register_and_assert_failure(data)

    def test_role_cannot_be_overridden_in_payload(self):
        data = self.get_valid_payload()
        data["role"] = 999
        _, user = self.register_and_assert_success(data)
        self.assertEqual(user.role, self.expected_role)

    def test_password_too_short(self):
        data = self.get_valid_payload()
        data["password"] = data["confirm_password"] = "123"
        self.register_and_assert_failure(data)


class StudentRegistrationTest(BaseRegistrationTest, APITestCase):
    endpoint = "student-register"
    expected_role = 1


class ParentRegistrationTest(BaseRegistrationTest, APITestCase):
    endpoint = "parent-register"
    expected_role = 2


class TutorRegistrationTest(BaseRegistrationTest, APITestCase):
    endpoint = "tutor-register"
    expected_role = 3
