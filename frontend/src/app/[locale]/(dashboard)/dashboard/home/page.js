"use client";
import { useTranslations } from "next-intl";
import { Activity, BookOpen, Upload, Users } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { useCourseStore } from "@/store/useCourseStore";
import { usePermission } from "@/hooks/usePermission";

const AdminDashboard = () => {
  const t = useTranslations("AdminHome");

  const user = useAuthStore((state) => state.user);
  const totalUsers = useAuthStore((state) => state.totalUsers);
  const totalStudents = useAuthStore((state) => state.totalStudents);
  const totalTutors = useAuthStore((state) => state.totalTutors);
  const fetchUsers = useAuthStore((state) => state.fetchUsers);

  const totalCourses = useCourseStore((state) => state.totalCourses);
  const totalItems = useCourseStore((state) => state.totalItems);
  const totalActivities = useCourseStore((state) => state.totalActivities);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);

  const { can } = usePermission();

  useEffect(() => {
    if (can("lms_auth", "view_user")) {
      fetchUsers();
    }
    if (can("lms_course", "view_course")) {
      fetchCourses();
    }
  }, [fetchUsers, fetchCourses]);
  return (
    <div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("pageTitle")}</h1>
              <p className="text-muted-foreground">
                {t("welcomeSubtitle")} {user?.username || "Admin"}
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {can("lms_auth", "view_user") && (
              <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                <div className=" auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium">
                    {t("statTotalUsers")}
                  </div>
                  <Users />
                </div>
                <div className="px-6">
                  <div className="text-2xl font-bold">{totalUsers}</div>
                </div>
              </div>
            )}
            {can("lms_auth", "view_user") && (
              <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                <div className=" auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium">
                    {t("statActiveStudents")}
                  </div>
                  <Users />
                </div>
                <div className="px-6">
                  <div className="text-2xl font-bold">{totalStudents}</div>
                </div>
              </div>
            )}
            {can("lms_auth", "view_user") && (
              <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                <div className=" auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium">
                    {t("statActiveTutors")}
                  </div>
                  <Users />
                </div>
                <div className="px-6">
                  <div className="text-2xl font-bold">{totalTutors}</div>
                </div>
              </div>
            )}
            {can("lms_course", "view_course") && (
              <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                <div className="auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium">
                    {t("statTotalCourses")}
                  </div>
                  <BookOpen />
                </div>
                <div className="px-6">
                  <div className="text-2xl font-bold">{totalCourses}</div>
                </div>
              </div>
            )}
            {can("lms_course", "view_course") && (
              <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                <div className=" auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium">
                    {t("statContentUploaded")}
                  </div>
                  <Upload />
                </div>
                <div className="px-6">
                  <div className="text-2xl font-bold">{totalItems}</div>
                </div>
              </div>
            )}
            {can("lms_coruse", "view_course") && (
              <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                <div className=" auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                  <div className="text-sm font-medium">
                    {t("statActivities")}
                  </div>
                  <Activity />
                </div>
                <div className="px-6">
                  <div className="text-2xl font-bold">{totalActivities}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
