# flake8: noqa
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.course import models

"""
Conflict with test_get_courses.py.
"""

"""
class CourseDetailApiTest(APITestCase):

    def setUp(self):
        self.course = models.Course.objects.create(
            subject="math", grade_level="6"
        )

        self.languages = ["en", "bn"]
        self.subject_translations = {
            "en": "Math",
            "bn": "গণিত",
        }

        self.grade_translations = {
            "en": "6",
            "bn": "৬",
        }
        self.translations = {
            "en": (
                "Grade 6 Mathematics",
                "Choose a chapter to begin your learning journey."
            ),
            "bn": ("গণিত কোর্স", "শেখা শুরু করুন"),
        }

        for lang_code, (title, desc) in self.translations.items():
            self.course.set_current_language(lang_code)
            self.course.title = title
            self.course.description = desc
            self.course.save()

        self.icon = models.ChapterIcon.objects.create(
            name="Test Icon")

        self.chapters = []
        chapter_data = [
            {
                "en": ("Introduction", "Grade 6 Mathematics"),
                "bn": ("ভূমিকা", "৬ষ্ঠ শ্রেণির গণিত"),
            },
            {
                "en": ("Algebra", "Basic Algebra"),
                "bn": ("বীজগণিত", "প্রাথমিক বীজগণিত"),
            },
        ]
        for c_data in chapter_data:
            chapter = models.Chapter.objects.create(
                course=self.course, icon=self.icon
            )
            for lang_code in self.languages:
                title, desc = c_data[lang_code]
                chapter.set_current_language(lang_code)
                chapter.title = title
                chapter.description = desc
                chapter.save()
            self.chapters.append(chapter)

        self.url = reverse("course-detail", args=[self.course.id])

    def test_get_course_success(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.course.id)

    def test_get_course_invalid_id(self):
        url = reverse("course-detail", args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_course_response_structure(self):
        response = self.client.get(self.url)
        self.assertIn("id", response.data)
        self.assertIn("title", response.data)
        self.assertIn("description", response.data)
        self.assertIn("subject", response.data)
        self.assertIn("grade_level", response.data)
        self.assertIn("chapters", response.data)

    def test_chapters_exist_and_match_db(self):
        response = self.client.get(self.url)
        chapters = response.data["chapters"]
        expected_count = (
            models.Chapter.objects.filter(course=self.course).count()
        )
        self.assertEqual(len(chapters), expected_count)

    def test_all_chapters_structure(self):
        response = self.client.get(self.url)
        chapters = response.data["chapters"]
        for chapter in chapters:
            self.assertIn("id", chapter)
            self.assertIn("title", chapter)
            self.assertIn("description", chapter)
            self.assertIn("svg", chapter)

    def test_course_language_responses_dynamic(self):

        for lang_code in self.languages:
            response = self.client.get(
                self.url, HTTP_ACCEPT_LANGUAGE=lang_code
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            expected_title = (
                self.course.safe_translation_getter(
                    'title', language_code=lang_code
                )
            )
            expected_description = (
                self.course.safe_translation_getter(
                    'description', language_code=lang_code
                )
            )
            expected_subject = self.subject_translations[lang_code]
            expected_grade = self.grade_translations[lang_code]

            self.assertEqual(response.data["title"], expected_title)
            self.assertEqual(
                response.data["description"], expected_description
            )
            self.assertEqual(response.data["subject"], expected_subject)
            self.assertEqual(response.data["grade_level"], expected_grade)

    def test_chapters_language_responses_dynamic(self):

        for lang_code in self.languages:
            response = self.client.get(
                self.url, HTTP_ACCEPT_LANGUAGE=lang_code
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)

            chapter_titles = [
                c["title"] for c in response.data["chapters"]
            ]
            chapter_descriptions = [
                c["description"] for c in response.data["chapters"]
            ]
            chapter_svgs = [
                c["svg"] for c in response.data["chapters"]
            ]

            expected_titles = [
                c.safe_translation_getter('title', language_code=lang_code)
                for c in self.chapters
            ]
            expected_descriptions = [
                c.safe_translation_getter(
                    'description', language_code=lang_code
                )
                for c in self.chapters
            ]
            expected_svgs = [
                c.icon.svg if c.icon else None for c in self.chapters]

            self.assertEqual(chapter_titles, expected_titles)
            self.assertEqual(chapter_descriptions, expected_descriptions)
            self.assertEqual(chapter_svgs, expected_svgs)

    def test_invalid_language_fallback(self):

        response = self.client.get(
            self.url, HTTP_ACCEPT_LANGUAGE="xyz"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_title = self.course.safe_translation_getter(
            'title', language_code='en'
        )
        expected_description = self.course.safe_translation_getter(
            'description', language_code='en'
        )
        expected_subject = self.subject_translations['en']
        expected_grade = self.grade_translations['en']

        self.assertEqual(response.data["title"], expected_title)
        self.assertEqual(response.data["description"], expected_description)
        self.assertEqual(response.data["subject"], expected_subject)
        self.assertEqual(response.data["grade_level"], expected_grade)

        chapter_titles = [c["title"] for c in response.data["chapters"]]
        chapter_descriptions = [
            c["description"] for c in response.data["chapters"]
        ]
        chapter_svgs = [c["svg"] for c in response.data["chapters"]]

        expected_titles = [
            c.safe_translation_getter('title', language_code='en')
            for c in self.chapters
        ]
        expected_descriptions = [
            c.safe_translation_getter('description', language_code='en')
            for c in self.chapters
        ]
        expected_svgs = [
            c.icon.svg if c.icon else None for c in self.chapters
        ]

        self.assertEqual(chapter_titles, expected_titles)
        self.assertEqual(chapter_descriptions, expected_descriptions)
        self.assertEqual(chapter_svgs, expected_svgs)
"""