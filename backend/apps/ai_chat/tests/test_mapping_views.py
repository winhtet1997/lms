from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.ai_chat.models import ChapterMathAIMapping, CourseMathAIMapping

from .factories import make_chapter, make_course, make_mapping_admin, make_user


class CourseMappingViewsTest(APITestCase):
    def setUp(self):
        self.list_url = reverse("ai-chat-course-mappings")
        self.course = make_course(grade_level="6")

    def _detail_url(self, course_id):
        return reverse("ai-chat-course-mapping-detail", args=[course_id])

    def test_list_requires_permission(self):
        self.client.force_authenticate(make_user("student"))
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_reports_null_for_unmapped_course(self):
        self.client.force_authenticate(make_mapping_admin("mapping_admin"))
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        row = next(r for r in response.data if r["course_id"] == self.course.id)
        self.assertIsNone(row["mathai_subject_id"])

    def test_patch_creates_then_get_reflects_it(self):
        admin = make_mapping_admin("mapping_admin")
        self.client.force_authenticate(admin)
        response = self.client.patch(
            self._detail_url(self.course.id), {"mathai_subject_id": "subj-1"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            CourseMathAIMapping.objects.get(course=self.course).mathai_subject_id, "subj-1"
        )

        listing = self.client.get(self.list_url)
        row = next(r for r in listing.data if r["course_id"] == self.course.id)
        self.assertEqual(row["mathai_subject_id"], "subj-1")

    def test_patch_overwrites_existing_mapping(self):
        CourseMathAIMapping.objects.create(course=self.course, mathai_subject_id="old")
        self.client.force_authenticate(make_mapping_admin("mapping_admin"))
        self.client.patch(
            self._detail_url(self.course.id), {"mathai_subject_id": "new"}, format="json"
        )
        self.assertEqual(
            CourseMathAIMapping.objects.get(course=self.course).mathai_subject_id, "new"
        )

    def test_delete_clears_mapping(self):
        CourseMathAIMapping.objects.create(course=self.course, mathai_subject_id="subj-1")
        self.client.force_authenticate(make_mapping_admin("mapping_admin"))
        response = self.client.delete(self._detail_url(self.course.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CourseMathAIMapping.objects.filter(course=self.course).exists())

    def test_patch_requires_permission(self):
        self.client.force_authenticate(make_user("student"))
        response = self.client.patch(
            self._detail_url(self.course.id), {"mathai_subject_id": "subj-1"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ChapterMappingViewsTest(APITestCase):
    def setUp(self):
        self.list_url = reverse("ai-chat-chapter-mappings")
        self.course = make_course()
        self.chapter = make_chapter(self.course)

    def _detail_url(self, chapter_id):
        return reverse("ai-chat-chapter-mapping-detail", args=[chapter_id])

    def test_list_requires_course_id(self):
        self.client.force_authenticate(make_mapping_admin("mapping_admin"))
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_reports_null_subject_id_for_unmapped_course(self):
        self.client.force_authenticate(make_mapping_admin("mapping_admin"))
        response = self.client.get(self.list_url, {"course_id": self.course.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["mathai_subject_id"])
        chapter_row = next(
            c for c in response.data["chapters"] if c["chapter_id"] == self.chapter.id
        )
        self.assertEqual(chapter_row["mathai_lesson_id"], "")

    def test_list_includes_course_subject_id_once_mapped(self):
        CourseMathAIMapping.objects.create(course=self.course, mathai_subject_id="subj-1")
        self.client.force_authenticate(make_mapping_admin("mapping_admin"))
        response = self.client.get(self.list_url, {"course_id": self.course.id})
        self.assertEqual(response.data["mathai_subject_id"], "subj-1")

    def test_patch_creates_then_list_reflects_it(self):
        self.client.force_authenticate(make_mapping_admin("mapping_admin"))
        response = self.client.patch(
            self._detail_url(self.chapter.id), {"mathai_lesson_id": "lesson-1"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            ChapterMathAIMapping.objects.get(chapter=self.chapter).mathai_lesson_id,
            "lesson-1",
        )

    def test_delete_clears_mapping(self):
        ChapterMathAIMapping.objects.create(chapter=self.chapter, mathai_lesson_id="lesson-1")
        self.client.force_authenticate(make_mapping_admin("mapping_admin"))
        response = self.client.delete(self._detail_url(self.chapter.id))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ChapterMathAIMapping.objects.filter(chapter=self.chapter).exists())

    def test_requires_permission(self):
        self.client.force_authenticate(make_user("student"))
        response = self.client.get(self.list_url, {"course_id": self.course.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
