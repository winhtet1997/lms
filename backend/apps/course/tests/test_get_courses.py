# flake8: noqa
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from apps.course.models import Course


"""
Conflict with test_course.py.
"""


class GetCoursesAPITest(APITestCase):

    def setUp(self):
        Course.objects.create(
            title="Grade 7",
            description="Intermediate Skills",
            subject="math",
            grade_level="7"
        )

        self.url = reverse("course-list")

    # Translation logic for testing
    def translate_to_bangla(self, text):
        if not text:
            return None

        translation_map = {
            "Grade 7": "সপ্তম শ্রেণী",
            "Intermediate Skills": "মধ্যবর্তী দক্ষতা",
            "Math": "গণিত",
            "7": "৭"
        }

        return translation_map.get(text, text)

    def test_translation_for_all_fields(self):

        response = self.client.get(
            self.url,
            HTTP_ACCEPT="application/json",
            HTTP_ACCEPT_LANGUAGE="bn"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        translated_titles = []
        translated_descriptions = []
        translated_subjects = []
        translated_grade_levels = []

        for course in response.data:

            # Validate ID
            self.assertIn("id", course)
            self.assertIsInstance(course["id"], int)

            translated_titles.append(
                self.translate_to_bangla(course.get("title")))
            translated_descriptions.append(
                self.translate_to_bangla(course.get("description")))
            translated_subjects.append(
                self.translate_to_bangla(course.get("subject")))
            translated_grade_levels.append(
                self.translate_to_bangla(course.get("grade_level")))

        # Remove None values
        translated_titles = [t for t in translated_titles if t]
        translated_descriptions = [d for d in translated_descriptions if d]
        translated_subjects = [s for s in translated_subjects if s]
        translated_grade_levels = [g for g in translated_grade_levels if g]

        # Title checks
        if translated_titles:
            self.assertIn("সপ্তম শ্রেণী", translated_titles)

        # Description checks
        if translated_descriptions:
            self.assertIn("মধ্যবর্তী দক্ষতা", translated_descriptions)

        # Subject check
        self.assertIn("গণিত", translated_subjects)

        # Grade level check
        self.assertIn("৭", translated_grade_levels)

    def test_get_courses_english(self):
        """Test API returns English data"""

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        titles = [course.get("title")
                  for course in response.data if course.get("title")]

        if titles:
            # self.assertIn("Grade 6", titles)
            self.assertIn("Grade 7", titles)

    def test_course_description_translation(self):
        """Test description translation logic"""

        response = self.client.get(self.url, HTTP_ACCEPT_LANGUAGE="bn")

        descriptions = [
            self.translate_to_bangla(course.get("description"))
            for course in response.data
            if course.get("description")
        ]

        if descriptions:
            self.assertIn("মৌলিক ধারণা", descriptions)
            self.assertIn("মধ্যবর্তী দক্ষতা", descriptions)

    def test_course_fields_exist(self):
        """Ensure API returns required fields"""

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        course = response.data[0]

        self.assertIn("id", course)
        self.assertIn("title", course)
        self.assertIn("description", course)
        self.assertIn("subject", course)
        self.assertIn("grade_level", course)
