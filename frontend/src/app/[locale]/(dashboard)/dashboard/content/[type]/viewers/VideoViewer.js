// VideoViewer.js
"use client";

import { BookOpen, Bot, Calendar, ChevronLeft, Download } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function VideoViewer({ item, showHeader = true }) {

    const videoUrl = item?.file ?? null;
    const [videoError, setVideoError] = useState(false);
    const t = useTranslations("VideoViewer");

    return (
        <div className=" p-6 bg-gray-50">
            {showHeader && (
                <div className="md:flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/content`} className="btn btn-ghost btn-xs btn-circle border border-slate-300 flex items-center justify-center">
                            <ChevronLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold">{item?.title || "Loading..."}</h1>
                            <p className="text-xs text-slate-400">{item?.type}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="btn btn-sm capitalize bg-white border-slate-200"><Calendar className="w-4 h-4 mr-2" /> {t("sessionsButton")}</button>
                        <button className="btn btn-sm capitalize bg-white border-slate-200"><Bot className="w-4 h-4 mr-2" /> {t("askAiButton")}</button>
                        <button className="btn btn-sm capitalize bg-white border-slate-200"><BookOpen className="w-4 h-4 mr-2" /> {t("myNotesButton")}</button>
                    </div>
                </div>
            )}
            <div className="max-w-6xl mx-auto card shadow rounded-2xl">
                <div className="relative aspect-video bg-black overflow-hidden mb-5 flex items-center justify-center">
                    {videoUrl && !videoError ? (
                        <video
                            key={videoUrl}
                            controls
                            width="100%"
                            className="w-full h-full"
                            onError={() => setVideoError(true)}
                        >
                            {/* No type attribute — let S3's Content-Type header decide.
                                This supports MP4 (H.264 & HEVC), MOV, and M4V. */}
                            <source src={videoUrl} />
                            {t("browserNoSupport")}
                        </video>
                    ) : videoError ? (
                        <div className="text-white text-center p-8 space-y-3">
                            <p className="font-semibold text-lg">{t("videoUnsupportedMessage")}</p>
                            <p className="text-sm text-gray-400">{t("videoUnsupportedHint")}</p>
                            <a
                                href={videoUrl}
                                download
                                className="btn btn-sm btn-outline border-white text-white hover:bg-white hover:text-black inline-flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" /> {t("downloadVideoButton")}
                            </a>
                        </div>
                    ) : (
                        <p className="text-gray-400">{t("noVideoAvailable")}</p>
                    )}
                </div>
                <div className="p-6 bg-white">
                    <h2 className="text-2xl font-bold mb-2">{item?.title}</h2>
                    <p className="text-muted-foreground">{item?.description}</p>
                </div>
            </div>
        </div>
    );
}
