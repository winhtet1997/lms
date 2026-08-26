from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class SessionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sessions"
    label = "lms_sessions"
    verbose_name = _("Sessions")
