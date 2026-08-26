from django.test import TestCase

from apps.ai_chat.access import has_course_chat_access, has_dashboard_bypass

from .factories import (
    make_course,
    make_dashboard_user,
    make_expired_enrollment,
    make_free_enrollment,
    make_paid_enrollment,
    make_user,
)


class HasDashboardBypassTest(TestCase):
    def test_true_for_dashboard_user(self):
        user = make_dashboard_user("dash")
        self.assertTrue(has_dashboard_bypass(user))

    def test_false_for_plain_student(self):
        user = make_user("student")
        self.assertFalse(has_dashboard_bypass(user))

    def test_false_for_none(self):
        self.assertFalse(has_dashboard_bypass(None))


class HasCourseChatAccessTest(TestCase):
    def setUp(self):
        self.course = make_course()

    def test_no_enrollment_denied(self):
        user = make_user("student")
        self.assertFalse(has_course_chat_access(user, self.course))

    def test_free_plan_enrollment_denied(self):
        user = make_user("student")
        make_free_enrollment(user, self.course)
        self.assertFalse(has_course_chat_access(user, self.course))

    def test_active_paid_enrollment_allowed(self):
        user = make_user("student")
        make_paid_enrollment(user, self.course)
        self.assertTrue(has_course_chat_access(user, self.course))

    def test_expired_paid_enrollment_denied(self):
        user = make_user("student")
        make_expired_enrollment(user, self.course)
        self.assertFalse(has_course_chat_access(user, self.course))

    def test_dashboard_bypass_with_zero_enrollment(self):
        user = make_dashboard_user("dash")
        self.assertTrue(has_course_chat_access(user, self.course))

    def test_none_course_denied(self):
        user = make_user("student")
        self.assertFalse(has_course_chat_access(user, None))

    def test_unauthenticated_denied(self):
        from django.contrib.auth.models import AnonymousUser

        self.assertFalse(has_course_chat_access(AnonymousUser(), self.course))
