"use client";
import {
  Calendar,
  ChevronDown,
  LayoutDashboard,
  SquareArrowRightExit,
  Trophy,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageToggle from "./LanguageToggle";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { usePermission } from "@/hooks/usePermission";
import { resolveMediaUrl } from "@/lib/media";

const HOME_PATH = {
  Student: "/student/home",
  Parent: "/parents/home",
  Tutor: "/tutor/home",
  Superadmin: "/",
};

const SESSIONS_PATH = {
  Student: "/student/sessions",
  Tutor: "/dashboard/session-management",
  Superadmin: "/dashboard/session-management",
};
const ProfilePath = {
  Student: "/student/profile",
  Parent: "/parents/profile",
  Tutor: "/dashboard/account-settings",
  Superadmin: "/dashboard/account-settings",
};
const LEADERBOARD_PATH = {
  Student: "/student/leaderboard",
  Parent: "/parents/leaderboard",
  Tutor: "/dashboard/leaderboard",
  Admin: "/dashboard/leaderboard",
  Superadmin: "/dashboard/leaderboard",
};
const Navbar = () => {
  const router = useRouter();
  const { isAuthenticated, user, getCurrentUser, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { can } = usePermission();

  useEffect(() => {
    setMounted(true);
  }, []);

  const homePath = HOME_PATH[user?.role] ?? "/";
  const dashboardPath = "/dashboard/home";
  const sessionsPath = SESSIONS_PATH[user?.role] ?? null;
  const profilePath = ProfilePath[user?.role] ?? null;
  const leaderboardPath = LEADERBOARD_PATH[user?.role] ?? null;
  const hasDashboardPermission = can("lms_auth", "view_dashboard");

  useEffect(() => {
    if (isAuthenticated) getCurrentUser();
  }, [isAuthenticated, getCurrentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const t = useTranslations("Navbar");
  if (!mounted) return null;

  return (
    <div className="navbar glass shadow-sm fixed top-0 z-50 w-full px-4 md:px-6 lg:px-10">
      {/* LEFT SIDE */}
      <div className="navbar-start">
        {/* Mobile Menu */}
        <div className="dropdown lg:hidden">
          <div tabIndex={0} role="button" className="btn btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </div>

          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 w-52 p-2 shadow bg-base-100 rounded-box"
          >
            <li>
              <Link href={isAuthenticated ? homePath : "/"}>{t("home")}</Link>
            </li>
            <li>
              <Link href="/courses">{t("courses")}</Link>
            </li>
            {isAuthenticated && user?.role !== "Parent" && (
              <li>
                <Link href="/pricing">{t("pricing")}</Link>
              </li>
            )}
            {isAuthenticated && hasDashboardPermission && (
              <li>
                <Link href={dashboardPath}>{t("dashboard")}</Link>
              </li>
            )}
            {!isAuthenticated && (
              <li>
                <Link
                  href="/registration"
                  className="btn btn-xs shadow-none bg-linear-to-r from-blue-600 to-purple-600 md:btn-sm border-none text-white"
                >
                  {t("startLearningButton")}
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Logo */}
        <Link
          href={homePath}
          className="flex items-center gap-2 font-bold text-primary text-lg md:text-xl"
        >
          <svg
            height="40"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M38.4 46.12L53.88 30.54L69.15 46.02L76.66 38.53L38.03 0L0 37.73L15.4 53.66L30.62 38.53L38.4 46.12Z"
              fill="#5656BF"
            />
            <path
              d="M38.4001 61.6895L30.6201 53.5995L23.0901 61.6095L38.0301 77.0595L61.4601 53.6895L53.7801 46.0195L38.4001 61.6895Z"
              fill="#5656BF"
            />
            <path
              d="M53.8799 30.54L38.3999 46.12L30.6199 38.53L15.3999 53.66L23.0899 61.61L30.6199 53.6L38.3999 61.69L53.7799 46.02L61.4599 53.69L69.1499 46.02L53.8799 30.54Z"
              fill="white"
            />
            <path
              d="M48.6299 16.89L49.5099 21.31L53.8299 22.58C54.5399 22.79 54.4999 23.82 53.7699 23.96L49.3499 24.84L48.0799 29.16C47.8699 29.87 46.8399 29.83 46.6999 29.1L45.8199 24.68L41.4999 23.41C40.7899 23.2 40.8299 22.17 41.5599 22.03L45.9799 21.15L47.2499 16.83C47.4599 16.12 48.4899 16.16 48.6299 16.89Z"
              fill="white"
            />
          </svg>

          <span className="hidden sm:block text-[#5656BF] leading-normal">
            MathMentor
          </span>
        </Link>
      </div>

      {/* CENTER MENU */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal gap-2">
          <li>
            <Link href={isAuthenticated ? homePath : "/"}>{t("home")}</Link>
          </li>
          <li>
            <Link href="/courses">{t("courses")}</Link>
          </li>
          {isAuthenticated && user?.role !== "Parent" && (
              <li>
                <Link href="/pricing">{t("pricing")}</Link>
              </li>
            )}
          {isAuthenticated && hasDashboardPermission && (
            <li>
              <Link href={dashboardPath} className="flex items-center gap-1">
                {t("dashboard")}
              </Link>
            </li>
          )}
        </ul>
      </div>

      {/* RIGHT SIDE */}
      <div className="navbar-end gap-2 md:gap-4">
        {/* Language Toggle */}
        <LanguageToggle />

        {!isAuthenticated ? (
          <>
            {/* Sign In Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-sm md:btn-md"
              >
                {t("signInButton")}
                <ChevronDown size={16} />
              </div>

              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 w-52 p-2 shadow bg-base-100 rounded-box border border-gray-200"
              >
                <li>
                  <Link href="/login/student">{t("studentLoginLink")}</Link>
                </li>
                <li>
                  <Link href="/login/parents">{t("parentLoginLink")}</Link>
                </li>
                <li>
                  <Link href="/login/tutor">{t("tutorLoginLink")}</Link>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <Link
              href="/registration"
              className="btn btn-xs btn-primary shadow-none bg-linear-to-r from-blue-600 to-purple-600 md:btn-sm hidden md:flex"
            >
              {t("startLearningButton")}
            </Link>
          </>
        ) : (
          <>
            {/* Notification Dropdown */}
            {/* <div className="dropdown dropdown-end">
                            <div tabIndex={0} aria-label="Notifications" className="btn btn-ghost btn-circle">
                                <div className="indicator">
                                    <Bell size={16}/>
                                    <span
                                        className="indicator-item absolute -top-1 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                                </div>
                            </div>

                            <div
                                tabIndex={0}
                                className="card card-compact shadow border border-gray-200 dropdown-content bg-base-100 z-50 w-52 lg:w-80"
                            >
                                <div className="card-body p-3">
                                    <p className="text-lg font-bold border-b border-gray-200 my-2">
                                        {t('notificationsTitle')}
                                    </p>

                                    <ul className="space-y-4">
                                        <li className="p-2 hover:bg-sky-100 rounded cursor-pointer">
                                            <div className="flex items-start gap-2 w-full">
                                                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>

                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">
                                                        New quiz available
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        Daily Challenge for Grade 6
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        5 minutes ago
                                                    </p>
                                                </div>
                                            </div>
                                        </li>

                                        <li className="border-t border-gray-200 py-2 hover:bg-sky-100 rounded cursor-pointer">
                                            <p className="text-sm text-center">
                                                {t('viewAllNotificationsLink')}
                                            </p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div> */}

            {/* User Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                aria-label="User menu"
                className="btn btn-circle avatar border-gray-400 "
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      src={resolveMediaUrl(user.avatar)}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} />
                  )}
                </div>
              </div>

              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 border border-gray-100 space-y-2 rounded-box mt-3 w-52 p-2 shadow"
              >
                <li className="border-b border-gray-300">
                  <p className="text-lg font-semibold">
                    {user?.username || ""}
                  </p>
                  {user?.role === "Student" && (
                    <p className="text-xs opacity-60">
                      Grade {user?.grade_level}
                    </p>
                  )}
                </li>

                {hasDashboardPermission && (
                  <li>
                    <Link href={dashboardPath}>
                      <LayoutDashboard size={16} />
                      {t("dashboard")}
                    </Link>
                  </li>
                )}

                {/* <li>
                  <Link href="#">
                    <FileText size={16} />
                    {t("mySubmissionsLink")}
                  </Link>
                </li> */}

                {/* <li>
                  <Link href="#">
                    <BookOpen size={16} />
                    {t("myNotesLink")}
                  </Link>
                </li> */}

                {profilePath && (
                  <li>
                    <Link href={profilePath}>
                      <User size={16} />
                      {t("profileLink")}
                    </Link>
                  </li>
                )}

                {sessionsPath && (
                  <li>
                    <Link href={sessionsPath}>
                      <Calendar size={16} />
                      {t("mySessionsLink")}
                    </Link>
                  </li>
                )}

                {leaderboardPath && (
                  <li>
                    <Link href={leaderboardPath}>
                      <Trophy size={16} />
                      {t("leaderboardLink")}
                    </Link>
                  </li>
                )}

                {/* <li>
                  <Link href="#">
                    <Archive size={16} />
                    {t("subscriptionLink")}
                  </Link>
                </li> */}

                {/* <li>
                  <Link href="#">
                    <Settings size={16} />
                    {t("settingsLink")}
                  </Link>
                </li> */}

                <li className="border-t border-gray-200 py-1">
                  <button
                    onClick={handleLogout}
                    className="text-red-500 flex items-center gap-2 w-full"
                  >
                    <SquareArrowRightExit size={16} />
                    {t("logoutButton")}
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
