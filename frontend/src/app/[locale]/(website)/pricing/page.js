"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Clock,
  PackageOpen,
  SlidersHorizontal,
  Sparkles,
  Star,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCoursePurchaseStore } from "@/store/useCoursePurchaseStore";
import { courseService } from "@/service/courseService";

const redirectToCheckout = (url) => {
  window.location.href = url;
};

const PricingListPage = () => {
  const router = useRouter();
  const t = useTranslations("PricingListPage");
  const tNav = useTranslations("Navbar");
  const { isAuthenticated } = useAuthStore();
  const { plans, loading, initializing, error, fetchPlans, initializePayment } =
    useCoursePurchaseStore();

  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push("/login/student?pricing=true");
      return;
    }
    courseService.getCourses().then((data) => setCourses(data?.courses ?? []));
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    fetchPlans({ course_id: courseId || undefined });
  }, [mounted, isAuthenticated, courseId, fetchPlans]);

  const pricedPlans = plans.map((plan) => ({
    ...plan,
    perDay: plan.days ? Number(plan.price) / plan.days : null,
  }));

  const handleSubscribe = async (planId) => {
    setSelectedPlanId(planId);
    try {
      const { checkout_url } = await initializePayment(planId);
      redirectToCheckout(checkout_url);
    } catch {
      setSelectedPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      {/* Hero */}
      <div className=" pt-16 md:pt-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
         
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t("pageTitle")}
          </h1>
          <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto">
            {t("pageSubtitle")}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        {/* Filter bar */}
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-3 mb-10 max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center shrink-0">
            <SlidersHorizontal size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-medium text-gray-400 block leading-none mb-1">
              {t("courseFilterLabel")}
            </label>
            <select
              className="select select-bordered select-sm w-full border-none  px-0 focus:outline-none"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">{t("allCoursesOption")}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-sm">{t("loadingText")}</p>
          </div>
        ) : pricedPlans.length === 0 ? (
          <div className="flex flex-col items-center gap-3 bg-linear-to-br from-slate-50 to-white border border-gray-200 rounded-2xl p-14 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <PackageOpen size={22} />
            </div>
            <p className="text-gray-500">{t("noPlansMessage")}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricedPlans.map((plan) => {
              const isBestValue = Boolean(plan.is_recommended);
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-white rounded-2xl p-6 transition-all duration-200 h-full hover:-translate-y-1 ${
                    isBestValue
                      ? "border-2 border-primary shadow-lg shadow-primary/10"
                      : "border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200"
                  }`}
                >
                  {isBestValue && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-linear-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      <Star size={10} className="fill-current" />
                      {t("bestValueBadge")}
                    </span>
                  )}

                  <span className="inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 uppercase tracking-wide px-2.5 py-1 rounded-full">
                    {plan.course_title}
                  </span>
                  <h5 className="text-gray-900 font-bold text-lg mt-3">
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
                      className={`btn btn-sm w-full border-none shadow-none gap-1.5 ${
                        isBestValue
                          ? "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          : "bg-info text-white"
                      }`}
                      disabled={initializing}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {initializing && selectedPlanId === plan.id ? (
                        t("redirectingButton")
                      ) : (
                        <>
                          {t("subscribeButton")}
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
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
  );
};

export default PricingListPage;
