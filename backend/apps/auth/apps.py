from django.apps import AppConfig
from django.db.models.signals import post_migrate
from django.utils.translation import gettext_lazy as _


class AuthConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.auth"
    label = "lms_auth"
    verbose_name = _("Authentication")

    def ready(self):
        post_migrate.connect(create_user, sender=self)
        from . import signals  # noqa


def create_user(sender, app_config, **kwargs):
    if app_config.label != "lms_auth":
        return

    User = app_config.get_model("User")

    if User.objects.exists():
        return

    admin, admin_created = User.objects.get_or_create(
        username="admin",
        email="admin@lms.com",
        role=999,
        is_staff=True,
        is_superuser=True,
        is_active=True,
        is_verified=True,
    )
    admin.set_password("admin")
    admin.save()

    if admin_created:
        print("Superadmin created")

    student, student_created = User.objects.get_or_create(
        full_name="Tom",
        username="student1",
        email="student1@test.com",
        role=1,
        is_verified=True,
        grade_level="6"
    )
    student.set_password("student")
    student.save()

    if student_created:
        print("Student created")

    parent, parent_created = User.objects.get_or_create(
        full_name="Bob",
        username="parent1",
        email="parent1@test.com",
        role=2,
        is_verified=True,
    )
    parent.set_password("parent")
    parent.save()

    if parent_created:
        print("Parent created")

    tutor, tutor_created = User.objects.get_or_create(
        full_name="David",
        username="tutor1",
        email="tutor1@test.com",
        role=3,
        is_verified=True,
    )
    tutor.set_password("tutor")
    tutor.save()

    if tutor_created:
        print("Tutor created")


