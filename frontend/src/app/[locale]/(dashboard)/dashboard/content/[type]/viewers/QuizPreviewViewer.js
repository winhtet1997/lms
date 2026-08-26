"use client";
import {useEffect, useState} from "react";
import {courseService} from "@/service/courseService";
import {MathText} from "@/components/layout/MathText";
import {ChevronLeft, Clock, HelpCircle} from "lucide-react";
import Link from "next/link";

const CHOICE_KEYS = ["A", "B", "C", "D"];
const CHOICE_FIELDS = {A: "choice_a", B: "choice_b", C: "choice_c", D: "choice_d"};

export default function QuizPreviewViewer({item}) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!item?.id) return;
        courseService.getQuizQuestions(item.id)
            .then(setQuestions)
            .catch(() => {
            })
            .finally(() => setLoading(false));
    }, [item?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <span className="loading loading-spinner loading-lg text-info"/>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
            <Link href={`/dashboard/content`}
                  className="btn btn-ghost btn-xs btn-circle border border-slate-300 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4"/>
            </Link>
            {/* Quiz header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h1 className="text-xl font-bold text-gray-900 mb-1">{item.title}</h1>
                {item.description && (
                    <p className="text-sm text-gray-500 mb-3">{item.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <HelpCircle size={14}/>
                        {questions.length} question{questions.length !== 1 ? "s" : ""}
                    </span>
                    {item.duration > 0 && (
                        <span className="flex items-center gap-1.5">
                            <Clock size={14}/>
                            {Math.round(item.duration)} min time limit
                        </span>
                    )}
                </div>
            </div>

            {questions.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <p className="text-gray-400 text-sm">No questions added yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q, i) => (
                        <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-start gap-3 mb-4">
                                <span
                                    className="bg-info text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-gray-800 font-medium text-sm leading-relaxed">
                                    <MathText source={q.question_text}/>
                                </p>
                            </div>

                            <div className="space-y-2 ml-10">
                                {CHOICE_KEYS.map((key) => {
                                    const isCorrect = q.correct_answer === key;
                                    return (
                                        <div
                                            key={key}
                                            className={`flex items-center gap-3 border rounded-xl px-4 py-2.5 text-sm ${
                                                isCorrect
                                                    ? "border-green-400 bg-green-50 text-green-800"
                                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                            }`}
                                        >
                                            <span
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                                                    isCorrect ? "border-green-500 bg-green-500 text-white" : "border-gray-300 text-gray-400"
                                                }`}>
                                                {key}
                                            </span>
                                            <MathText source={q[CHOICE_FIELDS[key]]}/>
                                            {isCorrect && (
                                                <span
                                                    className="ml-auto text-xs font-semibold text-green-600">✓ Correct</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {q.explanation && (
                                <div
                                    className="ml-10 mt-3 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                                    <span className="font-semibold">Explanation: </span>
                                    <MathText source={q.explanation}/>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}