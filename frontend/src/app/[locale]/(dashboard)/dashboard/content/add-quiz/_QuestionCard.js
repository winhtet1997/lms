"use client";
import {ChevronDown, ChevronUp, Pencil, Trash2} from "lucide-react";
import {MathText} from "@/components/layout/MathText";

const CHOICES = [
    {key: "A", field: "choice_a"},
    {key: "B", field: "choice_b"},
    {key: "C", field: "choice_c"},
    {key: "D", field: "choice_d"},
];

export function QuestionCard({question, index, total, preview, onEdit, onDelete, onMove}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span
                        className="bg-info text-white text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                    </span>
                    <div className="text-sm text-gray-800 min-w-0 flex-1 leading-relaxed">
                        <MathText source={question.question_text || "No question text"}/>
                    </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        onClick={() => onMove(-1)}
                        disabled={index === 0}
                        className="btn btn-ghost btn-xs p-1.5 disabled:opacity-30"
                        title="Move up"
                    >
                        <ChevronUp size={14}/>
                    </button>
                    <button
                        onClick={() => onMove(1)}
                        disabled={index === total - 1}
                        className="btn btn-ghost btn-xs p-1.5 disabled:opacity-30"
                        title="Move down"
                    >
                        <ChevronDown size={14}/>
                    </button>
                    <button
                        onClick={onEdit}
                        className="btn btn-ghost btn-xs p-1.5 text-blue-500 hover:bg-blue-50"
                        title="Edit"
                    >
                        <Pencil size={14}/>
                    </button>
                    <button
                        onClick={onDelete}
                        className="btn btn-ghost btn-xs p-1.5 text-red-400 hover:bg-red-50"
                        title="Delete"
                    >
                        <Trash2 size={14}/>
                    </button>
                </div>
            </div>

            <div className="space-y-1.5 ml-10">
                {CHOICES.map(({key, field}) => {
                    const isCorrect = question.correct_answer === key;
                    return (
                        <div
                            key={key}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                isCorrect
                                    ? "bg-green-50 border border-green-200 text-green-800"
                                    : "bg-gray-50 text-gray-600"
                            }`}
                        >
                            <span
                                className={`font-bold text-xs w-4 shrink-0 ${isCorrect ? "text-green-600" : "text-gray-400"}`}>
                                {key}
                            </span>
                            <MathText source={question[field] || `Option ${key}`}/>
                        </div>
                    );
                })}

                {question.explanation && (
                    <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                        <span className="font-semibold">Explanation: </span>
                        {preview ? <MathText source={question.explanation}/> : question.explanation}
                    </div>
                )}
            </div>
        </div>
    );
}