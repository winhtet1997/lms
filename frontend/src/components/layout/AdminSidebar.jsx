"use client";

import { useAuthStore } from "@/store/useAuthStore";
import {
  BookOpen,
  Bot,
  Calendar,
  CreditCard,
  Download,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Notebook,
  Receipt,
  Settings,
  Shield,
  Trophy,
  Tag,
  Users,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { usePermission } from "@/hooks/usePermission";

export default function Sidebar({ children }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("AdminSidebar");
  const { can } = usePermission();

  const isActive = (href) =>
    href !== "#" && (pathname === href || pathname.startsWith(href + "/"));

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };
  return (
    <div className="drawer lg:drawer-open ">
      {/* Toggle */}
      <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main Content */}
      <div className="drawer-content flex flex-col">
        {/* Mobile Navbar */}
        <div className="w-full lg:hidden p-4 flex gap-3 items-center border-b border-gray-200">
          <label htmlFor="sidebar-drawer" className="btn btn-square btn-ghost">
            ☰
          </label>
          <h5>Math Mentor</h5>
        </div>
        {children}
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-50 fixed">
        <label htmlFor="sidebar-drawer" className="drawer-overlay"></label>

        <aside className="menu w-64 min-h-full bg-base-100 text-base-content border-r border-gray-300">
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-gray-300 p-3 mb-5">
            <GraduationCap size={28} className="text-info" />
            <div>
              <Link href="/">
                <span className="font-bold text-2xl">MathMentor</span>
              </Link>
              <p className="text-xs text-muted-foreground">
                {user?.role || " "} {t("panelLabel")}
              </p>
            </div>
          </div>

          <ul className="p-3">
            <SidebarItem
              icon={<LayoutDashboard size={20} />}
              text={t("dashboard")}
              href="/dashboard/home"
              active={isActive("/dashboard/home")}
            />
            {can("lms_course", "view_item") && (
              <SidebarItem
                icon={<Download size={20} />}
                text={t("Item Library")}
                href="/dashboard/content"
                active={isActive("/dashboard/content")}
              />
            )}

            {can("lms_course", "view_course") && (
              <SidebarItem
                icon={<BookOpen size={20} />}
                text={t("Course Management")}
                href="/dashboard/course-management"
                active={isActive("/dashboard/course-management")}
              />
            )}

            {can("lms_auth", "view_user") && (
              <SidebarItem
                icon={<Users size={20} />}
                text={t("User Management")}
                href="/dashboard/user-management"
                active={isActive("/dashboard/user-management")}
              />
            )}
            {can("lms_billing", "view_enrollment") && (
              <SidebarItem
                icon={<CreditCard size={20} />}
                text={t("Manage Enrollment")}
                href="/dashboard/manage-enrollment"
                active={isActive("/dashboard/manage-enrollment")}
              />
            )}
            {can("lms_billing", "view_subscription_plan") && (
              <SidebarItem
                icon={<Tag size={20} />}
                text={t("Manage Subscription Plans")}
                href="/dashboard/manage-subscription-plans"
                active={isActive("/dashboard/manage-subscription-plans")}
              />
            )}
            {can("lms_billing", "view_payment_transaction") && (
              <SidebarItem
                icon={<Receipt size={20} />}
                text={t("Payment Transactions")}
                href="/dashboard/manage-payment-transactions"
                active={isActive("/dashboard/manage-payment-transactions")}
              />
            )}
            {can("lms_ai_chat", "manage_mathai_mapping") && (
              <SidebarItem
                icon={<Bot size={20} />}
                text={t("Math AI Mapping")}
                href="/dashboard/manage-mathai-mapping"
                active={isActive("/dashboard/manage-mathai-mapping")}
              />
            )}
            {can("lms_course", "view_daily_quiz") && (
              <SidebarItem
                icon={<Notebook size={20} />}
                text={t("Daily Quiz")}
                href="/dashboard/daily-quiz"
                active={isActive("/dashboard/daily-quiz")}
              />
            )}
            {can("lms_sessions", "view_session") && (
              <SidebarItem
                icon={<Video size={20} />}
                text={
                  user?.role === "Tutor"
                    ? t("My Sessions")
                    : t("Session Management")
                }
                href="/dashboard/session-management"
                active={isActive("/dashboard/session-management")}
              />
            )}

            {user?.role === "Tutor" && (
              <SidebarItem
                icon={<Calendar size={20} />}
                text={t("My Availability")}
                href="/dashboard/availability"
                active={isActive("/dashboard/availability")}
              />
            )}
            {user?.role === "Superadmin" && (
              <SidebarItem
                icon={<Shield size={20} />}
                text={t("Manage Permissions")}
                href="/dashboard/manage-permissions"
                active={isActive("/dashboard/manage-permissions")}
              />
            )}
            <SidebarItem
              icon={<Trophy size={20} />}
              text={t("Leaderboard")}
              href="/dashboard/leaderboard"
              active={isActive("/dashboard/leaderboard")}
            />
            {/*         <SidebarItem
                          icon={<Award size={20} />}
                          text={t("Exam Material")}
                          href="#"
                        />
                        <SidebarItem
                          icon={<TrendingUp size={20} />}
                          text={t("student Progress")}
                          href="#"
                        />
                        <SidebarItem
                          icon={<ChartColumn size={20} />}
                          text={t("user Analytics")}
                          href="#"
                        />
                        <SidebarItem
                          icon={<DollarSign size={20} />}
                          text={t("Payment & Reviews")}
                          href="#"
                        />
                        <SidebarItem
                          icon={<Settings size={20} />}
                          text={t("Notification Settings")}
                          href="#"
                        /> */}
          </ul>

          {/* Bottom */}
          <div className="mt-auto pt-6 border-t border-gray-200">
            <ul className="space-y-1">
              <div className="mb-4 p-3 bg-gray-100 rounded-lg relative group">
                <p className="text-sm font-medium text-foreground relative z-10">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-muted-foreground relative z-10">
                  {user?.email || ""}
                </p>
                <Link href="/dashboard/account-settings">
                  <button className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-200 transition-colors z-20">
                    <Settings size={18} />
                  </button>
                </Link>
              </div>

              <button
                className="btn btn-outline w-full border-gray-200"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                {t("logout")}
              </button>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* Sidebar Item */
function SidebarItem({ icon, text, active, href = "#" }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 ease-in-out ${
          active
            ? "bg-info text-white"
            : "text-base-content hover:bg-info/10 hover:text-info"
        }`}
      >
        {icon}
        <span className="flex-1 font-medium">{text}</span>
      </Link>
    </li>
  );
}
