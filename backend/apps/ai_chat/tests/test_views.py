from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.ai_chat.models import ChapterMathAIMapping, ChatThread, CourseMathAIMapping

from .factories import (
    make_chapter,
    make_course,
    make_dashboard_user,
    make_free_enrollment,
    make_paid_enrollment,
    make_user,
)


class AccessCheckViewTest(APITestCase):
    def setUp(self):
        self.url = reverse("ai-chat-access")
        self.course = make_course()
        self.chapter = make_chapter(self.course)

    def test_unauthenticated_denied(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_global_always_allowed(self):
        user = make_user("student")
        self.client.force_authenticate(user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["allowed"])
        self.assertIsNone(response.data["course_id"])

    def test_course_scope_denied_without_enrollment(self):
        user = make_user("student")
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"course_id": self.course.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_course_scope_denied_with_free_enrollment(self):
        user = make_user("student")
        make_free_enrollment(user, self.course)
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"course_id": self.course.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_course_scope_400_when_unmapped(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"course_id": self.course.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_course_scope_allowed_with_paid_enrollment(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        CourseMathAIMapping.objects.create(course=self.course, mathai_subject_id="subj-1")
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"course_id": self.course.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["allowed"])

    def test_course_scope_allowed_for_dashboard_user(self):
        user = make_dashboard_user("dash")
        CourseMathAIMapping.objects.create(course=self.course, mathai_subject_id="subj-1")
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"course_id": self.course.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_course_scope_404_for_unknown_course(self):
        user = make_user("student")
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"course_id": 999999})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_chapter_scope_denied_without_enrollment_even_on_free_preview(self):
        """Key regression test for rule 2: is_free_preview never bypasses
        the enrollment requirement for AI chat."""
        preview_chapter = make_chapter(self.course, is_free_preview=True)
        user = make_user("student")
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"chapter_id": preview_chapter.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_chapter_scope_400_when_unmapped(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"chapter_id": self.chapter.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_chapter_scope_allowed_when_mapped_and_enrolled(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        ChapterMathAIMapping.objects.create(chapter=self.chapter, mathai_lesson_id="lesson-1")
        self.client.force_authenticate(user)
        response = self.client.get(self.url, {"chapter_id": self.chapter.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class StartThreadViewTest(APITestCase):
    def setUp(self):
        self.url = reverse("ai-chat-thread-start")
        self.course = make_course()
        self.chapter = make_chapter(self.course)

    def test_global_scope_creates_thread_for_any_authenticated_user(self):
        user = make_user("student")
        self.client.force_authenticate(user)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["scope"], "global")
        self.assertEqual(ChatThread.objects.get().scope, "global")

    def test_global_scope_resumes_existing_thread_by_default(self):
        user = make_user("student")
        self.client.force_authenticate(user)
        first = self.client.post(self.url, {}, format="json").data
        second = self.client.post(self.url, {}, format="json")
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(second.data["id"], first["id"])

    def test_global_scope_new_chat_creates_fresh_thread(self):
        user = make_user("student")
        self.client.force_authenticate(user)
        first = self.client.post(self.url, {}, format="json").data
        second = self.client.post(self.url, {"new_chat": True}, format="json")
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(second.data["id"], first["id"])

    def test_course_scope_denied_without_enrollment(self):
        user = make_user("student")
        self.client.force_authenticate(user)
        response = self.client.post(self.url, {"course_id": self.course.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_course_scope_allowed_with_enrollment(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        CourseMathAIMapping.objects.create(course=self.course, mathai_subject_id="subj-1")
        self.client.force_authenticate(user)
        response = self.client.post(self.url, {"course_id": self.course.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        thread = ChatThread.objects.get()
        self.assertEqual(thread.scope, "course")
        self.assertEqual(thread.mathai_subject_id, "subj-1")

    def test_course_scope_400_when_unmapped(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        self.client.force_authenticate(user)
        response = self.client.post(self.url, {"course_id": self.course.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_course_scope_explicit_subject_id_bypasses_missing_mapping(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        self.client.force_authenticate(user)
        response = self.client.post(
            self.url,
            {"course_id": self.course.id, "subject_id": "manual-subj"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        thread = ChatThread.objects.get()
        self.assertEqual(thread.mathai_subject_id, "manual-subj")

    def test_chapter_id_takes_priority_over_course_and_subject(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        ChapterMathAIMapping.objects.create(chapter=self.chapter, mathai_lesson_id="lesson-1")
        self.client.force_authenticate(user)
        response = self.client.post(
            self.url,
            {"chapter_id": self.chapter.id, "course_id": 999999, "subject_id": "ignored"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        thread = ChatThread.objects.get()
        self.assertEqual(thread.scope, "lesson")
        self.assertEqual(thread.chapter_id, self.chapter.id)
        self.assertEqual(thread.mathai_lesson_id, "lesson-1")

    def test_chapter_scope_denied_without_enrollment(self):
        user = make_user("student")
        self.client.force_authenticate(user)
        response = self.client.post(self.url, {"chapter_id": self.chapter.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_chapter_scope_400_when_unmapped(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        self.client.force_authenticate(user)
        response = self.client.post(self.url, {"chapter_id": self.chapter.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ThreadListViewTest(APITestCase):
    def setUp(self):
        self.url = reverse("ai-chat-thread-list")
        self.user = make_user("student")
        self.other = make_user("other")

    def test_lists_only_own_threads_with_a_started_chat(self):
        ChatThread.objects.create(user=self.user, scope="global", mathai_chat_id="c1")
        ChatThread.objects.create(user=self.user, scope="global", mathai_chat_id=None)  # never sent
        ChatThread.objects.create(user=self.other, scope="global", mathai_chat_id="c2")
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_excludes_archived(self):
        ChatThread.objects.create(
            user=self.user, scope="global", mathai_chat_id="c1", is_archived=True
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 0)

    def test_no_filter_defaults_to_global_scope_only(self):
        course = make_course()
        ChatThread.objects.create(user=self.user, scope="global", mathai_chat_id="c1")
        ChatThread.objects.create(
            user=self.user, scope="course", course=course, mathai_chat_id="c2"
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["scope"], "global")

    def test_chapter_filter(self):
        course = make_course()
        chapter = make_chapter(course)
        other_chapter = make_chapter(course, title="Other")
        ChatThread.objects.create(
            user=self.user, scope="lesson", chapter=chapter, mathai_chat_id="c1"
        )
        ChatThread.objects.create(
            user=self.user, scope="lesson", chapter=other_chapter, mathai_chat_id="c2"
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(self.url, {"chapter_id": chapter.id})
        self.assertEqual(len(response.data), 1)


class ThreadDetailViewTest(APITestCase):
    def test_delete_archives_own_thread(self):
        user = make_user("student")
        thread = ChatThread.objects.create(user=user, scope="global", mathai_chat_id="c1")
        self.client.force_authenticate(user)
        response = self.client.delete(reverse("ai-chat-thread-detail", args=[thread.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        thread.refresh_from_db()
        self.assertTrue(thread.is_archived)

    def test_delete_other_users_thread_404s(self):
        user = make_user("student")
        other = make_user("other")
        thread = ChatThread.objects.create(user=other, scope="global", mathai_chat_id="c1")
        self.client.force_authenticate(user)
        response = self.client.delete(reverse("ai-chat-thread-detail", args=[thread.id]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


CHAT_DETAIL_RESULT = {
    "data": {
        "chat": {"id": "chat-123"},
        "messages": [
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "Hello! How can I help?"},
        ],
    }
}


class ThreadMessageViewTest(APITestCase):
    def setUp(self):
        self.user = make_user("student")
        self.course = make_course()
        self.thread = ChatThread.objects.create(user=self.user, scope="global")
        self.client.force_authenticate(self.user)

    def _url(self, thread_id):
        return reverse("ai-chat-thread-messages", args=[thread_id])

    def test_get_empty_history_before_first_message(self):
        response = self.client.get(self._url(self.thread.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    @patch("apps.ai_chat.mathai_client.get_chat_detail", return_value=CHAT_DETAIL_RESULT)
    @patch(
        "apps.ai_chat.mathai_client.create_chat",
        return_value={"data": {"chat_id": "chat-123"}},
    )
    def test_first_message_creates_chat(self, mock_create, mock_get_detail):
        response = self.client.post(self._url(self.thread.id), {"message": "hi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reply"], "Hello! How can I help?")
        mock_create.assert_called_once()
        self.thread.refresh_from_db()
        self.assertEqual(self.thread.mathai_chat_id, "chat-123")

    @patch("apps.ai_chat.mathai_client.get_chat_detail", return_value=CHAT_DETAIL_RESULT)
    @patch("apps.ai_chat.mathai_client.send_message", return_value={})
    def test_subsequent_message_continues_chat(self, mock_send, mock_get_detail):
        self.thread.mathai_chat_id = "chat-123"
        self.thread.save(update_fields=["mathai_chat_id"])
        response = self.client.post(
            self._url(self.thread.id), {"message": "more"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send.assert_called_once()

    def test_other_users_thread_404s(self):
        other = make_user("other")
        other_thread = ChatThread.objects.create(user=other, scope="global")
        response = self.client.get(self._url(other_thread.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_course_scope_send_blocked_without_enrollment(self):
        course_thread = ChatThread.objects.create(
            user=self.user, scope="course", course=self.course
        )
        response = self.client.post(
            self._url(course_thread.id), {"message": "hi"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_course_scope_get_blocked_without_enrollment(self):
        course_thread = ChatThread.objects.create(
            user=self.user, scope="course", course=self.course, mathai_chat_id="chat-1"
        )
        response = self.client.get(self._url(course_thread.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_global_scope_never_blocked_by_enrollment(self):
        response = self.client.get(self._url(self.thread.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch("apps.ai_chat.mathai_client.create_chat", side_effect=Exception("should not be called"))
    def test_course_scope_allowed_with_paid_enrollment(self, mock_create):
        make_paid_enrollment(self.user, self.course)
        course_thread = ChatThread.objects.create(
            user=self.user, scope="course", course=self.course, mathai_chat_id="chat-1"
        )
        with patch(
            "apps.ai_chat.mathai_client.get_chat_detail", return_value=CHAT_DETAIL_RESULT
        ), patch("apps.ai_chat.mathai_client.send_message", return_value={}):
            response = self.client.post(
                self._url(course_thread.id), {"message": "hi"}, format="json"
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_create.assert_not_called()
