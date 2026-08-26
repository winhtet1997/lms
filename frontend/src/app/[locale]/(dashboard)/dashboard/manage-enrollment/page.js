"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useEnrollmentStore } from "@/store/useEnrollmentStore";
import EnrollmentFilter from "./EnrollmentFilter";

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

const ManageEnrollment = () => {
  const t = useTranslations("ManageEnrollment");
  const enrollments = useEnrollmentStore((state) => state.enrollments);
  const loading = useEnrollmentStore((state) => state.loading);
  const fetchEnrollments = useEnrollmentStore(
    (state) => state.fetchEnrollments,
  );

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const { totalEnrollments, totalActive, totalInactive } = useMemo(() => {
    const active = enrollments.filter((e) => e.is_active).length;
    return {
      totalEnrollments: enrollments.length,
      totalActive: active,
      totalInactive: enrollments.length - active,
    };
  }, [enrollments]);

  return (
    <div>
      <div className="p-4">
        <div className="md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-gray-500">{t("subtitle")}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            label={t("totalEnrollments")}
            value={totalEnrollments}
            sub={t("allEnrollments")}
            loading={loading}
          />
          <StatCard
            label={t("activeEnrollments")}
            value={totalActive}
            sub={t("currentlyActive")}
            loading={loading}
          />
          <StatCard
            label={t("inactiveEnrollments")}
            value={totalInactive}
            sub={t("expiredOrPending")}
            loading={loading}
          />
        </div>
        <div className="mt-8">
          <EnrollmentFilter />
        </div>
      </div>
    </div>
  );
};

export default ManageEnrollment;
