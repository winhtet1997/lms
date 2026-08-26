"use client";

import { Loader2, Search, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { authService } from "@/service/authService";
import { useCourseStore } from "@/store/useCourseStore";
import { useSubscriptionPlanStore } from "@/store/useSubscriptionPlanStore";

const formatPlanOption = (plan) => {
  const name = plan.name ? `${plan.name} — ` : "";
  return `${name}${plan.days} days · ${plan.price} ${plan.currency}`;
};

const EnrollmentFormModal = ({ enrollment, onClose, onSubmit }) => {
  const t = useTranslations("ManageEnrollment");
  const isEdit = Boolean(enrollment);

  const courses = useCourseStore((state) => state.courses);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const published = courses.filter((c) => c.publication_status === true);

  const plans = useSubscriptionPlanStore((state) => state.plans);
  const fetchPlans = useSubscriptionPlanStore((state) => state.fetchPlans);

  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(!isEdit);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const [courseId, setCourseId] = useState(enrollment?.course ?? "");
  const [planId, setPlanId] = useState(enrollment?.plan?.id ?? "");
  const [isActive, setIsActive] = useState(enrollment?.is_active ?? false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const planLocked = isEdit && Boolean(enrollment?.started_at);

  useEffect(() => {
    fetchPlans();
    if (isEdit) return;
    fetchCourses({ page_size: 100 });
    authService.getUsers({ page_size: 9999 }).then((data) => {
      setAllUsers(data.users ?? []);
      setLoadingUsers(false);
    });
  }, [isEdit, fetchCourses, fetchPlans]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [allUsers, userSearch]);

  const coursePlans = useMemo(
    () => (plans ?? []).filter((p) => String(p.course) === String(courseId)),
    [plans, courseId],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!isEdit && !selectedUser) {
      setFormError(t("userRequired"));
      return;
    }
    if (!isEdit && !courseId) {
      setFormError(t("courseRequired"));
      return;
    }

    setBusy(true);
    try {
      const payload = isEdit
        ? {
            plan_id: planId || null,
            is_active: isActive,
          }
        : {
            user: selectedUser.id,
            course: Number(courseId),
            plan: planId || undefined,
            is_active: isActive,
          };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const data = err?.response?.data;
      const message =
        (data && Object.values(data).flat().join(" ")) ||
        t(isEdit ? "updateFailed" : "createFailed");
      setFormError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-gray-400"
        >
          <X size={16} />
        </button>
        <h2 className="text-lg font-semibold mb-6">
          {isEdit ? t("editEnrollmentTitle") : t("addEnrollmentTitle")}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto pr-1"
        >
          {isEdit ? (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t("colStudent")}
                </label>
                <input
                  className="input input-bordered w-full"
                  value={enrollment.full_name || enrollment.user || ""}
                  disabled
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t("colCourse")}
                </label>
                <input
                  className="input input-bordered w-full"
                  value={enrollment.course_title || ""}
                  disabled
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t("colStudent")} <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    className="input input-bordered w-full pl-9 h-10 text-sm"
                    placeholder={t("searchUserPlaceholder")}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="animate-spin text-gray-400" size={18} />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">
                      {t("noUsersFound")}
                    </p>
                  ) : (
                    filteredUsers.slice(0, 50).map((u) => (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() =>
                          setSelectedUser(
                            selectedUser?.id === u.id ? null : u,
                          )
                        }
                        className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                          selectedUser?.id === u.id
                            ? "bg-info/10"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {u.full_name || u.username}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        {selectedUser?.id === u.id && (
                          <span className="w-4 h-4 rounded-full bg-info flex items-center justify-center text-white text-xs">
                            ✓
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t("colCourse")} <span className="text-red-500">*</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setPlanId("");
                  }}
                >
                  <option value="">{t("selectCourse")}</option>
                  {(published ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t("colPlan")}
            </label>
            <select
              className="select select-bordered w-full"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={(!isEdit && !courseId) || planLocked}
            >
              <option value="">{t("freeNoPlan")}</option>
              {coursePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatPlanOption(p)}
                </option>
              ))}
            </select>
            {planLocked ? (
              <p className="text-xs text-amber-600 mt-1">
                {t("planLockedNotice")}
              </p>
            ) : (
              (isEdit || courseId) &&
              coursePlans.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {t("noPlansForCourse")}
                </p>
              )
            )}
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4">
            <span className="text-sm font-medium">{t("statusActive")}</span>
            <input
              type="checkbox"
              className="toggle toggle-info"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </div>

          {formError && <p className="text-sm text-error">{formError}</p>}

          <button
            type="submit"
            disabled={busy}
            className="btn btn-info w-full shadow-none mt-2"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEdit ? (
              t("saveChanges")
            ) : (
              t("createEnrollment")
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentFormModal;
