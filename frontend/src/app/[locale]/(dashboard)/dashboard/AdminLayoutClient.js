"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { usePermission } from "@/hooks/usePermission";
import { useAuthStore } from "@/store/useAuthStore";

const ROLE_FALLBACK = {
  tutor: "/tutor/home",
  student: "/student/home",
  parent: "/parents/home",
};

export default function AdminLayoutClient({ children, sidebar, languageTab }) {
  const pathname = usePathname();
  const router = useRouter();
  const { can, role } = usePermission();
  const { user, isAuthenticated, getCurrentUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const isLoginPage = /^\/[^/]+\/dashboard\/?$/.test(pathname);

  useEffect(() => {
    setMounted(true);
    if (!isLoginPage && isAuthenticated) {
      getCurrentUser();
    }
  }, []);

  // Redirect once we know the user and role
  useEffect(() => {
    if (!mounted || isLoginPage || !user) return;
    if (!can("lms_auth", "view_dashboard")) {
      router.replace(ROLE_FALLBACK[role] ?? "/");
    }
  }, [mounted, user, role, can, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Still hydrating — show the shell with a spinner so the sidebar is visible
  if (!mounted || !user) {
    return (
      <div className="lg:flex min-h-screen">
        <div className="lg:w-64">{sidebar}</div>
        <main className="flex-1 min-w-0 flex items-center justify-center min-h-screen">
          <span className="loading loading-spinner loading-lg text-info" />
        </main>
      </div>
    );
  }

  // Permission denied — redirect is in flight, render nothing
  if (!can("lms_auth", "view_dashboard")) {
    return null;
  }

  return (
    <div className="lg:flex min-h-screen">
      <div className="lg:w-64">{sidebar}</div>
      <main className="flex-1 min-w-0">
        <div className="flex justify-end pt-2 pr-2">{languageTab}</div>
        {children}
      </main>
    </div>
  );
}
