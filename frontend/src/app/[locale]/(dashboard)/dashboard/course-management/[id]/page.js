"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourseStore } from "@/store/useCourseStore";
import { useConfirm } from "@/components/ui/AlertModal";
import { usePermission } from "@/hooks/usePermission";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import ChapterCard from "@/app/[locale]/(website)/courses/[id]/ChapterCard";
import { courseService } from "@/service/courseService";

const CourseChaptersPage = () => {
    const { id } = useParams();
    const router = useRouter();
    const { course, fetchCourseById, deleteCourse } = useCourseStore();
    const { confirm, ConfirmModal } = useConfirm();
    const { can } = usePermission();
    const [chapterStats, setChapterStats] = useState({});

    useEffect(() => {
        if (id) fetchCourseById(id);
    }, [id]);

    const chapters = course?.chapters ?? [];

    useEffect(() => {
        if (!chapters.length) return;
        chapters.forEach((chapter) => {
            courseService
                .getChapter(chapter.id)
                .then((stats) =>
                    setChapterStats((prev) => ({ ...prev, [chapter.id]: stats }))
                )
                .catch(() =>
                    setChapterStats((prev) => ({ ...prev, [chapter.id]: null }))
                );
        });
    }, [chapters.length]);

    const handleDelete = async () => {
        document.activeElement?.blur();
        const ok = await confirm({
            title: "Delete Course",
            message: `Are you sure you want to delete "${course?.title}"? This action cannot be undone.`,
            confirmText: "Delete",
        });
        if (!ok) return;
        try {
            await deleteCourse(id);
            toast.success("Course deleted successfully");
            router.push("/dashboard/course-management");
        } catch {
            toast.error("Failed to delete course");
        }
    };

    return (
        <div className="p-4">
            <ConfirmModal />



            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <Link
                    href="/dashboard/course-management"
                    className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
                >
                    <ArrowLeft size={16} /> Back to Course Management
                </Link>

                <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/upload-course?courseId=${course?.id}`}>
                        <button className="btn btn-outline btn-sm gap-1">
                            <Edit size={14} /> Edit Course
                        </button>
                    </Link>
                    {can("lms_course", "delete_course") && (
                        <button
                            onClick={handleDelete}
                            className="btn btn-outline btn-error btn-sm gap-1"
                        >
                            <Trash2 size={14} /> Delete Course
                        </button>
                    )}
                </div>
            </div>
            <div>
                <h1 className="text-2xl font-bold">{course?.title}</h1>
                {course?.description && (
                    <p className="text-gray-500 text-sm my-2 text-justify ">{course.description}</p>
                )}
            </div>
            {chapters.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    No chapters found for this course.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {chapters.map((chapter, index) => (
                        <ChapterCard
                            key={chapter.id}
                            chapter={chapter}
                            index={index}
                            courseId={course.id}
                            user={null}
                            isAdmin
                            stats={chapterStats[chapter.id]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseChaptersPage;
