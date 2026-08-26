"use client";

import { Pencil, Plus, Search } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useEnrollmentStore } from "@/store/useEnrollmentStore";
import { usePermission } from "@/hooks/usePermission";
import Pagination from "@/components/layout/Pagination";
import EnrollmentFormModal from "./EnrollmentFormModal";

const PAGE_SIZE = 10;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

const formatPlan = (plan) => {
  if (!plan || plan === "Free") return "Free";
  return `${plan.name} ${plan.days} days · ${plan.price} ${plan.currency}`;
};

const EnrollmentFilter = () => {
  const t = useTranslations("ManageEnrollment");
  const { can } = usePermission();
  const canEdit = can("lms_billing", "edit_enrollment");

  const STATUSES = [
    { label: t("allStatuses"), value: "" },
    { label: t("statusActive"), value: "active" },
    { label: t("statusInactive"), value: "inactive" },
  ];

  const enrollments = useEnrollmentStore((state) => state.enrollments);
  const loading = useEnrollmentStore((state) => state.loading);
  const error = useEnrollmentStore((state) => state.error);
  const fetchEnrollments = useEnrollmentStore(
    (state) => state.fetchEnrollments,
  );
  const createEnrollment = useEnrollmentStore((state) => state.createEnrollment);
  const updateEnrollment = useEnrollmentStore((state) => state.updateEnrollment);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleCreate = async (payload) => {
    await createEnrollment(payload);
    toast.success(t("enrollmentCreated"));
  };

  const handleUpdate = async (payload) => {
    await updateEnrollment(editTarget.id, payload);
    toast.success(t("enrollmentUpdated"));
  };

  const filtered = useMemo(() => {
    let result = [...(enrollments ?? [])];

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.full_name?.toLowerCase().includes(lower) ||
          e.user?.toLowerCase().includes(lower) ||
          e.course_title?.toLowerCase().includes(lower),
      );
    }

    if (statusFilter === "active") {
      result = result.filter((e) => e.is_active);
    } else if (statusFilter === "inactive") {
      result = result.filter((e) => !e.is_active);
    }

    return result;
  }, [enrollments, search, statusFilter]);

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
          <h2 className="text-xl font-bold px-2">{t("allEnrollmentsHeading")}</h2>
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
                {t("addEnrollmentButton")}
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
                <th className="font-bold py-4">{t("colStudent")}</th>
                <th className="font-bold">{t("colCourse")}</th>
                <th className="font-bold">{t("colPlan")}</th>
                <th className="font-bold">{t("colStatus")}</th>
                <th className="font-bold">{t("colStarted")}</th>
                <th className="font-bold">{t("colExpires")}</th>
                {canEdit && (
                  <th className="text-right px-6">{t("colActions")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading && enrollments.length === 0 ? (
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
                    {t("noEnrollmentsFound")}
                  </td>
                </tr>
              ) : (
                paginated.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    className="hover:bg-base-200/30 transition-colors group"
                  >
                    <td className="font-semibold text-base-content/80">
                      {enrollment.full_name || enrollment.user}
                    </td>
                    <td className="text-base-content/60">
                      {enrollment.course_title || "—"}
                    </td>
                    <td className="text-base-content/60">
                      {formatPlan(enrollment.plan)}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm font-bold py-3 px-4 rounded-full capitalize ${enrollment.is_active ? "badge-info" : "badge-error"}`}
                      >
                        {enrollment.is_active
                          ? t("statusActive")
                          : t("statusInactive")}
                      </span>
                    </td>
                    <td className="text-base-content/60">
                      {formatDate(enrollment.started_at)}
                    </td>
                    <td className="text-base-content/60">
                      {formatDate(enrollment.expires_at)}
                    </td>
                    {canEdit && (
                      <td className="text-right px-6">
                        <button
                          onClick={() => setEditTarget(enrollment)}
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
        <EnrollmentFormModal
          onClose={() => setShowAdd(false)}
          onSubmit={handleCreate}
        />
      )}
      {editTarget && (
        <EnrollmentFormModal
          enrollment={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
};

export default EnrollmentFilter;
