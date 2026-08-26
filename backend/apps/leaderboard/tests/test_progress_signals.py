from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.course.models import Chapter, Course, DailyQuiz, Item, Lesson, Subject, UserItemProgress
from apps.leaderboard import services
from apps.leaderboard.models import PointTransaction, UserPoints

User = get_user_model()


class ProgressCompletionPointsTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="s1", password="x", role=1, is_verified=True
        )
        PointTransaction.objects.all().delete()
        UserPoints.objects.all().delete()

        self.subject = Subject.objects.create(name="Math")
        self.course = Course.objects.create(
            title="Algebra", subject=self.subject, grade_level="6"
        )
        self.chapter = Chapter.objects.create(title="Chapter 1", course=self.course)
        self.lesson = Lesson.objects.create(title="Lesson 1", chapter=self.chapter)
        self.item1 = Item.objects.create(title="Item 1", type="video")
        self.item2 = Item.objects.create(title="Item 2", type="video")
        self.lesson.items.set([self.item1, self.item2])

    def test_item_completion_awards_points(self):
        UserItemProgress.objects.create(
            user=self.student, item=self.item1, progress=100, status="completed"
        )

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.ITEM_COMPLETE
            ).count(),
            1,
        )
        # Chapter/course aren't fully complete yet (item2 still pending).
        self.assertFalse(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.CHAPTER_COMPLETE
            ).exists()
        )
        self.assertFalse(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.COURSE_COMPLETE
            ).exists()
        )

    def test_chapter_and_course_completion_on_last_item(self):
        UserItemProgress.objects.create(
            user=self.student, item=self.item1, progress=100, status="completed"
        )
        UserItemProgress.objects.create(
            user=self.student, item=self.item2, progress=100, status="completed"
        )

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.CHAPTER_COMPLETE
            ).count(),
            1,
        )
        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.COURSE_COMPLETE
            ).count(),
            1,
        )
        self.assertEqual(
            UserPoints.objects.get(user=self.student).total_points,
            300 * 2 + 500 + 1000,
        )

    def test_completion_not_awarded_twice(self):
        progress = UserItemProgress.objects.create(
            user=self.student, item=self.item1, progress=100, status="completed"
        )
        UserItemProgress.objects.create(
            user=self.student, item=self.item2, progress=100, status="completed"
        )

        # Re-saving a row that's already "completed" must not re-trigger any award.
        progress.progress = 100
        progress.save()

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.ITEM_COMPLETE
            ).count(),
            2,
        )
        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.CHAPTER_COMPLETE
            ).count(),
            1,
        )
        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.COURSE_COMPLETE
            ).count(),
            1,
        )


class DailyQuizPointsTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="s1", password="x", role=1, is_verified=True
        )
        PointTransaction.objects.all().delete()
        UserPoints.objects.all().delete()

        self.subject = Subject.objects.create(name="Math")
        self.course = Course.objects.create(
            title="Algebra", subject=self.subject, grade_level="6"
        )

    def test_awarded_on_completion(self):
        quiz = DailyQuiz.objects.create(
            user=self.student,
            course=self.course,
            date=timezone.localdate(),
            status="in_progress",
        )

        quiz.status = "completed"
        quiz.save()

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.DAILY_QUIZ
            ).count(),
            1,
        )
        self.assertEqual(
            UserPoints.objects.get(user=self.student).total_points, 200
        )

    def test_not_awarded_twice(self):
        quiz = DailyQuiz.objects.create(
            user=self.student,
            course=self.course,
            date=timezone.localdate(),
            status="completed",
        )
        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.DAILY_QUIZ
            ).count(),
            1,
        )

        quiz.score = 3
        quiz.save()

        self.assertEqual(
            PointTransaction.objects.filter(
                user=self.student, event_type=services.DAILY_QUIZ
            ).count(),
            1,
        )
