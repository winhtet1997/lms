"use client";
import { useCourseStore } from "@/store/useCourseStore";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { useEffect } from "react";

function UploadItem({ upload, removeUpload }) {
    useEffect(() => {
        if (upload.status !== "done" && upload.status !== "error") return;
        const timer = setTimeout(() => removeUpload(upload.id), 10000);
        return () => clearTimeout(timer);
    }, [upload.status, upload.id, removeUpload]);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    {upload.status === "done" && (
                        <CheckCircle size={14} className="text-green-500 shrink-0" />
                    )}
                    {upload.status === "error" && (
                        <AlertCircle size={14} className="text-red-500 shrink-0" />
                    )}
                    <span className="text-sm font-medium text-gray-800 truncate">
                        {upload.filename}
                    </span>
                </div>
                {upload.status !== "uploading" && (
                    <button
                        onClick={() => removeUpload(upload.id)}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${
                        upload.status === "error"
                            ? "bg-red-500"
                            : upload.status === "done"
                            ? "bg-green-500"
                            : "bg-info"
                    }`}
                    style={{ width: `${upload.progress}%` }}
                />
            </div>

            <p className="text-xs text-gray-400 mt-1">
                {upload.status === "error"
                    ? "Upload failed"
                    : upload.status === "done"
                    ? "Upload complete"
                    : `Uploading… ${upload.progress}%`}
            </p>
        </div>
    );
}

export default function UploadQueue() {
    const uploads = useCourseStore((s) => s.uploads);
    const removeUpload = useCourseStore((s) => s.removeUpload);

    if (!uploads.length) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-72">
            {uploads.map((upload) => (
                <UploadItem key={upload.id} upload={upload} removeUpload={removeUpload} />
            ))}
        </div>
    );
}
