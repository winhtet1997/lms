"use client";

import {useEffect, useRef, useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowLeft, Upload, FileText, Download, Info, X} from "lucide-react";
import {quizService} from "@/service/quizService";
import {courseService} from "@/service/courseService";
import toast from "react-hot-toast";

export default function UploadQuestionsPage() {
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [courses, setCourses] = useState([]);
    const [courseId, setCourseId] = useState("");
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        courseService.getCourses({page_size: 100}).then((data) => {
            setCourses(data.courses ?? []);
        });
    }, []);

    const pickFile = (f) => {
        if (!f) return;
        const ext = f.name.split(".").pop().toLowerCase();
        if (ext !== "xlsx" && ext !== "json") {
            toast.error("Only .xlsx or .json files are supported.");
            return;
        }
        setFile(f);
        setResult(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        pickFile(e.dataTransfer.files[0]);
    };

    const handleUpload = async () => {
        if (!courseId) return toast.error("Please select a course.");
        if (!file) return toast.error("Please select an Excel file.");

        setUploading(true);
        setResult(null);
        try {
            const data = await quizService.uploadQuestions(courseId, file);
            setResult(data);
            if (data.created > 0) {
                toast.success(`${data.created} question${data.created > 1 ? "s" : ""} uploaded.`);
            }
            if (data.errors?.length === 0) setFile(null);
        } catch (err) {
            const msg = err?.response?.data?.error || "Upload failed.";
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };


    return (
        <div className="p-8 max-w-6xl mx-auto">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
            >
                <ArrowLeft size={15}/> Back to Questions
            </button>

            <h1 className="text-3xl font-bold mb-8">Upload Questions</h1>

            <div className="space-y-6">
                {/* Course selector */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Select Course <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="select select-bordered w-full"
                    >
                        <option value="">Select course...</option>
                        {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.title} - {c.subject_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                        dragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.json"
                        className="hidden"
                        onChange={(e) => pickFile(e.target.files[0])}
                    />
                    {file ? (
                        <div className="flex items-center gap-3 text-gray-700">
                            <FileText size={28} className="text-blue-500 shrink-0"/>
                            <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                                className="ml-2 p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600"
                            >
                                <X size={14}/>
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-gray-100 rounded-full p-4 mb-3">
                                <Upload size={24} className="text-gray-500"/>
                            </div>
                            <p className="text-sm text-gray-700">
                                Drag and drop your file here, or{" "}
                                <span className="text-blue-600 font-semibold">browse</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">Upload Excel (.xlsx) or JSON (.json)</p>
                        </>
                    )}
                </div>

                {/* Sample files */}
                <div className="flex justify-end items-center gap-3">
                    <span className="text-sm text-gray-500">Examples:</span>
                    <a
                        href="/sample_daily_quiz.xlsx"
                        download
                        className="btn btn-warning border-none btn-sm shadow-none gap-2"
                    >
                        <Download size={14}/>
                        Download Sample Excel
                    </a>
                    <a
                        href="/sample_daily_quiz.json"
                        download
                        className="btn btn-warning border-none btn-sm shadow-none gap-2"
                    >
                        <Download size={14}/>
                        Download Sample JSON
                    </a>
                </div>

                {/* Format info */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5"/>
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Excel Format Requirements:</p>
                        <p className="font-mono text-xs">
                            Question | Option A | Option B | Option C | Option D | Correct Answer
                        </p>
                        <p className="font-medium mb-1 mt-2">JSON Format Requirements:</p>
                        <p className="font-mono text-xs">
                            {"[{ question_text, choice_a, choice_b, choice_c, choice_d, correct_answer }]"}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Ensure the correct answer field contains the letter (A, B, C, or D)
                        </p>
                    </div>
                </div>

                {/* Upload result */}
                {result && (
                    <div className={`rounded-xl p-4 text-sm ${result.created > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        {result.created > 0 && (
                            <p className="text-green-700 font-medium mb-1">
                                ✓ {result.created} question{result.created > 1 ? "s" : ""} uploaded successfully.
                            </p>
                        )}
                        {result.errors?.length > 0 && (
                            <div>
                                <p className="text-red-700 font-medium mb-1">{result.errors.length} row error{result.errors.length > 1 ? "s" : ""}:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {result.errors.map((e, i) => (
                                        <li key={i} className="text-red-600 text-xs">{e}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3 mt-6">
                    <button onClick={() => router.back()} className="btn flex-1 shadow-none">Cancel</button>
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !file || !courseId}
                        className="btn btn-info flex-1 shadow-none"
                    >
                        {uploading && <span className="loading loading-spinner loading-sm mr-1"/>}
                        Upload
                    </button>
                </div>
            </div>
        </div>
    );
}