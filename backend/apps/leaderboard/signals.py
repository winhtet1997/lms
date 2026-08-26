from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from apps.auth.models import User
from apps.course.models import Chapter, DailyQuiz, UserItemProgress

from . import services
from .models import ChapterCompletion, CourseCompletion, DailyLoginRecord, ProfileCompletionAward

STUDENT_ROLE = 1


# ---------------------------------------------------------------------------
# User: registration, profile completion, daily login
# ---------------------------------------------------------------------------


@receiver(pre_save, sender=User)
def _capture_old_user_state(sender, instance, **kwargs):
    if instance.pk:
        old = User.objects.filter(pk=instance.pk).values("is_verified").first()
        instance._old_is_verified = old["is_verified"] if old else False
    else:
        instance._old_is_verified = False


@receiver(post_save, sender=User)
def award_registration_points(sender, instance, created, **kwargs):
    old_is_verified = getattr(instance, "_old_is_verified", False)
    if instance.is_verified and not old_is_verified:
        services.award_points(instance, services.REGISTRATION)


@receiver(post_save, sender=User)
def award_profile_completion_points(sender, instance, created, **kwargs):
    if instance.role != STUDENT_ROLE:
        return
    if not (instance.avatar and instance.dob and instance.gender):
        return
    _, was_created = ProfileCompletionAward.objects.get_or_create(user=instance)
    if was_created:
        services.award_points(instance, services.PROFILE_COMPLETE)


@receiver(post_save, sender=User)
def award_daily_login_points(sender, instance, created, update_fields, **kwargs):
    if instance.role != STUDENT_ROLE:
        return
    if not update_fields or "last_login" not in update_fields:
        return
    _, was_created = DailyLoginRecord.objects.get_or_create(
        user=instance, date=timezone.localdate()
    )
    if was_created:
        services.award_points(instance, services.DAILY_LOGIN)


# ---------------------------------------------------------------------------
# UserItemProgress: item / chapter / course completion
# ---------------------------------------------------------------------------


@receiver(pre_save, sender=UserItemProgress)
def _capture_old_progress_status(sender, instance, **kwargs):
    if instance.pk:
        old = UserItemProgress.objects.filter(pk=instance.pk).values("status").first()
        instance._old_status = old["status"] if old else None
    else:
        instance._old_status = None


@receiver(post_save, sender=UserItemProgress)
def award_item_completion_points(sender, instance, created, **kwargs):
    old_status = getattr(instance, "_old_status", None)
    if instance.status != "completed" or old_status == "completed":
        return

    user = instance.user
    services.award_points(user, services.ITEM_COMPLETE)

    chapters = Chapter.objects.filter(lessons__items=instance.item).distinct()
    for chapter in chapters:
        if chapter.get_chapter_progress(user) == 100:
            _, was_created = ChapterCompletion.objects.get_or_create(
                user=user, chapter=chapter
            )
            if was_created:
                services.award_points(user, services.CHAPTER_COMPLETE)

        course = chapter.course
        if course.get_course_progress(user) == 100:
            _, was_created = CourseCompletion.objects.get_or_create(
                user=user, course=course
            )
            if was_created:
                services.award_points(user, services.COURSE_COMPLETE)


# ---------------------------------------------------------------------------
# DailyQuiz: daily quiz completion
# ---------------------------------------------------------------------------


@receiver(pre_save, sender=DailyQuiz)
def _capture_old_daily_quiz_status(sender, instance, **kwargs):
    if instance.pk:
        old = DailyQuiz.objects.filter(pk=instance.pk).values("status").first()
        instance._old_status = old["status"] if old else None
    else:
        instance._old_status = None


@receiver(post_save, sender=DailyQuiz)
def award_daily_quiz_points(sender, instance, created, **kwargs):
    old_status = getattr(instance, "_old_status", None)
    if instance.status != "completed" or old_status == "completed":
        return
    services.award_points(instance.user, services.DAILY_QUIZ)
