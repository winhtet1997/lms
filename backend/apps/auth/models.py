from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import secrets
import string


USER_ROLES = [
    (0, _("Guest")),
    (1, _("Student")),
    (2, _("Parent")),
    (3, _("Tutor")),
    (4, _("Admin")),
    (999, _("Superadmin")),
]

OTP_TYPE = [
    (0, _("Reset")),
    (1, _("Verify")),
]


GRADE_LEVELS = [
    ("6", _("6")),
    ("7", _("7")),
    ("8", _("8")),
    ("9", _("9")),
    ("10", _("10")),
    ("11", _("11")),
    ("12", _("12")),
]

GENDER_CHOICES = [
    ("male", _("Male")),
    ("female", _("Female")),
    ("other", _("Other")),
]

def _get_upload_folder(instance, file_name):
    return f"users/{instance.id}/{file_name}"


class User(AbstractUser):
    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")

    full_name = models.CharField(max_length=127, blank=True, null=True,
                                 verbose_name=_("full name"))
    groups = models.ManyToManyField("auth.Group", related_name="lms_users",
                                    blank=True)
    user_permissions = models.ManyToManyField(
        "auth.Permission", related_name="lms_users", blank=True
    )
    role = models.IntegerField(
        default=USER_ROLES[0][0],
        choices=USER_ROLES,
        db_index=True,
        verbose_name=_("role"),
    )
    grade_level = models.CharField(
        max_length=15, choices=GRADE_LEVELS, blank=True, null=True
    )
    email = models.EmailField(_("email address"), blank=True, null=True,
                              unique=True)
    phone = models.CharField(_("phone number"), max_length=15, blank=True,
                             null=True)
    is_verified = models.BooleanField(default=False,
                                      verbose_name=_("is verified"))
    google_id = models.CharField(max_length=255, blank=True, null=True,
                                 unique=True, verbose_name=_("google id"))
    avatar = models.ImageField(upload_to=_get_upload_folder, blank=True, null=True,
                               verbose_name=_("avatar"))
    dob = models.DateField(blank=True, null=True,
                           verbose_name=_("date of birth"))
    gender = models.CharField(
        max_length=15, choices=GENDER_CHOICES, blank=True, null=True,
        verbose_name=_("gender"),
    )
    parent = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="children", limit_choices_to={"role": 2},
        verbose_name=_("parent"),
    )

    def get_all_permissions(self, obj=None):
        perms = super().get_all_permissions(obj)
        if not hasattr(self, "_custom_group_perm_cache"):
            self._custom_group_perm_cache = set()
            qs = (
                CustomGroupMembership.objects
                .filter(user=self)
                .prefetch_related("group__permissions__content_type")
            )
            for membership in qs:
                for perm in membership.group.permissions.all():
                    ct = perm.content_type
                    self._custom_group_perm_cache.add(
                        f"{ct.app_label}.{perm.codename}"
                    )
        return perms | self._custom_group_perm_cache


class UserDashboard(models.Model):
    """Proxy model used as a ContentType anchor for dashboard permissions.
    Permissions are created via the assign_permissions management command."""
    class Meta:
        managed = False
        default_permissions = ()
        verbose_name = _("user_dashboard")
        verbose_name_plural = _("user_dashboards")


class CustomGroup(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.CharField(max_length=500, blank=True)
    permissions = models.ManyToManyField(
        "auth.Permission", blank=True, related_name="custom_groups"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("custom group")
        verbose_name_plural = _("custom groups")


class CustomGroupMembership(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="custom_group_memberships"
    )
    group = models.ForeignKey(
        CustomGroup, on_delete=models.CASCADE, related_name="memberships"
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "group")


class UserOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE,
                             related_name="otp")
    code = models.CharField(max_length=4)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_valid = models.BooleanField(default=True)
    type = models.IntegerField(
        default=OTP_TYPE[0][0],
        choices=OTP_TYPE,
        db_index=True,
        verbose_name=_("type"),
    )

    def is_expired(self):
        return timezone.now() > self.expires_at

    @staticmethod
    def generate_otp(length=4):
        return ''.join(secrets.choice(string.digits) for _ in range(length))

    def __str__(self):
        return f"{self.code}-{self.user.username}"
