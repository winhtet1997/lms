"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  CircleCheck,
  CircleAlert,
  Clock,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCoursePurchaseStore } from "@/store/useCoursePurchaseStore";
import { useParentStore } from "@/store/useParentStore";
import { courseService } from "@/service/courseService";
import StudentSubNavbar from "@/components/layout/StudentSubNavbar";

const PARENT_ROLE = "Parent";

const redirectToCheckout = (url) => {
  window.location.href = url;
};

const SubscribePage = () => {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("SubscribePage");
  const { isAuthenticated, user } = useAuthStore();
  const {
    plans,
    myEnrollment,
    loading,
    initializing,
    error,
    fetchCoursePlans,
    fetchMyEnrollment,
    initializePayment,
  } = useCoursePurchaseStore();
  const { children, fetchChildren } = useParentStore();

  const isParent = user?.role === PARENT_ROLE;

  const [mounted, setMounted] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push("/login/student");
      return;
    }
    if (!id) return;
    fetchCoursePlans(id);
    courseService
      .getCourseByIdBasic(id)
      .then((data) => setCourseTitle(data?.title ?? ""));
    if (isParent) fetchChildren();
  }, [mounted, isAuthenticated, id, router, fetchCoursePlans, isParent, fetchChildren]);

  useEffect(() => {
    if (!mounted || !isAuthenticated || !id) return;
    if (isParent && !selectedChildId) return;
    fetchMyEnrollment(id, isParent ? selectedChildId : undefined);
  }, [mounted, isAuthenticated, id, isParent, selectedChildId, fetchMyEnrollment]);

  const isActive = Boolean(myEnrollment?.enrolled && myEnrollment?.is_active);
  const canSubscribe = !isParent || Boolean(selectedChildId);

  const pricedPlans = plans.map((plan) => ({
    ...plan,
    perDay: plan.days ? Number(plan.price) / plan.days : null,
  }));

  const handleSubscribe = async (planId) => {
    setSelectedPlanId(planId);
    try {
      const { checkout_url } = await initializePayment(
        planId,
        isParent ? selectedChildId : undefined,
      );
      redirectToCheckout(checkout_url);
    } catch {
      setSelectedPlanId(null);
    }
  };

  return (
    <>
      <StudentSubNavbar />
      <div className="min-h-screen bg-linear-to-b from-slate-50 to-white py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href={`/courses/${id}`}
            className="btn btn-ghost btn-sm gap-1.5 text-gray-500 hover:text-gray-800 px-2 mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("backToCourseLink")}
          </Link>

          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-2 flex items-center justify-center text-white shadow-md shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-gray-900">{t("pageTitle")}</h3>
              <p className="text-gray-500 mt-1 text-sm md:text-base">
                {courseTitle ? `${courseTitle} — ` : ""}
                {t("pageSubtitle")}
              </p>
            </div>
          </div>

          {isParent && (
            <div className="card border border-gray-200 shadow-sm mb-6 bg-white">
              <div className="card-body p-5 md:p-6">
                <label className="font-semibold text-sm mb-3 flex items-center gap-2 text-gray-700">
                  <Users size={16} className="text-primary" />
                  {t("buyingForLabel")}
                </label>
                {children.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    {t("noChildrenForPurchase")}{" "}
                    <Link href="/parents/home" className="link link-primary font-medium">
                      {t("addChildLink")}
                    </Link>
                  </p>
                ) : (
                  <select
                    className="select select-bordered w-full focus:outline-primary"
                    value={selectedChildId ?? ""}
                    onChange={(e) => setSelectedChildId(e.target.value || null)}
                  >
                    <option value="">{t("selectChildDefault")}</option>
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.full_name || child.username}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {isActive && (
            <div className="card border border-emerald-200 shadow-sm mb-8 bg-emerald-50">
              <div className="card-body p-5 md:p-6 flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CircleCheck size={20} />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800">
                    {t("currentPlanLabel")}: {myEnrollment.plan?.name ?? myEnrollment.plan}
                  </p>
                  {myEnrollment.expires_at && (
                    <p className="text-sm text-emerald-600 mt-0.5">
                      {t("activeUntilLabel")}{" "}
                      {new Date(myEnrollment.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-sm">{t("loadingText")}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="card bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <p className="text-gray-500">{t("noPlansMessage")}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {pricedPlans.map((plan) => {
                const isBestValue = Boolean(plan.is_recommended);
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col bg-white rounded-2xl p-6 transition-all duration-200 h-full ${
                      isBestValue
                        ? "border-2 border-primary shadow-lg"
                        : "border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200"
                    }`}
                  >
                    {isBestValue && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                        {t("bestValueBadge")}
                      </span>
                    )}

                    <h5 className="text-gray-900">
                      {plan.name || t("planDuration", { days: plan.days })}
                    </h5>
                    {plan.description && (
                      <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                    )}

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900">
                        {plan.price}
                      </span>
                      <span className="text-sm font-medium text-gray-500">
                        {plan.currency}
                      </span>
                    </div>
                    {plan.perDay != null && (
                      <p className="text-xs text-gray-400 mt-1">
                        {t("perDayLabel", {
                          price: plan.perDay.toFixed(2),
                          currency: plan.currency,
                        })}
                      </p>
                    )}

                    <div className="border-t border-gray-100 mt-4 pt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} className="text-primary shrink-0" />
                        {t("planDuration", { days: plan.days })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CircleCheck size={14} className="text-emerald-500 shrink-0" />
                        {t("fullAccessBenefit")}
                      </div>
                    </div>

                    <div className="mt-6 pt-0">
                      <button
                        className={`btn btn-sm w-full border-none shadow-none ${
                          isBestValue
                            ? "bg-primary text-white"
                            : "bg-info text-white"
                        }`}
                        disabled={initializing || !canSubscribe}
                        onClick={() => handleSubscribe(plan.id)}
                      >
                        {initializing && selectedPlanId === plan.id
                          ? t("redirectingButton")
                          : isActive
                            ? t("renewButton")
                            : t("subscribeButton")}
                      </button>
                      {!canSubscribe && (
                        <p className="text-[11px] text-amber-600 mt-2 text-center">
                          {t("selectChildHint")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="alert alert-error bg-red-50 border border-red-200 shadow-none mt-6 items-start">
              <CircleAlert color="#dc2626" size={16} className="mt-0.5 shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SubscribePage;
