"use client";

import { useCourseStore } from "@/store/useCourseStore";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GraduationCap, CheckCircle, Sparkles } from "lucide-react";
import AiSubjectCard from "./AiSubjectCard";
import CourseCard from "./CourseCard";

export default function Courses() {
  const courses = useCourseStore((state) => state.courses);
  const courseLoading = useCourseStore((state) => state.courseLoading);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);

  const t = useTranslations("CoursesPage");

  const [aiSubjects, setAiSubjects] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetch("/internal/ai-subjects")
      .then((r) => r.json())
      .then((data) => setAiSubjects(data.data ?? []))
      .catch(() => {});
  }, []);

  const published = courses.filter((c) => c.publication_status === true);

  const aiSubjectCards = aiSubjects
    .filter((s) => {
      const match = s.title.match(/Grade\s+(\d+)/i);
      if (!match) return false;
      const grade = parseInt(match[1]);
      return grade >= 7 && grade <= 11;
    })
    .sort((a, b) => {
      const gradeA = parseInt(a.title.match(/Grade\s+(\d+)/i)[1]);
      const gradeB = parseInt(b.title.match(/Grade\s+(\d+)/i)[1]);
      return gradeA !== gradeB
        ? gradeA - gradeB
        : a.title.localeCompare(b.title);
    });

  const CARD_GRADIENTS = [
    "bg-gradient-to-br from-blue-500 to-purple-600",
    "bg-gradient-to-br from-orange-400 to-orange-500",
    "bg-gradient-to-br from-teal-500 to-cyan-600",
    "bg-gradient-to-br from-pink-500 to-rose-600",
    "bg-gradient-to-br from-green-500 to-emerald-600",
  ];

  return (
    <div className="min-h-screen py-24">
      <div className="mx-auto text-center">
        <div className="card mb-12 mx-4 md:mx-0">
          <div className="card-body px-4 py-6 md:px-8 md:py-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <GraduationCap className="text-blue-500 shrink-0" size={24} />
              <h1 className="font-bold text-gray-900 text-xl md:text-3xl leading-tight">
                {t("headingPrefix")}{" "}
                <span className="bg-linear-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {t("headingHighlight")}
                </span>
              </h1>
            </div>

            <p className="text-gray-500 text-sm md:text-base max-w-xl mx-auto mb-6">
              {t("subheading")}
            </p>

            {/* <div className="flex justify-center gap-6 md:gap-12 mb-4">
              <div>
                <p className="text-xl md:text-2xl font-bold bg-linear-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  50,000+
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Active Students</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-purple-500">260+</p>
                <p className="text-xs text-gray-500 mt-0.5">Math Topics</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-pink-500">500+</p>
                <p className="text-xs text-gray-500 mt-0.5">Expert Tutors</p>
              </div>
            </div> */}
          </div>
        </div>

        {/* ── Complete courses ── */}
        <div className="max-w-7xl mx-auto px-4 mb-14">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={20} className="text-green-500" />
            <h2 className="font-bold text-gray-900 text-lg">
              {t("completeCoursesSectionTitle")}
            </h2>
          </div>
          <p className="text-gray-500 text-sm mb-6 text-left">
            {t("completeCoursesSectionSubtitle")}
          </p>

          {courseLoading ? (
            <div className="flex justify-center items-center py-24">
              <span className="loading loading-spinner loading-lg text-info" />
            </div>
          ) : published.length === 0 ? (
            <div className="py-24 text-gray-400 text-sm">{t("noCourses")}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {published.map((course, idx) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  colorClass={CARD_GRADIENTS[idx % CARD_GRADIENTS.length]}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── AI Tutor grades ── */}
        {aiSubjectCards.length > 0 && (
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={20} className="text-orange-500" />
              <h2 className="font-bold text-gray-900 text-lg">
                {t("aiTutorSectionTitle")}
              </h2>
            </div>
            <p className="text-gray-500 text-sm mb-6 text-left">
              {t("aiTutorSectionSubtitle")}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {aiSubjectCards.map((subject, idx) => (
                <AiSubjectCard
                  key={subject.id}
                  subject={subject}
                  idx={idx}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
