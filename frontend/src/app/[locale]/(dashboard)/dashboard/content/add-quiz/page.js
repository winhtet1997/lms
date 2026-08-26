"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload as UploadIcon, Plus } from "lucide-react";
import toast from "react-hot-toast";
import TagInput from "@/components/ui/TagInput";
import { courseService } from "@/service/courseService";
import { QuestionCard } from "./_QuestionCard";
import { QuestionModal } from "@/components/layout/QuestionModal";
import { UploadModal } from "./_UploadModal";

const GRADE_LEVELS = ["6", "7", "8", "9", "10", "11", "12"];

const EMPTY_Q = {
    question_text: "",
    choice_a: "",
    choice_b: "",
    choice_c: "",
    choice_d: "",
    correct_answer: "A",
    explanation: "",
};

function toQuestionPayload(q) {
    return {
        question_text: q.question_text,
        choice_a: q.choice_a,
        choice_b: q.choice_b,
        choice_c: q.choice_c,
        choice_d: q.choice_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
    };
}

export default function AddQuizPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const itemId = searchParams.get("id");
    const isEdit = !!itemId;

    // quiz details
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [gradeLevel, setGradeLevel] = useState("");
    const [timeLimitMinutes, setTimeLimitMinutes] = useState(0);
    const [tags, setTags] = useState([]);

    // questions — each may have an `id` (existing) or not (new)
    const [questions, setQuestions] = useState([]);
    const [deletedIds, setDeletedIds] = useState([]);
    const dirtyIds = useRef(new Set()); // tracks IDs of questions actually edited

    // UI
    const [loading, setLoading] = useState(isEdit);
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_Q);
    const [uploadOpen, setUploadOpen] = useState(false);
    const saveInProgress = useRef(false);

    // Load existing quiz on edit
    useEffect(() => {
        if (!itemId) return;
        (async () => {
            try {
                const [item, quiz, qs] = await Promise.all([
                    courseService.getItem(itemId),
                    courseService.getQuiz(itemId),
                    courseService.getQuizQuestions(itemId),
                ]);
                setTitle(item.title || "");
                setDescription(item.description || "");
                setGradeLevel(item.grade_level || "");
                setTags(item.tags || []);
                setTimeLimitMinutes(Math.round(item.duration || quiz.time_limit_minutes || 0));
                setQuestions(
                    qs.map((q) => ({
                        id: q.id,
                        question_text: q.question_text || "",
                        choice_a: q.choice_a || "",
                        choice_b: q.choice_b || "",
                        choice_c: q.choice_c || "",
                        choice_d: q.choice_d || "",
                        correct_answer: q.correct_answer || "A",
                        explanation: q.explanation || "",
                    }))
                );
            } catch {
                toast.error("Failed to load quiz.");
            } finally {
                setLoading(false);
            }
        })();
    }, [itemId]);

    // --- question modal ---
    const openAdd = () => {
        setForm(EMPTY_Q);
        setModal({ mode: "add" });
    };

    const openEdit = (index) => {
        setForm({ ...questions[index] });
        setModal({ mode: "edit", index });
    };

    const closeModal = () => {
        setModal(null);
        setForm(EMPTY_Q);
    };

    const handleSaveQuestion = () => {
        if (!form.question_text?.trim()) return toast.error("Question text is required.");
        if (!form.choice_a?.trim() || !form.choice_b?.trim() || !form.choice_c?.trim() || !form.choice_d?.trim()) {
            return toast.error("All four answer options are required.");
        }
        if (modal.mode === "add") {
            setQuestions((prev) => [...prev, { ...form }]);
        } else {
            const edited = questions[modal.index];
            if (edited?.id) dirtyIds.current.add(edited.id);
            setQuestions((prev) =>
                prev.map((q, i) => (i === modal.index ? { ...form } : q))
            );
        }
        closeModal();
    };

    const deleteQuestion = (index) => {
        const q = questions[index];
        if (q.id) setDeletedIds((prev) => [...prev, q.id]);
        setQuestions((prev) => prev.filter((_, i) => i !== index));
    };

    const moveQuestion = (index, dir) => {
        const next = index + dir;
        if (next < 0 || next >= questions.length) return;
        setQuestions((prev) => {
            const arr = [...prev];
            [arr[index], arr[next]] = [arr[next], arr[index]];
            return arr;
        });
    };

    // --- upload modal ---
    const handleQuestionsAdded = (parsed) => {
        setQuestions((prev) => [...prev, ...parsed]);
        toast.success(`${parsed.length} question${parsed.length !== 1 ? "s" : ""} added.`);
        setUploadOpen(false);
    };

    // --- save ---
    const handleSave = async () => {
        if (saveInProgress.current) return;
        if (!title.trim()) return toast.error("Quiz title is required.");
        if (!gradeLevel) return toast.error("Grade level is required.");
        saveInProgress.current = true;
        setSaving(true);
        try {
            if (isEdit) {
                await saveEdit();
                toast.success("Quiz updated successfully!");
                router.back();
            } else {
                const newId = await saveCreate();
                toast.success("Quiz saved successfully!");
                router.replace(`?id=${newId}`);
            }
        } catch (err) {
            const msg = err?.response?.data?.error || `Failed to ${isEdit ? "update" : "save"} quiz.`;
            toast.error(msg);
        } finally {
            setSaving(false);
            saveInProgress.current = false;
        }
    };

    const saveCreate = async () => {
        const item = await courseService.createItem({
            title,
            description,
            type: "quiz",
            grade_level: gradeLevel,
            tags,
            duration: timeLimitMinutes || 0,
            publication_status: false,
        });
        await courseService.createQuiz(item.id, {
            passing_score: 70,
            time_limit_minutes: timeLimitMinutes > 0 ? timeLimitMinutes : null,
        });
        await Promise.all(
            questions.map((q) => courseService.createQuizQuestion(item.id, toQuestionPayload(q)))
        );
        return item.id;
    };

    const saveEdit = async () => {
        await Promise.all([
            courseService.updateItem(itemId, {
                title,
                description,
                grade_level: gradeLevel,
                tags,
                duration: timeLimitMinutes || 0,
            }),
            courseService.updateQuiz(itemId, {
                time_limit_minutes: timeLimitMinutes > 0 ? timeLimitMinutes : null,
            }),
        ]);

        await Promise.all([
            // delete removed questions
            ...deletedIds.map((qId) => courseService.deleteQuizQuestion(itemId, qId)),
            // update only dirty existing questions
            ...questions
                .filter((q) => q.id && dirtyIds.current.has(q.id))
                .map((q) => courseService.updateQuizQuestion(itemId, q.id, toQuestionPayload(q))),
            // create new questions (no id)
            ...questions
                .filter((q) => !q.id)
                .map((q) => courseService.createQuizQuestion(itemId, toQuestionPayload(q))),
        ]);

        dirtyIds.current.clear();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg text-info" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sticky header */}
            <div className=" px-6 py-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if(isEdit){
                             router.back()
                            }
                            router.push("/dashboard/content")
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={18} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {isEdit ? "Edit Quiz" : "Quiz Builder"}
                        </h1>
                        <p className="text-xs text-gray-500">
                            {isEdit ? "Update quiz details and questions" : "Create a new quiz for your course"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-info btn-sm gap-1.5 shadow-none"
                    >
                        {saving && <span className="loading loading-spinner loading-xs" />}
                        {isEdit ? "Update" : "Save"}
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
                {/* Quiz Details */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <span>📋</span> Quiz Details
                    </h2>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Quiz Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Natural Numbers and Whole Numbers Quiz"
                            className="input input-bordered w-full"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the quiz"
                            rows={3}
                            className="textarea textarea-bordered w-full resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                Grade Level <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={gradeLevel}
                                onChange={(e) => setGradeLevel(e.target.value)}
                                className="select select-bordered w-full"
                            >
                                <option value="">Select grade</option>
                                {GRADE_LEVELS.map((g) => (
                                    <option key={g} value={g}>Grade {g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <span>⏱</span> Time Limit (minutes)
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={timeLimitMinutes}
                                onChange={(e) =>
                                    setTimeLimitMinutes(Math.max(0, parseInt(e.target.value) || 0))
                                }
                                className="input input-bordered w-full"
                            />
                            <p className="text-xs text-gray-400 mt-1">Set to 0 for no time limit</p>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Tags</label>
                        <TagInput maxTags={5} initialTags={tags} onChange={setTags} />
                        <p className="text-xs text-gray-400 mt-1">
                            Add tags for easier grouping and finding quizzes
                        </p>
                    </div>
                </div>

                {/* Questions section */}
                <div>
                    <div className="flex items-center justify-between mb-4 sticky top-[73px] z-20 bg-gray-50 py-2 -mx-4 px-4">
                        <h2 className="text-lg font-bold text-gray-900">
                            Questions
                            {questions.length > 0 && (
                                <span className="ml-2 badge badge-soft badge-info">
                                    {questions.length}
                                </span>
                            )}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setUploadOpen(true)}
                                className="btn btn-ghost btn-sm gap-1.5 shadow-none border border-gray-200"
                            >
                                <UploadIcon size={14} /> Upload
                            </button>
                            <button
                                onClick={openAdd}
                                className="btn btn-info btn-sm gap-1.5 shadow-none"
                            >
                                <Plus size={14} /> Add Question
                            </button>
                        </div>
                    </div>

                    {questions.length === 0 ? (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                            <p className="text-gray-400 text-sm">
                                No questions yet. Add one manually or upload a file.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {questions.map((q, i) => (
                                <QuestionCard
                                    key={q.id ?? `new-${i}`}
                                    question={q}
                                    index={i}
                                    total={questions.length}
                                    onEdit={() => openEdit(i)}
                                    onDelete={() => deleteQuestion(i)}
                                    onMove={(dir) => moveQuestion(i, dir)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modal && (
                <QuestionModal
                    mode={modal.mode}
                    form={form}
                    setForm={setForm}
                    onSave={handleSaveQuestion}
                    onClose={closeModal}
                    showExplanation
                />
            )}

            {uploadOpen && (
                <UploadModal
                    onQuestionsAdded={handleQuestionsAdded}
                    onClose={() => setUploadOpen(false)}
                />
            )}
        </div>
    );
}