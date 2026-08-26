import { Award, PlayCircle, ChevronLeft, GraduationCap } from "lucide-react";
import { MathText } from "@/components/layout/MathText";

export function QuizView({
  view,
  results,
  availableQuestions,
  starting,
  error,
  router,
  t,
  handleStart,
  courseId
}) {
  if (view === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="loading loading-spinner loading-lg text-blue-500"></span>
      </div>
    );
  }
  if (view === "start") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 w-full max-w-md shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-orange-400 rounded-xl p-3 shrink-0">
              <Award size={28} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">{t("title")}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {t("meta", { count: availableQuestions })}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={starting || availableQuestions === 0 || !handleStart}
            className="w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <PlayCircle size={20} />
            {starting ? t("startingButton") : t("startButton")}
          </button>

          {availableQuestions === 0 && (
            <p className="text-xs text-center text-gray-400 mt-3">
              {t("noQuestionsHint")}
            </p>
          )}
        </div>
      </div>
    );
  }
  if (view === "completed" && results) {
    const total = results.total_questions;
    const correct = results.correct_count;

    const choiceText = (question, letter) => {
      const map = {
        A: question.choice_a,
        B: question.choice_b,
        C: question.choice_c,
        D: question.choice_d,
      };
      return map[letter] ?? letter;
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto">
            <button
              onClick={() => router.push("/courses")}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={22} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <GraduationCap size={20} className="text-blue-600" />
              <span className="font-bold text-gray-800">
                {t("resultsTitle")}
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Score card */}
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <div className="text-4xl mb-3">
              {correct === total ? "🏆" : correct >= total / 2 ? "👍" : "📚"}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {correct === total ? t("perfectScore") : t("quizCompleted")}
            </h2>
            <p className="text-gray-500 text-sm mb-5">
              {t("scoreText", { correct, total })}
            </p>
            <div className="bg-blue-50 rounded-xl p-4 max-w-40 mx-auto">
              <p className="text-2xl font-bold text-blue-600">
                {correct}/{total}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("correctAnswers")}
              </p>
            </div>
          </div>

          {/* Answer review */}
          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="font-semibold text-gray-800 mb-1">
              {t("answerReview")}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {t("answerReviewSubtitle")}
            </p>

            <div className="space-y-3">
              {(results.questions || []).map((q, i) => {
                const ua = q.user_answer;
                const isCorrect = ua?.is_correct;
                const yourChoiceText = ua?.selected_choice
                  ? choiceText(q.question, ua.selected_choice)
                  : "—";
                const correctChoiceText = choiceText(
                  q.question,
                  q.question.correct_answer,
                );

                return (
                  <div
                    key={q.id}
                    className="border border-gray-100 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <svg
                          className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {t("questionLabel", { number: i + 1 })}:{" "}
                          <MathText
                            source={q.question.question_text}
                          ></MathText>
                        </p>
                        <p
                          className={`text-xs ${isCorrect ? "text-green-600" : "text-red-500"}`}
                        >
                          {t("yourAnswer")}{" "}
                          <span className="font-semibold">
                            {" "}
                            <MathText source={yourChoiceText}></MathText>
                          </span>
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-green-600 mt-0.5">
                            {t("correctAnswer")}{" "}
                            <span className="font-semibold">
                              <MathText source={correctChoiceText}></MathText>
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="flex-1 btn btn-info rounded-xl"
            >
              {t("backToCourse")}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
