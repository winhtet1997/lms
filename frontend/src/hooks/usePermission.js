"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

function getAuthRole() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth_role=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Returns `can(app, codename)` driven by the permissions array the backend
 * sends on login via /auth/me/ → user.permissions (Django get_all_permissions).
 *
 * super_admin bypasses all checks (they own everything).
 * Every other role — tutor, guest, custom — uses whatever the backend returned,
 * so per-user overrides work with zero frontend changes.
 *
 * Usage: const { can } = usePermission()
 *        can('lms_course', 'create_course')   → true / false
 */
export function usePermission() {
  const [role, setRole] = useState(null); // null on both server and initial client render to avoid hydration mismatch
  const user = useAuthStore((state) => state.user);


// Hotfix: if the user role is Admin, use that instead of the cookie value.
// Remove this when we switch to permission based access control instead of role based.
  useEffect(() => {
    if (user?.role == "Admin") {
      setRole(user.role);
    } else {
      setRole(getAuthRole());
    }
  }, [user]);

  // useEffect(() => {
  //   setRole(getAuthRole());
  // }, []);

  // Build a Set once from the backend-provided list for O(1) lookups
  const permissions = new Set(user?.permissions ?? []);

  function can(app, codename) {
    // if (role === "super_admin") return true; // Hotfix
    return permissions.has(`${app}.${codename}`);
  }

  return { can, role };
}
