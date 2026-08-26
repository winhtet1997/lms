"use client";

import React, { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSubscriptionPlanStore } from "@/store/useSubscriptionPlanStore";
import SubscriptionPlanFilter from "./SubscriptionPlanFilter";

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

const ManageSubscriptionPlans = () => {
  const t = useTranslations("ManageSubscriptionPlans");
  const plans = useSubscriptionPlanStore((state) => state.plans);
  const loading = useSubscriptionPlanStore((state) => state.loading);
  const fetchPlans = useSubscriptionPlanStore((state) => state.fetchPlans);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const { totalPlans, totalActive, totalInactive } = useMemo(() => {
    const active = plans.filter((p) => p.is_active).length;
    return {
      totalPlans: plans.length,
      totalActive: active,
      totalInactive: plans.length - active,
    };
  }, [plans]);

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
            label={t("totalPlans")}
            value={totalPlans}
            sub={t("allPlans")}
            loading={loading}
          />
          <StatCard
            label={t("activePlans")}
            value={totalActive}
            sub={t("currentlyActive")}
            loading={loading}
          />
          <StatCard
            label={t("inactivePlans")}
            value={totalInactive}
            sub={t("currentlyInactive")}
            loading={loading}
          />
        </div>
        <div className="mt-8">
          <SubscriptionPlanFilter />
        </div>
      </div>
    </div>
  );
};

export default ManageSubscriptionPlans;
