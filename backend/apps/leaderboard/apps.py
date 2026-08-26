from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class LeaderboardConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.leaderboard"
    label = "lms_leaderboard"
    verbose_name = _("Leaderboard")

    def ready(self):
        from . import signals  # noqa
