"use client";
import { useRef, useState } from "react";
import { Upload, FileText, X, Info, Download } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const VALID_ANSWERS = ["A", "B", "C", "D"];

function normalizeRow(q_text, a, b, c, d, correct_raw, expl) {
    const errors = [];
    if (!q_text || !a || !b || !c || !d || !correct_raw) {
        errors.push("missing required fields");
        return { question: null, errors };
    }
    const correct = String(correct_raw).trim().toUpperCase();
    if (!VALID_ANSWERS.includes(correct)) {
        errors.push(`correct_answer must be A–D (got '${correct_raw}')`);
        return { question: null, errors };
    }
    return {
        question: {
            question_text: String(q_text).trim(),
            choice_a: String(a).trim(),
            choice_b: String(b).trim(),
            choice_c: String(c).trim(),
            choice_d: String(d).trim(),
            correct_answer: correct,
            explanation: expl ? String(expl).trim() : "",
        },
        errors: [],
    };
}

function parseJsonQuestions(raw) {
    if (!Array.isArray(raw)) throw new Error("JSON must be an array of question objects.");
    const errors = [];
    const parsed = [];
    raw.forEach((row, i) => {
        const { question, errors: rowErrors } = normalizeRow(
            row.question_text, row.choice_a, row.choice_b, row.choice_c, row.choice_d,
            row.correct_answer, row.explanation
        );
        if (question) parsed.push(question);
        else errors.push(`Item ${i + 1}: ${rowErrors.join(", ")}`);
    });
    return { parsed, errors };
}

function parseExcelQuestions(arrayBuffer) {
    const wb = XLSX.read(arrayBuffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== ""));
    const errors = [];
    const parsed = [];
    dataRows.forEach((row, i) => {
        const [q_text, a, b, c, d, correct_raw, expl] = row;
        const { question, errors: rowErrors } = normalizeRow(q_text, a, b, c, d, correct_raw, expl);
        if (question) parsed.push(question);
        else errors.push(`Row ${i + 1}: ${rowErrors.join(", ")}`);
    });
    return { parsed, errors };
}

export function UploadModal({ onQuestionsAdded, onClose }) {
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [parseResult, setParseResult] = useState(null);
    const [dragging, setDragging] = useState(false);

    const pickFile = (f) => {
        if (!f) return;
        const ext = f.name.split(".").pop().toLowerCase();
        if (!["json", "xlsx", "xls"].includes(ext)) {
            toast.error("Only .json, .xlsx, or .xls files are supported.");
            return;
        }
        setFile(f);
        setParseResult(null);

        const reader = new FileReader();
        if (ext === "json") {
            reader.onload = (ev) => {
                try {
                    const raw = JSON.parse(ev.target.result);
                    setParseResult(parseJsonQuestions(raw));
                } catch {
                    toast.error("Could not parse the JSON file.");
                    setFile(null);
                }
            };
            reader.readAsText(f);
        } else {
            reader.onload = (ev) => {
                try {
                    setParseResult(parseExcelQuestions(/** @type {ArrayBuffer} */ (ev.target.result)));
                } catch {
                    toast.error("Could not parse the Excel file.");
                    setFile(null);
                }
            };
            reader.readAsArrayBuffer(f);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        pickFile(e.dataTransfer.files[0]);
    };

    const handleConfirm = () => {
        if (!file) return toast.error("Please select a file.");
        if (!parseResult || parseResult.parsed.length === 0)
            return toast.error("No valid questions found in the file.");
        onQuestionsAdded(parseResult.parsed);
    };

    const confirmDisabled = !file || !parseResult || parseResult.parsed.length === 0;
    const confirmLabel = `Add ${parseResult?.parsed.length ?? 0} Question${parseResult?.parsed.length !== 1 ? "s" : ""}`;

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Upload Questions</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Upload quiz questions from JSON or Excel files
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,.xlsx,.xls"
                            className="hidden"
                            onChange={(e) => pickFile(e.target.files[0])}
                        />
                        {file ? (
                            <div className="flex items-center gap-3 text-gray-700">
                                <FileText size={28} className="text-blue-500 shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">{file.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); setParseResult(null); }}
                                    className="ml-2 p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-gray-100 rounded-full p-4 mb-3">
                                    <Upload size={24} className="text-gray-500" />
                                </div>
                                <p className="text-sm text-gray-700">
                                    Drag and drop your file here, or{" "}
                                    <span className="text-blue-600 font-semibold">click to browse</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Supported: JSON, Excel (.xlsx, .xls)</p>
                            </>
                        )}
                    </div>

                    {/* Parse result */}
                    {parseResult && (
                        <div className={`rounded-xl p-4 text-sm ${
                            parseResult.parsed.length > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                        }`}>
                            {parseResult.parsed.length > 0 && (
                                <p className="text-green-700 font-medium mb-1">
                                    ✓ {parseResult.parsed.length} question{parseResult.parsed.length !== 1 ? "s" : ""} parsed successfully.
                                </p>
                            )}
                            {parseResult.errors.length > 0 && (
                                <div>
                                    <p className="text-red-700 font-medium mb-1">
                                        {parseResult.errors.length} error{parseResult.errors.length !== 1 ? "s" : ""}:
                                    </p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {parseResult.errors.map((e, i) => (
                                            <li key={i} className="text-red-600 text-xs">{e}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Format info */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700 space-y-2">
                            <p className="font-medium">Required Fields / Columns:</p>
                            <ul className="text-xs space-y-0.5">
                                <li><code className="font-mono">question_text</code> / <code className="font-mono">Question</code></li>
                                <li><code className="font-mono">choice_a–d</code> / <code className="font-mono">Option A–D</code></li>
                                <li><code className="font-mono">correct_answer</code> / <code className="font-mono">Correct Answer</code> — A, B, C, or D</li>
                                <li><code className="font-mono">explanation</code> — optional</li>
                            </ul>
                        </div>
                    </div>

                    {/* Download samples */}
                    <div className="flex gap-3">
                        <a
                            href="/sample_quiz_questions.json"
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors no-underline"
                        >
                            <Download size={24} className="text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">JSON Example</span>
                        </a>
                        <a
                            href="/sample_quiz.xlsx"
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors no-underline"
                        >
                            <Download size={24} className="text-green-500" />
                            <span className="text-sm font-medium text-gray-700">Excel Example</span>
                        </a>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button onClick={onClose} className="btn flex-1 shadow-none">Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={confirmDisabled}
                        className="btn btn-info flex-1 shadow-none"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}