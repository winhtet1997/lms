"use client";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

function getInitials(name) {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function TutorCard({ tutor, selected, onSelect }) {
    const t = useTranslations("BookTutorPage");
    return (
        <button
            onClick={() => onSelect(tutor)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                selected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
            }`}
        >
            <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                    {selected && (
                        <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white z-10" />
                    )}
                    {tutor.avatar ? (
                        <img src={resolveMediaUrl(account.avatar)} alt={tutor.full_name}
                            className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {getInitials(tutor.full_name || tutor.username)}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">{tutor.full_name || tutor.username}</p>
                            <p className="text-xs text-gray-500">{t("mathTutorLabel")}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-semibold text-gray-700">5.0</span>
                            <span className="text-xs text-gray-400">· {t("sessionsCount", { count: 0 })}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {[t("tagAlgebra"), t("tagExamPrep"), t("tagOneOnOne")].map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>
        </button>
    );
}

export default function ChooseTutorStep({ tutors, loading, selectedTutor, onSelect, onNext }) {
    const t = useTranslations("BookTutorPage");
    return (
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">{t("chooseTutorTitle")}</h2>
            <p className="text-sm text-gray-500 mb-5">{t("chooseTutorSubtitle")}</p>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-md text-slate-400" />
                </div>
            ) : tutors.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">{t("noTutorsAvailable")}</p>
            ) : (
                <div className="flex flex-col gap-3 mb-6">
                    {tutors.map(tutor => (
                        <TutorCard
                            key={tutor.id}
                            tutor={tutor}
                            selected={selectedTutor?.id === tutor.id}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!selectedTutor}
                    className="btn btn-info btn-sm px-6 rounded-lg disabled:opacity-40"
                >
                    {t("continueButton")}
                </button>
            </div>
        </div>
    );
}
