from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class DeleteUserRoleTests(APITestCase):

    def setUp(self):
        self.parent1 = User.objects.create_user(
            username="parent-test", password="pass123", role=2,
            email='parent-test@test.com'
        )
        self.parent2 = User.objects.create_user(
            username="parent2", password="pass123", role=2
        )

        self.student1 = User.objects.create_user(
            username="student-test", password="pass123", role=1,
            email='student-test@test.com'
        )

        self.tutor1 = User.objects.create_user(
            username="tutor-test", password="pass123", role=3,
            email='tutor-test@test.com'
        )

    def test_parent_can_delete_own_account(self):
        self.client.force_authenticate(user=self.parent1)
        url = reverse("user-detail", args=[self.parent1.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_parent_can_delete_student(self):
        self.client.force_authenticate(user=self.parent1)
        url = reverse("user-detail", args=[self.student1.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_parent_cannot_delete_other_parent(self):
        self.client.force_authenticate(user=self.parent1)
        url = reverse("user-detail", args=[self.parent2.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_tutor_can_delete_own_account(self):
        self.client.force_authenticate(user=self.tutor1)
        url = reverse("user-detail", args=[self.tutor1.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_tutor_can_delete_other_student(self):
        self.client.force_authenticate(user=self.tutor1)
        url = reverse("user-detail", args=[self.student1.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_student_can_delete_own_account(self):
        self.client.force_authenticate(user=self.student1)
        url = reverse("user-detail", args=[self.student1.id])

        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_student_cannot_delete_other_users(self):
        self.client.force_authenticate(user=self.student1)
        url = reverse("user-detail", args=[self.parent1.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
