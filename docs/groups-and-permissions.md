# Groups & Permissions Feature (MM-113)

Custom Groups let superadmins create named groups, assign Django permissions to them, and add users to those groups. Users in a group automatically inherit all permissions assigned to that group.

---

## Architecture Overview

```
CustomGroup  ──(M2M)──  auth.Permission   (Django built-in permissions)
     │
     └──(through CustomGroupMembership)──  User
```

- `CustomGroup` is a new model in `apps/auth/models.py`, separate from Django's built-in `auth.Group` (which is used for role-based groups: Student, Parent, Tutor).
- `CustomGroupMembership` is the through-table between `User` and `CustomGroup`, storing a `joined_at` timestamp.
- `User.get_all_permissions()` is overridden to merge permissions from `CustomGroup` memberships with Django's standard permission resolution. The result is cached per request on `_custom_group_perm_cache`.

---

## Backend Files Changed

| File | What changed |
|------|-------------|
| `apps/auth/models.py` | Added `CustomGroup`, `CustomGroupMembership`; overrode `User.get_all_permissions()` |
| `apps/auth/serializers.py` | Added `PermissionSerializer`, `CustomGroupListSerializer`, `CustomGroupDetailSerializer`, `CustomGroupWriteSerializer` |
| `apps/auth/views.py` | Added `CustomGroupListView`, `CustomGroupDetailView`, `AvailablePermissionsView` |
| `apps/auth/urls.py` | Registered three new URL patterns under `/api/auth/groups/` |
| `apps/auth/migrations/0002_customgroup_customgroupmembership.py` | Auto-generated migration |

---

## API Endpoints

All endpoints require authentication. Only users with `role == 999` (Superadmin) can access them.

### List / Create Groups

```
GET  /api/auth/groups/
POST /api/auth/groups/
```

**GET** — returns all groups with `user_count` and `permission_count`.

```json
[
  {
    "id": 1,
    "name": "Content Manager",
    "description": "Manage courses and items",
    "user_count": 3,
    "permission_count": 8,
    "created_at": "2026-06-14T10:00:00Z",
    "updated_at": "2026-06-14T10:00:00Z"
  }
]
```

**POST** — create a new group. `permission_ids` and `user_ids` are optional.

```json
{
  "name": "Finance Manager",
  "description": "Manage payments and revenue",
  "permission_ids": [12, 34, 56],
  "user_ids": [3, 7]
}
```

Returns the full group detail (201).

---

### Group Detail

```
GET    /api/auth/groups/<id>/
PATCH  /api/auth/groups/<id>/
DELETE /api/auth/groups/<id>/
```

**GET** — full detail with nested `permissions` array and `users` array.

```json
{
  "id": 1,
  "name": "Content Manager",
  "description": "Manage courses and items",
  "permissions": [
    { "id": 12, "name": "Can view course", "codename": "view_course", "app_label": "lms_course" }
  ],
  "users": [
    { "id": 3, "username": "alice", "full_name": "Alice Smith", "email": "alice@example.com", "role": "Tutor" }
  ],
  "user_count": 1,
  "created_at": "...",
  "updated_at": "..."
}
```

**PATCH** — partial update. Pass `permission_ids` to replace the entire permission set; pass `user_ids` to replace all members.

**DELETE** — deletes the group and all memberships (204 No Content).

---

### Available Permissions

```
GET /api/auth/groups/available-permissions/
```

Returns all Django permissions in the database grouped by `app_label`. Use this to populate the permission-toggle grid on the frontend.

```json
{
  "lms_auth": [
    { "id": 1, "name": "Can view user", "codename": "view_user", "app_label": "lms_auth" }
  ],
  "lms_course": [
    { "id": 5, "name": "Can add course", "codename": "add_course", "app_label": "lms_course" },
    { "id": 6, "name": "Can change course", "codename": "change_course", "app_label": "lms_course" }
  ]
}
```

---

## How Permissions Are Inherited

`User.get_all_permissions()` is overridden in `apps/auth/models.py`:

1. Calls `super().get_all_permissions()` — picks up Django's standard permissions (direct `user_permissions` + role-based `auth.Group` permissions).
2. Queries `CustomGroupMembership` for the user and collects all permissions from those groups.
3. Caches the result in `self._custom_group_perm_cache` for the lifetime of the request.
4. Returns the union of both sets.

This means the existing `usePermission` hook on the frontend and all DRF `has_perm()` checks work automatically — no frontend changes needed for permission enforcement.

---

## Running the Migration

```bash
cd backend
python manage.py migrate
```

Migration file: `apps/auth/migrations/0002_customgroup_customgroupmembership.py`

---

## Frontend Files

| File | What it does |
|------|-------------|
| `frontend/src/service/groupService.js` | API calls: getGroups, getGroupById, createGroup, updateGroup, deleteGroup, getAvailablePermissions |
| `frontend/src/store/useGroupStore.js` | Zustand store: state + actions for groups and available permissions |
| `frontend/src/app/[locale]/(dashboard)/dashboard/manage-permissions/page.js` | Two-panel UI — group list on the left, group detail + permission configurator on the right |
| `frontend/src/components/layout/AdminSidebar.jsx` | "Manage Permissions" sidebar item enabled, visible only to Superadmin |
| `frontend/messages/en.json` | Added `"Manage Permissions"` key to `AdminSidebar` namespace |

### Page structure

- **Left panel** — list of groups with user/permission counts; "Add Group" button opens an inline modal.
- **Right panel** — selected group detail: assigned users, active permissions list, and a permission configurator toggle grid grouped by app (`lms_auth`, `lms_course`, etc.).
- Permission toggles are batched — changes are saved only when the "Save Permissions" button appears (shown when there are unsaved changes).
- Delete requires confirmation via a second modal.
- The "Assign Users" button links to `/dashboard/user-management` where user–group assignment lives.
