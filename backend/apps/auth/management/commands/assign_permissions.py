from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from apps.auth.models import UserDashboard
from apps.course.models import CourseDashboard
from apps.sessions.models import SessionDashboard
from apps.billing.models import BillingDashboard
from apps.ai_chat.models import AiChatDashboard

# Role-based group permissions 
GROUP_PERMISSIONS = {
    "Tutor": [
        ("lms_auth", "view_dashboard"),

        ("lms_auth", "view_user"),

        ("lms_course", "view_course"),
        ("lms_course", "edit_course"),
        ("lms_course", "create_course"),
        
        ("lms_course", "view_item"),
        ("lms_course", "edit_item"),
        ("lms_course", "create_item"),

        ("lms_course", "view_daily_quiz"),

        ("lms_sessions", "view_session"),
        ("lms_sessions", "edit_session"),
        ("lms_sessions", "create_session"),
        ("lms_sessions", "delete_session"),

        ("lms_billing", "view_subscription_plan"),
        ("lms_billing", "edit_subscription_plan"),
    ],
    "Student": [
        ("lms_course", "view_course"),
    ],
    "Parent": [
        ("lms_course", "view_course"),

        ("lms_course", "view_item"),
    ],
    "Admin": [
        ("lms_billing", "view_enrollment"),
        ("lms_billing", "create_enrollment"),
        ("lms_billing", "edit_enrollment"),
        ("lms_billing", "delete_enrollment"),

        ("lms_billing", "view_subscription_plan"),
        ("lms_billing", "edit_subscription_plan"),

        ("lms_billing", "view_payment_transaction"),

        ("lms_ai_chat", "manage_mathai_mapping"),
    ],
}

# ── Custom permissions (no migrations needed — add entries here and re-run) ──
# Format: (model_class, codename, human-readable name)
CUSTOM_PERMISSIONS = [
    (UserDashboard, "view_dashboard", "View dashboard"),

    (UserDashboard, "view_user", "View Users"),
    (UserDashboard, "create_user", "Create Users"),
    (UserDashboard, "edit_user", "Edit Users"),
    (UserDashboard, "delete_user", "Delete Users"),

    # (UserDashboard, "view_permissions", "View Permissions"),

    (CourseDashboard, "view_course", "View Courses"),
    (CourseDashboard, "create_course", "Create Courses"),
    (CourseDashboard, "edit_course", "Edit Courses"),
    (CourseDashboard, "delete_course", "Delete Courses"),
    (CourseDashboard, "can_change_course_status", "Change Course Publication Status"),

    (CourseDashboard, "view_item", "View Items"),
    (CourseDashboard, "create_item", "Create Items"),
    (CourseDashboard, "edit_item", "Edit Items"),
    (CourseDashboard, "delete_item", "Delete Items"),
    (CourseDashboard, "can_change_item_status", "Can change Item Publication Status"),

    (CourseDashboard, "view_daily_quiz", "View Daily quiz"),
    (CourseDashboard, "create_daily_quiz", "Create Daily quizzes"),

    (SessionDashboard, "view_session", "View Sessions"),
    (SessionDashboard, "approve_session", "Approve Sessions"),
    # (SessionDashboard, "edit_session", "Edit Sessions"),
    # (SessionDashboard, "delete_session", "Delete Sessions"),

    (BillingDashboard, "view_enrollment", "View Enrollments"),
    (BillingDashboard, "create_enrollment", "Create Enrollments"),
    (BillingDashboard, "edit_enrollment", "Edit Enrollments"),
    (BillingDashboard, "delete_enrollment", "Delete Enrollments"),

    (BillingDashboard, "view_subscription_plan", "View Subscription Plans"),
    (BillingDashboard, "edit_subscription_plan", "Edit Subscription Plans"),

    (BillingDashboard, "view_payment_transaction", "View Payment Transactions"),

    (AiChatDashboard, "manage_mathai_mapping", "Manage Math AI Mapping"),
]


class Command(BaseCommand):
    help = "Create custom permissions and assign permissions to role-based groups"

    def handle(self, *args, **kwargs):
        self._create_custom_permissions()
        self._assign_group_permissions()

    def _create_custom_permissions(self):
        live_ids = []

        for model_class, codename, name in CUSTOM_PERMISSIONS:
            ct = ContentType.objects.get_for_model(model_class)
            # Clean up same codename on a wrong ContentType (renamed anchor model).
            Permission.objects.filter(
                codename=codename, content_type__app_label=ct.app_label
            ).exclude(content_type=ct).delete()

            perm, created = Permission.objects.get_or_create(
                codename=codename,
                content_type=ct,
                defaults={"name": name},
            )
            live_ids.append(perm.id)
            self.stdout.write(
                f"  Permission '{codename}': {'created' if created else 'already exists'}"
            )

        # Remove dashboard permissions that are no longer in CUSTOM_PERMISSIONS.
        # This keeps CustomGroup assignments for unchanged permissions intact.
        deleted, _ = (
            Permission.objects
            .filter(content_type__model__endswith="dashboard")
            .exclude(id__in=live_ids)
            .delete()
        )
        if deleted:
            self.stdout.write(
                self.style.WARNING(f"  Removed {deleted} obsolete dashboard permission(s)")
            )

        self.stdout.write(self.style.SUCCESS("Custom permissions done."))

    def _assign_group_permissions(self):
        for group_name, perm_tuples in GROUP_PERMISSIONS.items():
            group, _ = Group.objects.get_or_create(name=group_name)
            perms = []
            for app_label, codename in perm_tuples:
                try:
                    perm = Permission.objects.get(
                        content_type__app_label=app_label,
                        codename=codename,
                    )
                    perms.append(perm)
                except Permission.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  Permission not found: {app_label}.{codename}"
                        )
                    )
            group.permissions.set(perms)
            self.stdout.write(
                self.style.SUCCESS(f"  {group_name}: assigned {len(perms)} permissions")
            )
