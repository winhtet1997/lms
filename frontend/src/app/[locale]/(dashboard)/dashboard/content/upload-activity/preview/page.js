'use client'
import { useCourseStore } from '@/store/useCourseStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';

export default function ActivityPreviewPage() {
    const router = useRouter();
    const previewItem = useCourseStore((state) => state.previewItem);
    const iframeRef = useRef(null);
    const t = useTranslations("ActivityPreviewPage");

    const handleReset = () => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        iframe.srcdoc = '';
        setTimeout(() => { iframe.srcdoc = previewItem.activity_code; }, 50);
    };

    if (!previewItem) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-400">
                <p className="text-sm font-medium">{t("noPreviewMessage")}</p>
                <button className="btn btn-sm border border-slate-200" onClick={() => router.back()}>
                    <ArrowLeft size={16} /> {t("noPreviewGoBack")}
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-700">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button className="btn btn-ghost btn-sm btn-square border border-gray-200" onClick={() => router.back()}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold">{t("pageTitle")}</h1>
                    <p className="text-xs text-gray-400">{t("pageSubtitle")}</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">

                {/* Card 1 — Activity Info */}
                <div className="card bg-white border border-gray-200 shadow-sm">
                    <div className="card-body p-6 md:flex md:flex-row items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold mb-1">{previewItem.title || t("untitledActivity")}</h1>
                            <p className="text-sm text-gray-500 mb-4">{previewItem.description || t("noDescription")}</p>
                            <div className="flex flex-wrap gap-2">
                                {previewItem.tags?.map((tag, i) => (
                                    <span key={i} className="badge badge-soft badge-info text-xs">{tag}</span>
                                ))}
                            </div>
                        </div>
                        {previewItem.grade_level && (
                            <div className="badge badge-outline rounded-2xl text-xs font-semibold px-3 py-3 shrink-0">
                                {t("gradeLabel")} {previewItem.grade_level}
                            </div>
                        )}
                    </div>
                </div>

                {/* Card 2 — Live Code Preview */}
                <div className="card bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="card-body p-0">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-sm">{t("livePreviewTitle")}</h2>
                            <button onClick={handleReset} className="btn btn-ghost btn-xs gap-1" title="Restart activity">
                                <RefreshCcw size={14} /> {t("resetButton")}
                            </button>
                        </div>
                        {previewItem.activity_code ? (
                            <iframe
                                ref={iframeRef}
                                srcDoc={previewItem.activity_code}
                                className="w-full"
                                style={{ height: '700px' }}
                                sandbox="allow-scripts"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                                {t("noActivityCode")}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
