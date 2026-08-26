# Course Enrollment & Subscription — Implementation Plan

Status: planning
Payment gateway: not yet chosen — this phase builds the enrollment/access-control
structure only. `Enrollment.is_active` is flipped manually via Django admin until a
gateway is wired in.

## 1. Product rules (confirmed)

- Any **logged-in** user can view chapters flagged as free preview. Anonymous users
  see the course catalog/detail (title, description, chapter list) but not chapter
  content, same as today.
- Free-preview is a **per-chapter flag** (`Chapter.is_free_preview`), not a hardcoded
  "first two chapters" rule. As a one-time backfill, the first two chapters (by
  `priority_index`) of every existing course will be flagged free so current content
  doesn't regress; admins/tutors can change the flag per chapter afterwards.
- Subscriptions are **course-based**: one `Enrollment` links one `User` to one
  `Course`. Buying access to 5 courses means 5 `Enrollment` rows.
- Two plan types per course: `monthly` and `yearly`, each with its own price.
- `Enrollment.is_active` starts `False`. For now it is flipped to `True` manually in
  Django admin (standing in for a successful payment). It is flipped back to `False`
  lazily — the first time a user tries to read gated content after `expires_at` has
  passed, not via a cron job.

## 2. Backend data model

### 2.1 `apps/course/models.py` — add one field

```python
class Chapter(TranslatableModel):
    ...
    is_free_preview = models.BooleanField(default=False)
```

Migration: add the field, then a data migration that sets `is_free_preview=True` on
the first two chapters (ordered by `priority_index`) of every existing `Course`.

### 2.2 New app: `apps/billing`

Follows the existing per-domain app convention (`apps/course`, `apps/auth`,
`apps/sessions`): own `models.py`, `serializers.py`, `views.py` (plain `APIView`
subclasses, no routers), `permissions.py`, `urls.py`, `admin.py`, `apps.py` with an
explicit `label = "lms_billing"`.

```python
# apps/billing/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone
from apps.course.models import Course

PLAN_TYPES = [("monthly", "Monthly"), ("yearly", "Yearly")]

class BillingDashboard(models.Model):
    """Proxy model used as a ContentType anchor for billing permissions."""
    class Meta:
        managed = False
        default_permissions = ()
        verbose_name = "billing_dashboard"
        verbose_name_plural = "billing_dashboards"


class SubscriptionPlan(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="subscription_plans")
    plan_type = models.CharField(max_length=10, choices=PLAN_TYPES)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    currency = models.CharField(max_length=3, default="NOK")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("course", "plan_type")


class Enrollment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="enrollments")
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name="enrollments")
    is_active = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "course")

    def sync_active_status(self):
        """Call on every gated-content read. Lazily flips is_active off past expiry."""
        if self.is_active and self.expires_at and timezone.now() > self.expires_at:
            self.is_active = False
            self.save(update_fields=["is_active"])
        return self.is_active
```

`plan` is nullable so admin can activate an enrollment before a plan/pricing model
even exists yet, or for manually-comped access.

### 2.3 Access-control helper

`apps/billing/access.py`:

```python
def has_chapter_access(user, chapter):
    if chapter.is_free_preview:
        return user.is_authenticated
    if not user.is_authenticated:
        return False
    enrollment = Enrollment.objects.filter(user=user, course=chapter.course).first()
    return bool(enrollment and enrollment.sync_active_status())
```

Used inline inside view methods (matching the existing style — see the
`publication_status` permission check already inline in
`CourseDetailApiView.patch` / `ItemDetailApiView.patch`), rather than as a DRF
`BasePermission`, since these views fetch objects manually and don't go through
`get_object()`.

### 2.4 Permissions

Extend `apps/auth/management/commands/assign_permissions.py`:

- `CUSTOM_PERMISSIONS`: add `(BillingDashboard, "view_enrollment", ...)`,
  `create_enrollment`, `edit_enrollment`, `delete_enrollment`,
  `view_subscription_plan`, `edit_subscription_plan`.
