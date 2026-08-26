"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, GraduationCap } from "lucide-react";
import { quizService } from "@/service/quizService";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import { MathText } from "@/components/layout/MathText";
import { QuizView } from "./_QuizView";

export default function DailyQuizPage() {
  const t = useTranslations("DailyQuiz");
  const router = useRouter();
  const searchParams = useSearchParams();
  const autostart = searchParams.get("autostart") === "true";
  const courseId = searchParams.get("course_id");
  const { isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState("loading"); // loading | start | quiz | completed
  const [quiz, setQuiz] = useState(null);
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.push("/login/student");
      return;
    }
    quizService
      .getStatus(courseId)
      .then(async (data) => {
        if (data.exists) {
          setQuiz(data);
          const prefilled = {};
          (data.questions || []).forEach((q) => {
            if (q.user_answer?.selected_choice) {
              prefilled[q.id] = q.user_answer.selected_choice;
            }
          });
          setAnswers(prefilled);
          if (data.is_completed) {
            quizService.getResults(data.id).then(setResults);
            setView("completed");
          } else {
            setView("quiz");
          }
        } else if (autostart) {
          // Skip the start card and launch directly
          setAvailableQuestions(data.available_questions || 0);
          try {
            const started = await quizService.start(courseId);
            setQuiz(started);
            setCurrentIndex(0);
            setAnswers({});
            setView("quiz");
          } catch (err) {
            setError(err?.response?.data?.error || t("errorStart"));
            setView("start");
          }
        } else {
          setAvailableQuestions(data.available_questions || 0);
          setView("start");
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.error || t("errorStart"));
        setView("start");
      });
  }, [mounted, isAuthenticated, router, autostart]);

  const handleStart = async () => {
    setStarting(true);
    setError(null);
    try {
      const data = await quizService.start(courseId);
      setQuiz(data);
      setCurrentIndex(0);
      setAnswers({});
      setView("quiz");
    } catch (err) {
      setError(err?.response?.data?.error || t("errorStart"));
    } finally {
      setStarting(false);
    }
  };

  const handleSelectChoice = (dqqId, choice) => {
    setAnswers((prev) => ({ ...prev, [dqqId]: choice }));
  };

  const handleNext = async () => {
    const questions = quiz.questions || [];
    const current = questions[currentIndex];
    const choice = answers[current.id];

    if (choice && !current.user_answer) {
      await quizService
        .submitAnswer(quiz.id, current.id, choice)
        .catch(() => {});
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const handleFinish = async () => {
    setSubmitting(true);
    setError(null);
    const questions = quiz.questions || [];

    for (const q of questions) {
      const choice = answers[q.id];
      if (choice && !q.user_answer) {
        await quizService.submitAnswer(quiz.id, q.id, choice).catch(() => {});
      }
    }

    try {
      const res = await quizService.getResults(quiz.id);
      setResults(res);
      setView("completed");
    } catch {
      setError(t("errorSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  if (view !== "quiz") {
    return (
      <QuizView
        view={view}
        results={results}
        availableQuestions={availableQuestions}
        starting={starting}
        error={error}
        router={router}
        t={t}
        handleStart={handleStart}
        courseId={courseId}
      />
    );
  }

  // ── QUIZ ─────────────────────────────────────────────────────
  const questions = quiz?.questions || [];
  const total = questions.length;
  const current = questions[currentIndex];
  const isLast = currentIndex === total - 1;
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const selectedChoice = current ? answers[current.id] : null;
  const alreadyAnswered = !!current?.user_answer;

  const choices = current
    ? [
        { key: "A", text: current.question.choice_a },
        { key: "B", text: current.question.choice_b },
        { key: "C", text: current.question.choice_c },
        { key: "D", text: current.question.choice_d },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto w-full">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={22} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-2">
            <GraduationCap size={22} className="text-blue-600" />
            <span className="font-bold text-gray-800 text-base">
              {t("title")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">
              {t("questionOf", { current: currentIndex + 1, total })}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 w-full">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow w-full max-w-2xl p-6">
          {/* Badge row */}
          <div className="flex items-center mb-5">
            <span className="bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {t("questionLabel", { number: currentIndex + 1 })}
            </span>
          </div>

          {/* Question text */}
          <p className="text-gray-800 font-semibold text-lg mb-6">
            <MathText source={current?.question.question_text}></MathText>
          </p>

          {/* Choices */}
          <div className="space-y-3 mb-8">
            {choices.map(({ key, text }) => {
              const isSelected =
                selectedChoice === key ||
                (alreadyAnswered &&
                  current.user_answer?.selected_choice === key);
              return (
                <label
                  key={key}
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  } ${alreadyAnswered ? "cursor-default" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name={`question-${current?.id}`}
                    value={key}
                    checked={isSelected}
                    onChange={() =>
                      !alreadyAnswered && handleSelectChoice(current.id, key)
                    }
                    className="radio radio-primary radio-sm"
                    disabled={alreadyAnswered}
                  />
                  <span className="text-gray-700 text-sm">
                    <MathText source={text}></MathText>
                  </span>
                </label>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("previousButton")}
            </button>

            {isLast ? (
              <button
                onClick={handleFinish}
                disabled={submitting || (!selectedChoice && !alreadyAnswered)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {submitting ? t("submittingButton") : t("finishButton")}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!selectedChoice && !alreadyAnswered}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t("nextButton")}
              </button>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center mt-4">{error}</p>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-center gap-12 mt-8 text-center">
          <div>
            <p className="text-xl font-bold text-gray-800">{total}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("totalQuestions")}
            </p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800">~3 min</p>
            <p className="text-xs text-gray-500 mt-0.5">{t("estimatedTime")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
