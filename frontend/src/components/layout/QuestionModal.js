"use client";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { MathText } from "@/components/layout/MathText";

const MathQuizEditor = dynamic(() => import("@/components/layout/MathQuizEditor"), {
    ssr: false,
    loading: () => <div className="h-72 bg-gray-50 border border-gray-200 rounded-xl animate-pulse" />,
});

export const CHOICES = [
    { key: "A", field: "choice_a" },
    { key: "B", field: "choice_b" },
    { key: "C", field: "choice_c" },
    { key: "D", field: "choice_d" },
];

const ANSWER_SYMBOLS = [
    { l: "$x$",  s: "$ $" },        { l: "a/b", s: "\\frac{}{}" },
    { l: "√x",   s: "\\sqrt{}" },   { l: "xⁿ",  s: "^{}" },
    { l: "xₙ",   s: "_{}" },        { l: "π",   s: "\\pi" },
    { l: "α",    s: "\\alpha" },     { l: "β",   s: "\\beta" },
    { l: "θ",    s: "\\theta" },     { l: "Δ",   s: "\\Delta" },
    { l: "∞",    s: "\\infty" },     { l: "±",   s: "\\pm" },
    { l: "×",    s: "\\times" },     { l: "÷",   s: "\\div" },
    { l: "≤",    s: "\\leq" },       { l: "≥",   s: "\\geq" },
    { l: "≠",    s: "\\neq" },       { l: "≈",   s: "\\approx" },
];

export function QuestionModal({ mode, form, setForm, saving = false, onSave, onClose, showExplanation = false }) {
    const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
    const focusedAnswer = useRef(null);

    const insertSymbol = (snippet) => {
        const target = focusedAnswer.current;
        if (!target) return;
        const { field, el } = target;
        const start = el.selectionStart ?? 0;
        const end   = el.selectionEnd   ?? 0;
        const cur   = form[field] || "";
        set(field, cur.slice(0, start) + snippet + cur.slice(end));
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start + snippet.length, start + snippet.length);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">
                        {mode === "add" ? "Add Question" : "Edit Question"}
                    </h2>
                </div>

                <div className="p-6 space-y-5 overflow-y-auto">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Question Text <span className="text-red-500">*</span>
                        </label>
                        <MathQuizEditor
                            value={form.question_text}
                            onChange={(v) => set("question_text", v)}
                            height={280}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Answer Options <span className="text-red-500">*</span>
                        </label>

                        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 mb-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-xs text-gray-400 mr-1 shrink-0">Insert into answer:</span>
                            {ANSWER_SYMBOLS.map(({ l, s }) => (
                                <button
                                    key={l}
                                    type="button"
                                    title={s}
                                    onMouseDown={(e) => { e.preventDefault(); insertSymbol(s); }}
                                    className="px-1.5 py-0.5 text-xs font-mono bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                >
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-2">
                            {CHOICES.map(({ key, field }) => {
                                const isCorrect = form.correct_answer === key;
                                return (
                                    <div key={key} className="flex items-start gap-3">
                                        <button
                                            type="button"
                                            onClick={() => set("correct_answer", key)}
                                            title="Mark as correct answer"
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors mt-1 ${
                                                isCorrect ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                        >
                                            {key}
                                        </button>
                                        <div className="flex-1 flex flex-col gap-1">
                                            <input
                                                type="text"
                                                value={form[field]}
                                                onChange={(e) => set(field, e.target.value)}
                                                onFocus={(e) => { focusedAnswer.current = { field, el: e.target }; }}
                                                placeholder={`Option ${key}  —  use $...$ for math`}
                                                className="input input-bordered w-full"
                                            />
                                            {form[field] && (
                                                <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                                    <MathText source={form[field]} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Click a letter to mark correct · Focus an option then click a symbol above to insert
                        </p>
                    </div>

                    {showExplanation && (
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                Explanation{" "}
                                <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                value={form.explanation}
                                onChange={(e) => set("explanation", e.target.value)}
                                placeholder="Provide an explanation for the correct answer..."
                                rows={3}
                                className="textarea textarea-bordered w-full resize-none"
                            />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose} className="btn flex-1 shadow-none">Cancel</button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="btn btn-info flex-1 shadow-none"
                    >
                        {saving && <span className="loading loading-spinner loading-sm mr-1" />}
                        {mode === "add" ? "Add Question" : "Update Question"}
                    </button>
                </div>
            </div>
        </div>
    );
}
