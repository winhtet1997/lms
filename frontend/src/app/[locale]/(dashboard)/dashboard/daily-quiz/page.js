"use client";

import {useEffect, useState} from "react";
import {BookOpen, Upload} from "lucide-react";
import Link from "next/link";
import {quizService} from "@/service/quizService";
import {useTranslations} from "next-intl";
import { usePermission } from "@/hooks/usePermission";

export default function DailyQuizPage() {
    const t = useTranslations("DailyQuizAdmin");
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const { can } = usePermission();

    useEffect(() => {
        quizService.getCourseList()
            .then((data) => setCourses(data ?? []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1">{t("pageTitle")}</h1>
                    <p className="text-gray-500">{t("pageSubtitle")}</p>
                </div>
                {can('lms_course', 'create_daily_quiz') && (
                    <Link href="/dashboard/daily-quiz/upload">
                        <button className="btn btn-info shadow-none gap-2">
                            <Upload size={16}/>
                            {t("uploadButton")}
                        </button>
                    </Link>
                )}
            </div>

            {/* Course grid */}
            {loading ?? courses.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No courses available.</div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const courseId = course.course_id ?? course.id;
                        const count = course.count ?? 0;
                        return (
                            <div
                                key={courseId}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-100 rounded-xl p-3 shrink-0">
                                        <BookOpen size={24} className="text-gray-600"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-lg line-clamp-3">{course.name}</p>
                                        <p className="text-sm text-gray-400">Grade {course.grade_level}</p>
                                        <p className="text-sm text-gray-500">
                                            {count > 0 ? t("questionCount", {count}) : t("noQuestions")}
                                        </p>
                                    </div>
                                </div>
                                {count > 0 ? (
                                    <Link href={`/dashboard/daily-quiz/${courseId}`} className="w-full">
                                        <button className="btn btn-info w-full shadow-none">
                                            {t("viewButton")}
                                        </button>
                                    </Link>
                                ) : (
                                    <button className="btn btn-info w-full shadow-none" disabled>
                                        {t("viewButton")}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}