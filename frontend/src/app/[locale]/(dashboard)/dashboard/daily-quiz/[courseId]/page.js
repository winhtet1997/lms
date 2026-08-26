"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Search } from "lucide-react";
import Pagination from "@/components/layout/Pagination";
import { quizService } from "@/service/quizService";
import { courseService } from "@/service/courseService";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ui/AlertModal";
import { QuestionCard } from "./_QuestionCard";
import { QuestionModal } from "@/components/layout/QuestionModal";
import { usePermission } from "@/hooks/usePermission";

const EMPTY_FORM = { question_text: "", choice_a: "", choice_b: "", choice_c: "", choice_d: "", correct_answer: "A" };
const PAGE_SIZE = 10;

export default function CourseQuestionsPage() {
    const { courseId } = useParams();
    const router = useRouter();

    const [course, setCourse] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [ordering, setOrdering] = useState("newest");
    const [page, setPage] = useState(1);

    const { confirm, ConfirmModal } = useConfirm();

    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const { can } = usePermission();

    useEffect(() => {
        courseService.getCourseById(courseId).then(setCourse).catch(() => {});
    }, [courseId]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await quizService.getQuestionsByCourse(courseId, {
                search,
                page,
                pageSize: PAGE_SIZE,
                ordering,
            });
            setQuestions(data.results);
            setTotal(data.total_count);
            setTotalPages(data.total_pages);
        } catch {
            toast.error("Failed to load questions.");
        } finally {
            setLoading(false);
        }
    }, [courseId, search, page, ordering]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, ordering]);

    const openAdd = () => {
        setForm(EMPTY_FORM);
        setModal({ mode: "add" });
    };

    const openEdit = (q) => {
        setForm({
            question_text: q.question_text,
            choice_a: q.choice_a,
            choice_b: q.choice_b,
            choice_c: q.choice_c,
            choice_d: q.choice_d,
            correct_answer: q.correct_answer,
        });
        setModal({ mode: "edit", question: q });
    };

    const closeModal = () => {
        setModal(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        if (!form.question_text.trim()) return toast.error("Question text is required.");
        if (!form.choice_a.trim() || !form.choice_b.trim() || !form.choice_c.trim() || !form.choice_d.trim())
            return toast.error("All four answer options are required.");

        setSaving(true);
        try {
            if (modal.mode === "edit") {
                await quizService.updateQuestion(modal.question.id, { ...form, course: courseId });
                toast.success("Question updated.");
            } else {
                await quizService.createQuestion({ ...form, course: courseId });
                toast.success("Question added.");
            }
            closeModal();
            load();
        } catch {
            toast.error("Failed to save question.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        document.activeElement?.blur();
        const ok = await confirm({
            title: "Delete Question",
            message: "Are you sure you want to delete this question? This cannot be undone.",
            confirmText: "Delete",
        });
        if (!ok) return;
        try {
            await quizService.deleteQuestion(id);
            toast.success("Question deleted.");
            load();
        } catch {
            toast.error("Failed to delete question.");
        }
    };

    const startItem = (page - 1) * PAGE_SIZE + 1;
    const courseTitle = course ? `${course.title}` : `Course ${courseId}`;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <ConfirmModal />
            <button
                onClick={() => router.push("/dashboard/daily-quiz")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
            >
                <ArrowLeft size={15} /> Back to Courses
            </button>

            <div className="flex flex-wrap items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold">{courseTitle} {course?.subject && `- ${course.subject_name}`}</h1>
                    <p className="text-gray-500 mt-1">{total} total questions</p>
                </div>
                {can('lms_course', 'create_daily_quiz') && (
                    <button onClick={openAdd} className="btn btn-info shadow-none gap-2">
                        <Plus size={16} /> Add Question
                    </button>
                )}
            </div>

            <div className="md:flex grid gap-3 mb-6">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input input-bordered w-full pl-9"
                    />
                </div>
                <select
                    value={ordering}
                    onChange={(e) => setOrdering(e.target.value)}
                    className="select select-bordered w-auto md:w-40"
                >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="loading loading-spinner loading-lg text-blue-500" />
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No questions found.</div>
            ) : (
                <div className="space-y-4">
                    {questions.map((q, i) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={startItem + i}
                            onEdit={() => openEdit(q)}
                            onDelete={() => handleDelete(q.id)}
                        />
                    ))}
                </div>
            )}

            {!loading && (
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            )}

            {modal && (
                <QuestionModal
                    mode={modal.mode}
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    onSave={handleSave}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}
