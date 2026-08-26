from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()


class LoginViewTests(TestCase):

    def test_user_can_login_with_valid_credentials(self):
        User.objects.create_user(
            username='testuser',
            password='testpass123',
            role=1,
            is_verified=True
        )

        response = self.client.post(reverse('student-login'), {
            'username': 'testuser',
            'password': 'testpass123'
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())

    def test_user_can_login_with_email(self):
        User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpass123',
            role=1,
            is_verified=True
        )

        response = self.client.post(reverse('student-login'), {
            'username': 'testuser@example.com',
            'password': 'testpass123'
        })

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())

    def test_login_fails_with_invalid_password(self):
        User.objects.create_user(
            username='testuser',
            password='correctpass',
            is_verified=True,
            role=1,
        )

        response = self.client.post(reverse('student-login'), {
            'username': 'testuser',
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, 401)

    def test_login_fails_if_user_not_exists(self):
        response = self.client.post(reverse('student-login'), {
            'username': 'nouser',
            'password': 'somepass'
        })

        self.assertEqual(response.status_code, 401)

    def test_login_requires_username(self):
        response = self.client.post(reverse('student-login'), {
            'username': '',
            'password': 'pass123'
        })

        self.assertEqual(response.status_code, 400)

    def test_login_requires_password(self):
        response = self.client.post(reverse('student-login'), {
            'username': 'testuser',
            'password': ''
        })

        self.assertEqual(response.status_code, 400)
