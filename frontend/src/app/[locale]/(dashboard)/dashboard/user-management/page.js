"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/useAuthStore";
import UserFilter from "./UserFilter";
import { usePermission } from "@/hooks/usePermission";

const StatCard = ({ label, value, sub, loading }) => (
  <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
    <div className="auto-rows-min grid-rows-[auto_auto] gap-2 px-6 flex flex-row items-center justify-between pb-2">
      <div className="text-sm font-medium">{label}</div>
    </div>
    <div className="px-6">
      <div className="text-2xl font-bold">
        {loading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          value
        )}
      </div>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  </div>
);

const UserManagement = () => {
  const t = useTranslations("UserManagement");
  const {
    fetchUsers,
    totalUsers,
    totalStudents,
    totalParents,
    totalTutors,
    loading,
    totalInactiveUsers,
  } = useAuthStore();
  const { can } = usePermission();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div>
      <div className="p-4">
        <div className="md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-gray-500">{t("subtitle")}</p>
          </div>
          {can("lms_auth", "create_user") && (
            <Link href="/dashboard/user-management/add">
              <button className="btn btn-info shadow-none">
                <Plus />
                {t("addUser")}
              </button>
            </Link>
          )}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            label={t("totalUsers")}
            value={totalUsers}
            sub={t("allUsers")}
            loading={loading}
          />
          <StatCard
            label={t("students")}
            value={totalStudents}
            sub={t("activeStudents")}
            loading={loading}
          />
          <StatCard
            label={t("parents")}
            value={totalParents}
            sub={t("parentAccounts")}
            loading={loading}
          />
          <StatCard
            label={t("tutors")}
            value={totalTutors}
            sub={t("activeTutors")}
            loading={loading}
          />
          <StatCard
            label={t("inactiveUsers")}
            value={totalInactiveUsers}
            sub={t("suspendedAccounts")}
            loading={loading}
          />
        </div>
        <div className="mt-8">
          <UserFilter />
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
