from unittest.mock import patch
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.sessions.models import Session, SessionParticipant, TutorAvailability, SessionRating

User = get_user_model()


def make_user(username, role, email=None):
    return User.objects.create_user(
        username=username,
        email=email or f"{username}@test.com",
        password="StrongPass123",
        role=role,
        is_verified=True,
    )


def future_time(hours=2):
    return timezone.now() + timedelta(hours=hours)


def make_session(tutor, student, session_type="private", status="pending"):
    return Session.objects.create(
        tutor=tutor,
        host_student=student,
        session_type=session_type,
        topic="Math Help",
        scheduled_at=future_time(),
        duration_minutes=60,
        max_participants=2,
        status=status,
    )


class SessionBookingTest(APITestCase):
    def setUp(self):
        self.student = make_user("student_book", role=1)
        self.tutor = make_user("tutor_book", role=3)
        self.client.force_authenticate(user=self.student)

    def test_student_can_book_session(self):
        url = reverse("session-list-create")
        payload = {
            "tutor_id": self.tutor.id,
            "session_type": "private",
            "topic": "Algebra",
            "scheduled_at": (future_time()).isoformat(),
            "duration_minutes": 60,
            "max_participants": 2,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], "pending")
        self.assertEqual(response.data["host_student"]["username"],
                         self.student.username)

    def test_cannot_book_session_in_the_past(self):
        url = reverse("session-list-create")
        payload = {
            "tutor_id": self.tutor.id,
            "session_type": "private",
            "topic": "Algebra",
            "scheduled_at": (timezone.now() - timedelta(hours=1)).isoformat(),
            "duration_minutes": 60,
            "max_participants": 2,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_can_list_own_sessions(self):
        make_session(self.tutor, self.student)
        url = reverse("session-list-create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_unauthenticated_cannot_book(self):
        self.client.logout()
        url = reverse("session-list-create")
        response = self.client.post(url, {})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SessionCancelTest(APITestCase):
    def setUp(self):
        self.student = make_user("student_cancel", role=1)
        self.tutor = make_user("tutor_cancel", role=3)
        self.session = make_session(self.tutor, self.student, status="pending")
        self.client.force_authenticate(user=self.student)

    def test_student_can_cancel_pending_session(self):
        url = reverse("session-detail", kwargs={"pk": self.session.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "cancelled")

    def test_cannot_cancel_approved_session(self):
        self.session.status = "approved"
        self.session.save()
        url = reverse("session-detail", kwargs={"pk": self.session.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_other_student_cannot_cancel(self):
        other = make_user("other_student", role=1)
        self.client.force_authenticate(user=other)
        url = reverse("session-detail", kwargs={"pk": self.session.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TutorApprovalTest(APITestCase):
    def setUp(self):
        self.student = make_user("student_appr", role=1)
        self.tutor = make_user("tutor_appr", role=3)
        self.session = make_session(self.tutor, self.student, status="pending")
        self.client.force_authenticate(user=self.tutor)

    @patch("apps.sessions.views.daily_client.create_room",
           return_value=("room-123", "https://daily.co/room-123"))
    def test_tutor_can_approve_session(self, mock_create_room):
        url = reverse("session-approve", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "approved")
        self.assertEqual(self.session.daily_room_name, "room-123")
        self.assertEqual(self.session.daily_room_url,
                         "https://daily.co/room-123")

    def test_tutor_can_reject_session(self):
        url = reverse("session-reject", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "rejected")

    def test_cannot_approve_already_approved_session(self):
        self.session.status = "approved"
        self.session.save()
        url = reverse("session-approve", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_approve_session(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("session-approve", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("apps.sessions.views.daily_client.create_room",
           side_effect=Exception("Daily API error"))
    def test_approve_fails_if_daily_room_creation_fails(self, mock_create_room):
        url = reverse("session-approve", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "pending")


class JoinSessionTest(APITestCase):
    def setUp(self):
        self.student = make_user("student_join", role=1)
        self.tutor = make_user("tutor_join", role=3)
        self.session = make_session(self.tutor, self.student,
                                    status="approved")
        self.session.daily_room_name = "room-abc"
        self.session.daily_room_url = "https://daily.co/room-abc"
        self.session.save()

    @patch("apps.sessions.views.daily_client.create_meeting_token",
           return_value="fake-token-tutor")
    def test_tutor_join_sets_session_live(self, mock_token):
        self.client.force_authenticate(user=self.tutor)
        url = reverse("session-join", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["token"], "fake-token-tutor")
        self.assertTrue(response.data["is_owner"])
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "live")

    @patch("apps.sessions.views.daily_client.create_meeting_token",
           return_value="fake-token-student")
    def test_student_can_join_live_session(self, mock_token):
        self.session.status = "live"
        self.session.save()
        self.client.force_authenticate(user=self.student)
        url = reverse("session-join", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["is_owner"])
        self.assertEqual(response.data["room_url"],
                         "https://daily.co/room-abc")

    def test_cannot_join_pending_session(self):
        self.session.status = "pending"
        self.session.save()
        self.client.force_authenticate(user=self.student)
        url = reverse("session-join", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_participant_cannot_join(self):
        stranger = make_user("stranger_join", role=1)
        self.client.force_authenticate(user=stranger)
        url = reverse("session-join", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class EndSessionTest(APITestCase):
    def setUp(self):
        self.student = make_user("student_end", role=1)
        self.tutor = make_user("tutor_end", role=3)
        self.session = make_session(self.tutor, self.student, status="live")
        self.session.daily_room_name = "room-end"
        self.session.save()
        self.client.force_authenticate(user=self.tutor)

    @patch("apps.sessions.views.daily_client.delete_room")
    def test_tutor_can_end_live_session(self, mock_delete):
        url = reverse("session-end", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "completed")
        mock_delete.assert_called_once_with("room-end")

    def test_cannot_end_non_live_session(self):
        self.session.status = "approved"
        self.session.save()
        url = reverse("session-end", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_cannot_end_session(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("session-end", kwargs={"pk": self.session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class GroupSessionTest(APITestCase):
    def setUp(self):
        self.tutor = make_user("tutor_group", role=3)
        self.student1 = make_user("student_g1", role=1)
        self.student2 = make_user("student_g2", role=1)

    def test_tutor_can_create_group_session(self):
        self.client.force_authenticate(user=self.tutor)
        url = reverse("group-session-create")
        payload = {
            "topic": "Group Algebra",
            "scheduled_at": future_time().isoformat(),
            "duration_minutes": 90,
            "max_participants": 5,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["session_type"], "group")

    def test_student_cannot_create_group_session(self):
        self.client.force_authenticate(user=self.student1)
        url = reverse("group-session-create")
        payload = {
            "topic": "Group Algebra",
            "scheduled_at": future_time().isoformat(),
            "duration_minutes": 90,
            "max_participants": 5,
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_can_register_for_group_session(self):
        session = make_session(self.tutor, self.tutor, session_type="group",
                               status="approved")
        session.max_participants = 5
        session.save()
        self.client.force_authenticate(user=self.student1)
        url = reverse("group-session-register", kwargs={"pk": session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SessionParticipant.objects.filter(session=session, student=self.student1).exists())

    def test_student_cannot_register_twice(self):
        session = make_session(self.tutor, self.tutor, session_type="group",
                               status="approved")
        session.max_participants = 5
        session.save()
        SessionParticipant.objects.create(session=session,
                                          student=self.student1)
        self.client.force_authenticate(user=self.student1)
        url = reverse("group-session-register", kwargs={"pk": session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_register_when_session_full(self):
        session = make_session(self.tutor, self.tutor, session_type="group",
                               status="approved")
        session.max_participants = 1
        session.save()
        SessionParticipant.objects.create(session=session,
                                          student=self.student1)
        self.client.force_authenticate(user=self.student2)
        url = reverse("group-session-register", kwargs={"pk": session.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RateSessionTest(APITestCase):
    def setUp(self):
        self.student = make_user("student_rate", role=1)
        self.tutor = make_user("tutor_rate", role=3)
        self.session = make_session(self.tutor, self.student,
                                    status="completed")

    def test_student_can_rate_completed_session(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("session-rate", kwargs={"pk": self.session.pk})
        response = self.client.post(url, {"rating": 5,
                                          "comment": "Great session!"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SessionRating.objects.
                        filter(session=self.session).exists())

    def test_cannot_rate_non_completed_session(self):
        self.session.status = "live"
        self.session.save()
        self.client.force_authenticate(user=self.student)
        url = reverse("session-rate", kwargs={"pk": self.session.pk})
        response = self.client.post(url, {"rating": 4}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_rate_same_session_twice(self):
        SessionRating.objects.create(session=self.session,
                                     student=self.student, rating=4)
        self.client.force_authenticate(user=self.student)
        url = reverse("session-rate", kwargs={"pk": self.session.pk})
        response = self.client.post(url, {"rating": 5}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_participant_cannot_rate(self):
        stranger = make_user("stranger_rate", role=1)
        self.client.force_authenticate(user=stranger)
        url = reverse("session-rate", kwargs={"pk": self.session.pk})
        response = self.client.post(url, {"rating": 3}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TutorAvailabilityTest(APITestCase):
    def setUp(self):
        self.tutor = make_user("tutor_avail", role=3)
        self.client.force_authenticate(user=self.tutor)

    def test_tutor_can_add_availability_slot(self):
        url = reverse("my-availability")
        payload = {"day_of_week": 0,
                   "start_time": "09:00", "end_time": "11:00"}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TutorAvailability.objects.filter
                        (tutor=self.tutor, day_of_week=0).exists())

    def test_tutor_can_delete_availability_slot(self):
        slot = TutorAvailability.objects.create(
            tutor=self.tutor, day_of_week=1,
            start_time="10:00", end_time="12:00"
        )
        url = reverse("my-availability-detail", kwargs={"pk": slot.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(TutorAvailability.objects.filter(pk=slot.pk).exists())

    def test_student_cannot_add_availability(self):
        student = make_user("student_avail", role=1)
        self.client.force_authenticate(user=student)
        url = reverse("my-availability")
        payload = {"day_of_week": 0,
                   "start_time": "09:00", "end_time": "11:00"}
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TutorListViewTest(APITestCase):
    def setUp(self):
        self.student = make_user("student_tlist", role=1)
        self.tutor1 = make_user("tutor_tlist1", role=3)
        self.tutor2 = make_user("tutor_tlist2", role=3)

    def test_authenticated_user_can_list_tutors(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("tutor-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [t["username"] for t in response.data]
        self.assertIn(self.tutor1.username, usernames)
        self.assertIn(self.tutor2.username, usernames)

    def test_inactive_tutor_not_in_list(self):
        self.tutor2.is_active = False
        self.tutor2.save()
        self.client.force_authenticate(user=self.student)
        url = reverse("tutor-list")
        response = self.client.get(url)
        usernames = [t["username"] for t in response.data]
        self.assertNotIn(self.tutor2.username, usernames)

    def test_unauthenticated_cannot_list_tutors(self):
        url = reverse("tutor-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TutorAvailabilityViewTest(APITestCase):
    def setUp(self):
        self.student = make_user("student_tavail", role=1)
        self.tutor = make_user("tutor_tavail", role=3)
        TutorAvailability.objects.create(
            tutor=self.tutor, day_of_week=2,
            start_time="09:00", end_time="11:00"
        )
        TutorAvailability.objects.create(
            tutor=self.tutor, day_of_week=3, start_time="14:00",
            end_time="16:00", is_active=False
        )

    def test_can_view_tutor_availability(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("tutor-availability", kwargs={"tutor_id": self.tutor.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # only active slot

    def test_unauthenticated_cannot_view_availability(self):
        url = reverse("tutor-availability", kwargs={"tutor_id": self.tutor.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TutorPendingSessionsViewTest(APITestCase):
    def setUp(self):
        self.tutor = make_user("tutor_pend", role=3)
        self.student = make_user("student_pend", role=1)
        self.client.force_authenticate(user=self.tutor)

    def test_tutor_can_see_pending_sessions(self):
        make_session(self.tutor, self.student, status="pending")
        make_session(self.tutor, self.student, status="approved")
        url = reverse("tutor-pending")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], "pending")

    def test_student_cannot_access_tutor_pending(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("tutor-pending")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TutorSessionListViewTest(APITestCase):
    def setUp(self):
        self.tutor = make_user("tutor_slist", role=3)
        self.student = make_user("student_slist", role=1)
        self.client.force_authenticate(user=self.tutor)

    def test_tutor_can_list_all_sessions(self):
        make_session(self.tutor, self.student, status="pending")
        make_session(self.tutor, self.student, status="completed")
        url = reverse("tutor-session-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_tutor_can_filter_sessions_by_status(self):
        make_session(self.tutor, self.student, status="pending")
        make_session(self.tutor, self.student, status="completed")
        url = reverse("tutor-session-list") + "?status=completed"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], "completed")

    def test_student_cannot_access_tutor_session_list(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("tutor-session-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TutorSessionStatsViewTest(APITestCase):
    def setUp(self):
        self.tutor = make_user("tutor_stats", role=3)
        self.student = make_user("student_stats", role=1)
        self.client.force_authenticate(user=self.tutor)

    def test_tutor_session_stats_returns_correct_counts(self):
        make_session(self.tutor, self.student, status="pending")
        make_session(self.tutor, self.student, status="live")
        make_session(self.tutor, self.student, status="completed")
        make_session(self.tutor, self.student, session_type="group",
                     status="approved")
        url = reverse("tutor-session-stats")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 4)
        self.assertEqual(response.data["pending"], 1)
        self.assertEqual(response.data["live"], 1)
        self.assertEqual(response.data["completed"], 1)
        self.assertEqual(response.data["group"], 1)

    def test_student_cannot_access_stats(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("tutor-session-stats")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AdminSessionViewTest(APITestCase):
    def setUp(self):
        self.admin = make_user("admin_sess", role=999)
        self.tutor = make_user("tutor_admin", role=3)
        self.student = make_user("student_admin", role=1)
        self.client.force_authenticate(user=self.admin)

    def test_admin_can_list_all_sessions(self):
        make_session(self.tutor, self.student, status="pending")
        make_session(self.tutor, self.student, session_type="group",
                     status="approved")
        url = reverse("admin-session-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_admin_can_filter_by_type(self):
        make_session(self.tutor, self.student, session_type="private",
                     status="pending")
        make_session(self.tutor, self.student, session_type="group",
                     status="pending")
        url = reverse("admin-session-list") + "?type=group"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["session_type"], "group")

    def test_admin_can_filter_by_status(self):
        make_session(self.tutor, self.student, status="pending")
        make_session(self.tutor, self.student, status="completed")
        url = reverse("admin-session-list") + "?status=completed"
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["status"], "completed")

    def test_non_admin_cannot_access_admin_list(self):
        self.client.force_authenticate(user=self.student)
        url = reverse("admin-session-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_session_stats(self):
        make_session(self.tutor, self.student, session_type="private",
                     status="pending")
        make_session(self.tutor, self.student, session_type="group",
                     status="live")
        make_session(self.tutor, self.student, session_type="private",
                     status="completed")
        url = reverse("admin-session-stats")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total"], 3)
        self.assertEqual(response.data["private"], 2)
        self.assertEqual(response.data["group"], 1)
        self.assertEqual(response.data["live"], 1)
        self.assertEqual(response.data["completed"], 1)


class DailyWebhookViewTest(APITestCase):
    def setUp(self):
        self.tutor = make_user("tutor_webhook", role=3)
        self.student = make_user("student_webhook", role=1)
        self.session = make_session(self.tutor, self.student, status="live")
        self.session.daily_room_name = "room-webhook"
        self.session.save()
        self.url = reverse("daily-webhook")

    @patch("apps.sessions.views.daily_client.delete_room")
    def test_meeting_ended_event_completes_session(self, mock_delete):
        payload = {"action": "meeting-ended", "room": {"name": "room-webhook"}}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, "completed")

    def test_recording_started_event(self):
        payload = {"action": "recording-started",
                   "room": {"name": "room-webhook"}}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.recording_status, "recording")

    def test_recording_stopped_event(self):
        payload = {"action": "recording-stopped",
                   "room": {"name": "room-webhook"}}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.recording_status, "processing")

    def test_recording_ready_event(self):
        payload = {
            "action": "recording-ready",
            "room": {"name": "room-webhook"},
            "recordingId": "rec-123",
            "s3Key": "https://s3.example.com/recording.mp4",
        }
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.recording_id, "rec-123")
        self.assertEqual(self.session.recording_url,
                         "https://s3.example.com/recording.mp4")
        self.assertEqual(self.session.recording_status, "finished")

    def test_unknown_room_name_returns_200(self):
        payload = {"action": "meeting-ended", "room": {"name": "unknown-room"}}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_missing_room_name_returns_200(self):
        payload = {"action": "meeting-ended", "room": {}}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
