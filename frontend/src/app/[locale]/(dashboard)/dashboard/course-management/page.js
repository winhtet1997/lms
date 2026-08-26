"use client";

import {Plus} from "lucide-react";
import Link from "next/link";
import React from "react";
import CourseFilter from "./courseFilter";
import {useCourseStore} from "@/store/useCourseStore";
import {useTranslations} from "next-intl";
import {usePermission} from "@/hooks/usePermission";

const CourseManagement = () => {
    const {totalCourses, totalChapters, totalItems} =
        useCourseStore();
    const t = useTranslations("CourseManagement");
    const { can } = usePermission();
    return (
        <div className="p-4">
            <div className="md:flex items-center justify-between mb-8 ">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{t("pageTitle")}</h1>
                    <p className="text-gray-500">
                        {t("pageSubtitle")}
                    </p>
                </div>
                {can('lms_course', 'create_course') && (
                    <Link href="/dashboard/upload-course?new=true">
                        <button className="btn btn-info shadow-none">
                            <Plus/>
                            {t("createCourseButton")}
                        </button>
                    </Link>
                )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                    <div
                        className=" auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium">{t("statTotalCourses")}</div>
                    </div>
                    <div className="px-6">
                        <div className="text-2xl font-bold">{totalCourses}</div>
                        <p className="text-xs text-muted-foreground">
                            {t("statTotalCourses")}
                        </p>
                    </div>
                </div>
                <div
                    className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                    <div
                        className=" auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium">{t("statTotalChapters")}</div>
                    </div>
                    <div className="px-6">
                        <div className="text-2xl font-bold">{totalChapters}</div>
                        <p className="text-xs text-muted-foreground">
                            {t("statTotalChaptersSubtitle")}
                        </p>
                    </div>
                </div>
                <div
                    className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-gray-200 py-6 shadow-sm">
                    <div
                        className=" auto-rows-min grid-rows-[auto_auto] gap-2 px-6  flex flex-row items-center justify-between pb-2">
                        <div className="text-sm font-medium">{t("statTotalItems")}</div>
                    </div>
                    <div className="px-6">
                        <div className="text-2xl font-bold">{totalItems}</div>
                        <p className="text-xs text-muted-foreground">
                            {t("statTotalItemsSubtitle")}
                        </p>
                    </div>
                </div>
            </div>
            <div className="mt-8"></div>
            <CourseFilter/>
        </div>
    );
};

export default CourseManagement;
