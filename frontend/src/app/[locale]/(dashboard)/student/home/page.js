'use client'

import { useCourseStore } from '@/store/useCourseStore';
import {
    Play,
    BookOpen,
    GraduationCap,
    ArrowRight,
    Sparkles,
    Clock,
    Unlock,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useEnrollmentStore } from '@/store/useEnrollmentStore';

const cardGradients = [
    "bg-linear-to-br from-blue-500 to-cyan-400",
    "bg-linear-to-br from-purple-600 to-indigo-500",
    "bg-linear-to-br from-emerald-500 to-teal-400",
    "bg-linear-to-br from-orange-500 to-amber-400",
    "bg-linear-to-br from-pink-500 to-rose-400",
    "bg-linear-to-br from-slate-700 to-slate-500",
];

const MyCourseRow = ({ enrollment, index, t }) => {
    const isExpired = enrollment.is_active === false && !!enrollment.expires_at
        && new Date(enrollment.expires_at) < new Date();

    const statusBadge = enrollment.is_active
        ? { label: t("activeStatus"), className: "bg-emerald-100 text-emerald-700" }
        : isExpired
            ? { label: t("expiredStatus"), className: "bg-gray-200 text-gray-600" }
            : { label: t("pendingStatus"), className: "bg-amber-100 text-amber-700" };

    const planLabel = enrollment.plan && enrollment.plan !== "Free"
        ? `${enrollment.plan.name} — ${enrollment.plan.price} ${enrollment.plan.currency}`
        : t("freePlanLabel");

    const expiresLabel = enrollment.expires_at
        ? new Date(enrollment.expires_at).toLocaleDateString()
        : "N/A";
    const progress = enrollment.course_progress ?? 0;
    const isLocked = !enrollment.is_active;

    return (
        <div className="group relative flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
            <Link
                href={`/courses/${enrollment.course_id ?? enrollment.course}`}
                className="absolute inset-0 rounded-xl"
                aria-label={`${t("viewCourseButton")} ${enrollment.course_title}`}
            />
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${cardGradients[index % cardGradients.length]}`}>
                <GraduationCap size={18} />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-gray-800 truncate">
                        {enrollment.course_title}
                    </h3>
                    <span className={`badge badge-sm rounded-full text-[10px] whitespace-nowrap shrink-0 ${statusBadge.className}`}>
                        {statusBadge.label}
                    </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{planLabel}</p>
                {enrollment.is_active && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={11} />
                        {t("expiresOnLabel", { date: expiresLabel })}
                    </p>
                )}
            </div>
            {isLocked ? (
                <Link
                    href={`/courses/${enrollment.course_id ?? enrollment.course}/subscribe`}
                    className="relative z-10 btn btn-sm bg-indigo-50 text-indigo-600 border-none shadow-none rounded-lg gap-1.5 shrink-0"
                >
                    <Unlock size={14} />
                    {t("unlockButton")}
                </Link>
            ) : (
                <div
                    className="radial-progress text-indigo-600 shrink-0"
                    style={{ "--value": progress, "--size": "2.75rem", "--thickness": "3px" }}
                    aria-valuenow={progress}
                    role="progressbar"
                >
                    <span className="text-[10px] font-bold text-gray-700">{progress}%</span>
                </div>
            )}
            <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
        </div>
    );
};

const StudentHome = () => {
    const { course, lastViewedItem, fetchCourseById } = useCourseStore();
    const { myEnrollments, fetchMyEnrollments } = useEnrollmentStore();
    const t = useTranslations("ChapterDetailsPage");
    const tHome = useTranslations("StudentHomePage");
    const locale = useLocale();

    useEffect(() => {
        fetchMyEnrollments();
        if (!course && lastViewedItem?.courseId) {
            fetchCourseById(lastViewedItem.courseId);
        }
    }, [lastViewedItem, course, fetchCourseById, fetchMyEnrollments]);

    return (
        <div className="container mx-auto px-4 pt-12 md:pt-16 max-w-6xl">

            {/* Continue Learning Hero */}
            {lastViewedItem ? (
                <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm p-6 md:p-10 mb-10">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-100 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-purple-100 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-info mb-2">
                                <Play size={14} className="fill-current" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {t("continueLearningHeading")}
                                </span>
                            </div>
                            {course && <p className="text-gray-400 text-xs mb-1">{course.title}</p>}
                            <p className="text-lg md:text-2xl font-bold text-gray-800 mb-1 line-clamp-2">
                                {lastViewedItem.title}
                            </p>
                            <p className="text-gray-400 text-xs capitalize">
                                {lastViewedItem.type} • {lastViewedItem.duration || "N/A"} min
                            </p>
                        </div>
                        <Link
                            href={`/courses/${course?.id}/chapter-details/${lastViewedItem.chapterId}/${lastViewedItem.id}`}
                            className="relative shrink-0"
                        >
                            <button className="btn bg-info text-white border-none shadow-none rounded-xl gap-2 w-full md:w-auto">
                                {t("continueButton")}
                                <ArrowRight size={16} />
                            </button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm p-6 md:p-10 mb-10 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-info-100 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative bg-info-50 p-2.5 rounded-xl text-info shrink-0">
                        <Sparkles size={20} />
                    </div>
                    <div className="relative">
                        <p className="font-bold text-gray-800">{tHome("getStartedHeading")}</p>
                        <p className="text-sm text-gray-500">{tHome("getStartedMessage")}</p>
                    </div>
                </div>
            )}

            {/* My Courses Section */}
            <div className="mb-10">
                <h2 className="text-base font-bold text-gray-800 mb-4">{tHome("myCoursesHeading")}</h2>
                {myEnrollments.length === 0 ? (
                    <div className="card bg-white border border-gray-200 rounded-2xl p-8 text-center">
                        <div className="bg-indigo-50 text-indigo-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                            <BookOpen size={20} />
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{tHome("noEnrollmentsMessage")}</p>
                        <Link href={`/${locale}/courses`} className="inline-block">
                            <button className="btn btn-info btn-sm shadow-none border-none text-white rounded-lg">
                                {tHome("browseCoursesButton")}
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {myEnrollments.map((enrollment, index) => (
                            <MyCourseRow key={enrollment.id} enrollment={enrollment} index={index} t={tHome} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentHome;
