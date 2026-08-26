"use client";

import { Pencil, Plus, Search, Star } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useSubscriptionPlanStore } from "@/store/useSubscriptionPlanStore";
import { usePermission } from "@/hooks/usePermission";
import Pagination from "@/components/layout/Pagination";
import PlanFormModal from "./PlanFormModal";

const PAGE_SIZE = 10;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

const SubscriptionPlanFilter = () => {
  const t = useTranslations("ManageSubscriptionPlans");
  const { can } = usePermission();
  const canEdit = can("lms_billing", "edit_subscription_plan");

  const STATUSES = [
    { label: t("allStatuses"), value: "" },
    { label: t("statusActive"), value: "active" },
    { label: t("statusInactive"), value: "inactive" },
  ];

  const plans = useSubscriptionPlanStore((state) => state.plans);
  const loading = useSubscriptionPlanStore((state) => state.loading);
  const error = useSubscriptionPlanStore((state) => state.error);
  const fetchPlans = useSubscriptionPlanStore((state) => state.fetchPlans);
  const createPlan = useSubscriptionPlanStore((state) => state.createPlan);
  const updatePlan = useSubscriptionPlanStore((state) => state.updatePlan);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleCreate = async (payload) => {
    await createPlan(payload);
    toast.success(t("planCreated"));
  };

  const handleUpdate = async (payload) => {
    await updatePlan(editTarget.id, payload);
    toast.success(t("planUpdated"));
  };

  const filtered = useMemo(() => {
    let result = [...(plans ?? [])];

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.course_title?.toLowerCase().includes(lower) ||
          p.name?.toLowerCase().includes(lower),
      );
    }

    if (statusFilter === "active") {
      result = result.filter((p) => p.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((p) => !p.is_active);
    }

    return result;
  }, [plans, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatus = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="w-full bg-base-100 rounded-xl shadow-sm border border-base-200">
        {/* Filters */}
        <div className="p-4 grid md:grid-cols-2 justify-between items-center gap-4 border-b border-base-200">
          <h2 className="text-xl font-bold px-2">{t("allPlansHeading")}</h2>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="input input-sm input-bordered pl-10 w-64 focus:input-primary"
                value={search}
                onChange={handleSearch}
              />
            </div>
            <select
              className="select select-sm select-bordered font-medium"
              value={statusFilter}
              onChange={handleStatus}
            >
              {STATUSES.map((s) => (
                <option key={String(s.value)} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {canEdit && (
              <button
                onClick={() => setShowAdd(true)}
                className="btn btn-info btn-sm shadow-none"
              >
                <Plus size={14} />
                {t("addPlanButton")}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="px-6 py-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200/50 text-base-content/70">
              <tr>
                <th className="font-bold py-4">{t("colName")}</th>
                <th className="font-bold">{t("colCourse")}</th>
                <th className="font-bold">{t("colDuration")}</th>
                <th className="font-bold">{t("colPrice")}</th>
                <th className="font-bold">{t("colStatus")}</th>
                <th className="font-bold">{t("colCreated")}</th>
                {canEdit && (
                  <th className="text-right px-6">{t("colActions")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && plans.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 7 : 6} className="text-center py-10">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 7 : 6}
                    className="text-center py-10 text-base-content/40"
                  >
                    {t("noPlansFound")}
                  </td>
                </tr>
              ) : (
                paginated.map((plan) => (
                  <tr
                    key={plan.id}
                    className="hover:bg-base-200/30 transition-colors group"
                  >
                    <td>
                      <p className="font-semibold text-base-content/80 flex items-center gap-1.5">
                        {plan.name || "—"}
                        {plan.is_recommended && (
                          <span
                            className="badge badge-sm badge-warning gap-1 font-bold"
                            title={t("isRecommendedLabel")}
                          >
                            <Star size={10} className="fill-current" />
                            {t("recommendedBadge")}
                          </span>
                        )}
                      </p>
                      {plan.description && (
                        <p className="text-xs text-base-content/40 truncate max-w-xs">
                          {plan.description}
                        </p>
                      )}
                    </td>
                    <td className="text-base-content/60">
                      {plan.course_title || "—"}
                    </td>
                    <td className="text-base-content/60">
                      {t("daysValue", { count: plan.days })}
                    </td>
                    <td className="text-base-content/60">
                      {plan.price} {plan.currency}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm font-bold py-3 px-4 rounded-full capitalize ${plan.is_active ? "badge-info" : "badge-error"}`}
                      >
                        {plan.is_active
                          ? t("statusActive")
                          : t("statusInactive")}
                      </span>
                    </td>
                    <td className="text-base-content/60">
                      {formatDate(plan.created_at)}
                    </td>
                    {canEdit && (
                      <td className="text-right px-6">
                        <button
                          onClick={() => setEditTarget(plan)}
                          className="btn btn-ghost btn-xs btn-square group-hover:bg-base-300"
                        >
                          <Pencil size={14} className="text-base-content/40" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {showAdd && (
        <PlanFormModal
          onClose={() => setShowAdd(false)}
          onSubmit={handleCreate}
        />
      )}
      {editTarget && (
        <PlanFormModal
          plan={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
};

export default SubscriptionPlanFilter;
