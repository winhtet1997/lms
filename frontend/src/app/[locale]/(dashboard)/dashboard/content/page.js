"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";
import FilterItems from "./itemFilter";
import { useCourseStore } from "@/store/useCourseStore";
import { useTranslations } from "next-intl";
import { usePermission } from "@/hooks/usePermission";

const ItemLibrary = () => {
  const t = useTranslations("ContentPage");

  const totalItems = useCourseStore((state) => state.totalItems);
  const totalVideos = useCourseStore((state) => state.totalVideos);
  const totalDocuments = useCourseStore((state) => state.totalDocuments);
  const totalScorm = useCourseStore((state) => state.totalScorm);
  const totalActivities = useCourseStore((state) => state.totalActivities);
  const totalQuizzes = useCourseStore((state) => state.totalQuizzes);

  const { can } = usePermission();

  return (
    <div className="p-4">
      <div className="md:flex items-center justify-between mb-8 ">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t("pageTitle")}</h1>
          <p className="text-gray-500">{t("pageSubtitle")}</p>
        </div>
        {can("lms_course", "create_item") && (
          <Link href="/dashboard/upload-content">
            <button className="btn btn-info shadow-none">
              <Plus />
              {t("uploadItemButton")}
            </button>
          </Link>
        )}
      </div>
      <div className="grid md:grid-cols-7 gap-3 mb-8">
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pt-3 pb-3">
            <div className="text-center">
              <div className="text-xl font-bold text-primary">{totalItems}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("statTotal")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card text-card-xforeground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pt-3 pb-3">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">
                {totalVideos}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("statVideos")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pt-3 pb-3">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {totalDocuments}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("statDocuments")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pt-3 pb-3">
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600">
                {totalScorm}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("statScorm")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pt-3 pb-3">
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600">
                {totalActivities}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("statActivities")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pt-3 pb-3">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">
                {totalQuizzes}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("statQuizzes")}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
          <div className="px-6 pt-3 pb-3">
            <div className="text-center">
              <div className="text-xl font-bold text-orange-600">0</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t("statAssessments")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <FilterItems />
    </div>
  );
};

export default ItemLibrary;
