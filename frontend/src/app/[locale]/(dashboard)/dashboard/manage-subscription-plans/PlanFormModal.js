"use client";

import { Loader2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCourseStore } from "@/store/useCourseStore";

const PlanFormModal = ({ plan, onClose, onSubmit }) => {
  const t = useTranslations("ManageSubscriptionPlans");
  const isEdit = Boolean(plan);

  const courses = useCourseStore((state) => state.courses);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);

  const [courseId, setCourseId] = useState(plan?.course ?? "");
  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [days, setDays] = useState(plan?.days ?? 30);
  const [price, setPrice] = useState(plan?.price ?? "");
  const [currency, setCurrency] = useState(plan?.currency ?? "USD");
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);
  const [isRecommended, setIsRecommended] = useState(
    plan?.is_recommended ?? false,
  );
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isEdit) fetchCourses({ page_size: 100 });
  }, [isEdit, fetchCourses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!isEdit && !courseId) {
      setFormError(t("courseRequired"));
      return;
    }
    if (!name.trim()) {
      setFormError(t("nameRequired"));
      return;
    }
    if (!days || Number(days) <= 0) {
      setFormError(t("daysRequired"));
      return;
    }
    if (price === "" || Number(price) < 0) {
      setFormError(t("priceRequired"));
      return;
    }

    setBusy(true);
    try {
      const payload = isEdit
        ? {
            name: name.trim(),
            description: description.trim(),
            days: Number(days),
            price: Number(price),
            currency,
            is_active: isActive,
            is_recommended: isRecommended,
          }
        : {
            course: Number(courseId),
            name: name.trim(),
            description: description.trim(),
            days: Number(days),
            price: Number(price),
            currency,
            is_active: isActive,
            is_recommended: isRecommended,
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-gray-400"
        >
          <X size={16} />
        </button>
        <h2 className="text-lg font-semibold mb-6">
          {isEdit ? t("editPlanTitle") : t("addPlanTitle")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t("colCourse")} <span className="text-red-500">*</span>
            </label>
            {isEdit ? (
              <input
                className="input input-bordered w-full"
                value={plan.course_title || ""}
                disabled
              />
            ) : (
              <select
                className="select select-bordered w-full"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">{t("selectCourse")}</option>
                {(courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t("colName")} <span className="text-red-500">*</span>
            </label>
            <input
              className="input input-bordered w-full"
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t("colDescription")}
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              placeholder={t("descriptionPlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {t("colDuration")} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="input input-bordered w-full"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {t("colPrice")} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input input-bordered w-full"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t("currencyLabel")}
            </label>
            <input
              className="input input-bordered w-full"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={5}
            />
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
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4">
            <span className="text-sm font-medium">{t("isRecommendedLabel")}</span>
            <input
              type="checkbox"
              className="toggle toggle-info"
              checked={isRecommended}
              onChange={(e) => setIsRecommended(e.target.checked)}
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
              t("createPlan")
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlanFormModal;