- `GROUP_PERMISSIONS`: grant the `view_*`/`edit_*` ones to `Tutor` (course owners
  managing their own course's plans) and leave enrollment management to Django
  admin / a future `Admin` group entry.

New `apps/billing/permissions.py` with `CanEditSubscriptionPlan`,
`CanViewEnrollments`, etc., mirroring `apps/course/permissions.py`.

## 3. Backend API surface

Mounted at `api/billing/` in `lms/urls.py` (`path('api/billing/', include('apps.billing.urls'))`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/billing/plans/?course_id=` | Public list of active plans for a course |
| POST | `/api/billing/plans/` | Create a plan (tutor/admin) |
| PATCH/DELETE | `/api/billing/plans/<pk>/` | Edit/deactivate a plan |
| GET | `/api/billing/enrollments/me/?course_id=` | Current user's enrollment status for a course |
| POST | `/api/billing/enrollments/` | Create a **pending** enrollment (`is_active=False`) for `{course_id, plan_id}` — stands in for "start checkout"; today this just creates the row for an admin to activate. Will later trigger the real payment-gateway flow instead. |

### 3.1 Enforcing access on existing content endpoints

Update `apps/course/views.py`:

- `ChapterDetailApiView.get` — after fetching the chapter, if
  `not has_chapter_access(request.user, chapter)`, return `403` with a body like
  `{"error": "enrollment_required", "course_id": chapter.course_id}`.
- `LessonDetailApiView.get` — same check via `lesson.chapter`.
- `ItemDetailApiView.get`, `ItemProgressApiView.get/post` — same check via the
  item's lesson's chapter (reuse the existing `Lesson.objects.filter(items=obj).first()`
  lookup already used in `ItemDetailSerializer.get_learning_path`).

`ChapterListApiView`, `CourseDetailApiView.get`, `CourseBasicDetailSerializer` stay
`AllowAny` — the course/chapter *list* (titles, free-preview flags) remains visible
to everyone so users can see what they'd be unlocking; only chapter/lesson/item
**detail/content** endpoints get gated. Add `is_free_preview` to
`ChapterBasicSerializer`/`ChapterSerializer` output so the frontend can render lock
state without an extra request.

## 4. Django admin

`apps/billing/admin.py`: register `SubscriptionPlan` and `Enrollment` with
`list_display` including `user`, `course`, `plan`, `is_active`, `expires_at` — this
is the manual "payment succeeded" control surface for this phase.

## 5. Frontend

- `frontend/src/service/courseService.js` (or a new `billingService.js`): add
  `getSubscriptionPlans(courseId)`, `getMyEnrollment(courseId)`,
  `createEnrollment(courseId, planId)`, following the existing
  `async () => { const { data } = await apiClient.get(...); return data; }` shape.
- New `frontend/src/store/useEnrollmentStore.js` (Zustand, same `loading`/`error`
  shape as `useCourseStore.js`) holding enrollment status per course.
- `frontend/.../courses/[id]/ChapterCard.jsx`: add a `locked` prop. When locked,
  swap the `Link` for a disabled card with a lock icon (reuse the `lucide-react`
  `Lock` icon already used elsewhere) and a "Subscribe to unlock" CTA instead of
  navigating.
- `frontend/.../courses/[id]/page.js`: fetch enrollment status alongside the course,
  compute `locked = !chapter.is_free_preview && !enrollment?.is_active` per chapter,
  pass it to `ChapterCard`.
- `frontend/.../courses/[id]/chapter-details/[chapterId]/page.js` and
  `.../[itemId]/page.js`: handle the new `403 enrollment_required` response from the
  backend (redirect back to the course page with a "subscribe to continue" message),
  since a user could deep-link directly into a locked chapter/lesson URL.
- New pricing/checkout UI (`courses/[id]/subscribe/page.js` or a modal): shows
  monthly/yearly plan cards, calls `createEnrollment`, shows a "pending — awaiting
  activation" state. This is explicitly a stub until a payment gateway is chosen.

## 6. Implementation order

1. `Chapter.is_free_preview` field + migration + backfill data migration (first two
   chapters per course).
2. Scaffold `apps/billing` app (models, admin, apps.py with `label="lms_billing"`),
   add to `INSTALLED_APPS`, run migrations.
3. `access.py` helper + wire into `ChapterDetailApiView`, `LessonDetailApiView`,
   `ItemDetailApiView`, `ItemProgressApiView`.
4. `apps/billing` serializers/views/urls/permissions; mount at `api/billing/` in
   `lms/urls.py`.
5. Extend `assign_permissions.py` with billing permissions; re-run the command.
6. Frontend service + store + `ChapterCard` locked state + course page wiring.
7. Frontend subscribe/plan-selection stub page.
8. Manual verification: create a course, mark two chapters free, create a
   `SubscriptionPlan`, enroll a test user via admin with `is_active=True` and a past
   `expires_at`, confirm the first gated request flips it to `False` and the user
   gets locked out again.

## 7. Explicitly out of scope for this phase

- Actual payment processing (Stripe/Vipps/etc.) — `POST /api/billing/enrollments/`
  only creates a pending record today.
- Automatic renewal, invoicing, refunds.
- Cron/Celery-based expiry sweep — expiry is lazy, checked only on content access,
  per the agreed plan.
