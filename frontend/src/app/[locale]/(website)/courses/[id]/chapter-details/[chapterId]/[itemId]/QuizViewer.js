"use client";
import { useEffect, useRef, useState } from "react";
import { Clock, GraduationCap, PlayCircle } from "lucide-react";
import { MathText } from "@/components/layout/MathText";
import { courseService } from "@/service/courseService";

const CHOICE_KEYS = ["A", "B", "C", "D"];
const CHOICE_FIELDS = { A: "choice_a", B: "choice_b", C: "choice_c", D: "choice_d" };

function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

export default function QuizViewer({ item, isAuthenticated, onComplete }) {
    const itemId = item?.id;
    const timeLimitSecs = Math.round((item?.duration || 0) * 60);

    const [view, setView] = useState("start"); // start | quiz | completed
    const [attempt, setAttempt] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    // answers: { [questionId]: { choice, submitted, is_correct } }
    const [answers, setAnswers] = useState({});
    const [checkResult, setCheckResult] = useState(null);
    const [results, setResults] = useState(null);
    const [previousResults, setPreviousResults] = useState(null);
    const [starting, setStarting] = useState(false);
    const [checking, setChecking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(timeLimitSecs || null);
    const timerRef = useRef(null);

    // Check for a previous completed attempt on mount
    useEffect(() => {
        if (!isAuthenticated || !itemId) return;
        courseService.getLatestQuizAttempt(itemId)
            .then((data) => {
                if (data.correct_count !== undefined) {
                    setPreviousResults(data);
                }
            })
            .catch(() => {}); // 404 = no previous attempt, that's fine
    }, [itemId, isAuthenticated]);

    // Timer countdown
    useEffect(() => {
        if (view !== "quiz" || !timeLimitSecs) return;
        setTimeLeft(timeLimitSecs);
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    handleFinish();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    const handleStart = async () => {
        if (!isAuthenticated) return;
        setStarting(true);
        setError(null);
        try {
            const data = await courseService.startQuizAttempt(itemId);
            // Pre-fill any already-submitted answers (resume attempt)
            const prefilled = {};
            (data.questions || []).forEach((q) => {
                if (q.user_answer?.selected_choice) {
                    prefilled[q.id] = {
                        choice: q.user_answer.selected_choice,
                        submitted: true,
                        is_correct: q.user_answer.is_correct,
                    };
                }
            });
            setAttempt(data);
            setQuestions(data.questions || []);
            setAnswers(prefilled);
            setCurrentIndex(0);
            setCheckResult(null);
            setView("quiz");
        } catch (err) {
            setError(err?.response?.data?.error || "Failed to start quiz.");
        } finally {
            setStarting(false);
        }
    };

    const handleSelectChoice = (questionId, choice) => {
        if (answers[questionId]?.submitted) return;
        setAnswers((prev) => ({ ...prev, [questionId]: { choice, submitted: false } }));
        setCheckResult(null);
    };

    const handleCheckAnswer = async () => {
        const current = questions[currentIndex];
        const entry = answers[current.id];
        if (!entry || entry.submitted) return;
        setChecking(true);
        try {
            const result = await courseService.submitQuizAnswer(attempt.id, current.id, entry.choice);
            setAnswers((prev) => ({
                ...prev,
                [current.id]: {
                    ...prev[current.id],
                    submitted: true,
                    is_correct: result.is_correct,
                    correct_answer: result.correct_answer,
                    explanation: result.explanation,
                },
            }));
            setCheckResult(result);
        } catch (err) {
            setError(err?.response?.data?.error || "Failed to submit answer.");
        } finally {
            setChecking(false);
        }
    };

    const goTo = (index) => {
        setCheckResult(null);
        setCurrentIndex(index);
    };

    const handleFinish = async () => {
        clearInterval(timerRef.current);
        setSubmitting(true);
        setError(null);
        try {
            const res = await courseService.getQuizResults(attempt.id);
            setResults(res);
            setView("completed");
            onComplete?.();
        } catch {
            setError("Failed to get results.");
        } finally {
            setSubmitting(false);
        }
    };

    const totalQuestions = questions.length;
    const answeredCount = Object.values(answers).filter((a) => a.submitted).length;
    const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

    // ── START ──────────────────────────────────────────────────────
    if (view === "start") {
        const hasPrev = !!previousResults;
        return (
            <div className="flex items-center justify-center py-16 px-4">
                <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-xl shadow-sm text-center">
                    <div className="bg-blue-100 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <GraduationCap size={32} className="text-info" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">{item?.title}</h2>
                    <p className="text-sm text-gray-500 mb-2">
                        {item?.item_questions ?? "?"} questions
                        {timeLimitSecs > 0 && ` · ${Math.round(item.duration)} min time limit`}
                    </p>

                    {hasPrev && (
                        <p className="text-sm font-medium text-green-600 mb-6">
                            Last score: {previousResults.score}% ({previousResults.correct_count}/{previousResults.total_questions} correct)
                        </p>
                    )}

                    {!hasPrev && <div className="mb-6" />}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2 mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        {hasPrev && (
                            <button
                                onClick={() => { setResults(previousResults); setView("completed"); }}
                                className="w-full bg-info hover:bg-sky-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                View Results
                            </button>
                        )}
                        <button
                            onClick={handleStart}
                            disabled={starting || !isAuthenticated}
                            className={`w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                                hasPrev
                                    ? "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    : "bg-info hover:bg-sky-800 text-white"
                            }`}
                        >
                            <PlayCircle size={20} />
                            {starting ? "Starting…" : hasPrev ? "Retake Quiz" : "Start Quiz"}
                        </button>
                    </div>

                    {!isAuthenticated && (
                        <p className="text-xs text-gray-400 mt-3">Sign in to take this quiz.</p>
                    )}
                </div>
            </div>
        );
    }

    // ── COMPLETED ──────────────────────────────────────────────────
    if (view === "completed" && results) {
        const { score, total_questions, correct_count, passed } = results;

        const getChoiceText = (q, letter) => {
            const field = CHOICE_FIELDS[letter];
            return q?.question?.[field] ?? letter;
        };

        return (
            <div className="py-6 px-4 max-w-2xl mx-auto space-y-4">
                {/* Score card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
                    <div className="text-4xl mb-3">
                        {passed ? "🏆" : correct_count >= total_questions / 2 ? "👍" : "📚"}
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">
                        {passed ? "Quiz Passed!" : "Quiz Completed"}
                    </h2>
                    <p className="text-sm text-gray-500 mb-5">
                        You scored {correct_count} out of {total_questions}
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <p className="text-2xl font-bold text-blue-600">{correct_count}/{total_questions}</p>
                            <p className="text-xs text-gray-500 mt-1">Correct</p>
                        </div>
                        <div className={`rounded-xl p-4 ${passed ? "bg-green-50" : "bg-red-50"}`}>
                            <p className={`text-2xl font-bold ${passed ? "text-green-600" : "text-red-500"}`}>
                                {score}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Score</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl p-4">
                            <p className="text-2xl font-bold text-amber-500">+{correct_count * 10} XP</p>
                            <p className="text-xs text-gray-500 mt-1">Earned</p>
                        </div>
                    </div>
                </div>

                {/* Answer review */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">Answer Review</h3>
                    <div className="space-y-4">
                        {(results.questions || []).map((q, i) => {
                            const ua = q.user_answer;
                            const isCorrect = ua?.is_correct;
                            const yourText = ua?.selected_choice ? getChoiceText(q, ua.selected_choice) : "—";
                            const correctText = getChoiceText(q, q.question?.correct_answer);

                            return (
                                <div key={q.id} className="border border-gray-100 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className={`mt-0.5 shrink-0 text-lg ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                                            {isCorrect ? "✓" : "✗"}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-700 mb-2">
                                                Q{i + 1}: <MathText source={q.question?.question_text} />
                                            </p>
                                            <p className={`text-xs ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                                                Your answer: <span className="font-semibold"><MathText source={yourText} /></span>
                                            </p>
                                            {!isCorrect && (
                                                <p className="text-xs text-green-600 mt-0.5">
                                                    Correct answer: <span className="font-semibold"><MathText source={correctText} /></span>
                                                </p>
                                            )}
                                            {q.question?.explanation && (
                                                <p className="text-xs text-blue-600 mt-1.5 bg-blue-50 rounded-lg px-3 py-1.5">
                                                    <span className="font-semibold">Explanation: </span>
                                                    <MathText source={q.question.explanation} />
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={() => { setView("start"); setResults(null); setAttempt(null); setAnswers({}); setCheckResult(null); }}
                    className="w-full btn btn-outline rounded-xl"
                >
                    Retake Quiz
                </button>
            </div>
        );
    }

    // ── QUIZ ───────────────────────────────────────────────────────
    const current = questions[currentIndex];
    const currentAnswer = current ? answers[current.id] : null;
    const isSubmitted = !!currentAnswer?.submitted;
    const isLast = currentIndex === totalQuestions - 1;
    const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

    const choices = current
        ? CHOICE_KEYS.map((key) => ({ key, text: current.question[CHOICE_FIELDS[key]] }))
        : [];

    const timerWarning = timeLeft !== null && timeLeft < 60;

    return (
        <div className="flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                    Question {currentIndex + 1} of {totalQuestions}
                </span>
                {timeLeft !== null && (
                    <span className={`flex items-center gap-1 text-sm font-mono font-semibold ${timerWarning ? "text-red-500" : "text-gray-500"}`}>
                        <Clock size={14} />
                        {formatTime(timeLeft)}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 w-full">
                <div
                    className="h-full bg-info transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Question card */}
            <div className="py-6 px-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-5xl mx-auto">
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-5">
                        {isSubmitted ? (
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                currentAnswer.is_correct
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                            }`}>
                                {currentAnswer.is_correct ? "✓ Correct" : "✗ Incorrect"}
                            </span>
                        ) : (
                            <span className="bg-info text-white text-xs font-semibold px-3 py-1 rounded-full">
                                Question {currentIndex + 1}
                            </span>
                        )}
                        <span className="text-xs text-gray-400">{answeredCount}/{totalQuestions} answered</span>
                    </div>

                    {/* Question text */}
                    <p className="text-gray-800 font-semibold text-base mb-5 leading-relaxed">
                        <MathText source={current?.question?.question_text} />
                    </p>

                    {/* Choices */}
                    <div className="space-y-2.5 mb-6">
                        {choices.map(({ key, text }) => {
                            const isSelected = currentAnswer?.choice === key;
                            const isCorrectKey = isSubmitted && !currentAnswer?.is_correct && key === currentAnswer?.correct_answer;
                            const choiceClass = isSubmitted
                                ? isSelected
                                    ? currentAnswer.is_correct
                                        ? "border-green-400 bg-green-50 text-green-800"
                                        : "border-red-400 bg-red-50 text-red-800"
                                    : isCorrectKey
                                        ? "border-green-400 bg-green-50 text-green-800"
                                        : "border-gray-200 bg-gray-50 text-gray-500 opacity-60"
                                : isSelected
                                    ? "border-info bg-blue-100"
                                    : "border-gray-200 hover:border-info hover:bg-gray-50";

                            return (
                                <button
                                    key={key}
                                    onClick={() => handleSelectChoice(current.id, key)}
                                    disabled={isSubmitted}
                                    className={`w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-colors ${choiceClass} disabled:cursor-default`}
                                >
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                                        isSelected ? "border-current" : "border-gray-300 text-gray-400"
                                    }`}>
                                        {key}
                                    </span>
                                    <span className="text-sm"><MathText source={text} /></span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Explanation (shown after checking) */}
                    {isSubmitted && currentAnswer?.explanation && (
                        <div className="mb-5 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                            <span className="font-semibold">Explanation: </span>
                            <MathText source={currentAnswer.explanation} />
                        </div>
                    )}

                    {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => goTo(currentIndex - 1)}
                            disabled={currentIndex === 0}
                            className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>

                        {!isSubmitted ? (
                            <button
                                onClick={handleCheckAnswer}
                                disabled={!currentAnswer || checking}
                                className="px-6 py-2.5 bg-info hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                {checking ? "Checking…" : "Check Answer"}
                            </button>
                        ) : isLast ? (
                            <button
                                onClick={handleFinish}
                                disabled={submitting}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                {submitting ? "Finishing…" : "Finish Quiz"}
                            </button>
                        ) : (
                            <button
                                onClick={() => goTo(currentIndex + 1)}
                                className="px-6 py-2.5 bg-info hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>

                {/* Question navigator */}
                <div className="mt-6 max-w-6xl mx-auto">
                    <p className="text-xs text-gray-400 mb-2 text-center">Question Navigator</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {questions.map((q, i) => {
                            const ans = answers[q.id];
                            const isCurrent = i === currentIndex;
                            const isAns = ans?.submitted;
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => goTo(i)}
                                    className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
                                        isCurrent
                                            ? "bg-info text-white ring-2 ring-blue-300"
                                            : isAns
                                                ? ans.is_correct
                                                    ? "bg-green-100 text-green-700 border border-green-300"
                                                    : "bg-red-100 text-red-700 border border-red-300"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Finish early button when all answered */}
                {allAnswered && !isLast && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={handleFinish}
                            disabled={submitting}
                            className="btn btn-success btn-sm rounded-xl shadow-none"
                        >
                            {submitting ? "Finishing…" : "All done — Finish Quiz"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}