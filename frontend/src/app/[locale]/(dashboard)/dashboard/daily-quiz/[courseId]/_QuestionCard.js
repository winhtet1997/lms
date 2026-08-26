"use client";
import { Pencil, Trash2 } from "lucide-react";
import { MathText } from "@/components/layout/MathText";

export function QuestionCard({ question, index, onEdit, onDelete }) {
    const choices = [
        { key: "A", text: question.choice_a },
        { key: "B", text: question.choice_b },
        { key: "C", text: question.choice_c },
        { key: "D", text: question.choice_d },
    ];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <div className="grid md:flex items-center justify-between gap-2 mb-4">
                    <span className="bg-info text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        {index}
                    </span>
                    <p className="font-medium text-gray-800"><MathText source={question.question_text} /></p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                    <button
                        onClick={onEdit}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-2 ml-12">
                {choices.map(({ key, text }) => {
                    const isCorrect = question.correct_answer === key;
                    return (
                        <div
                            key={key}
                            className={`flex items-center gap-3 border rounded-xl px-4 py-2.5 ${isCorrect ? "border-green-400 bg-green-50" : "border-gray-200 bg-white"}`}
                        >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${isCorrect ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                                {key}
                            </span>
                            <span className="text-sm text-gray-700"><MathText source={text} /></span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
