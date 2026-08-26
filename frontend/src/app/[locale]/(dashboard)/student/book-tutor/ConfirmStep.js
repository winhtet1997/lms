"use client";
import { useTranslations } from "next-intl";

export default function ConfirmStep({ tutor, selectedDate, selectedSlot, topic, onTopicChange, onConfirm, onBack, loading, error }) {
    const t = useTranslations("BookTutorPage");
    const dateLabel = selectedDate?.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });
    const timeLabel = selectedSlot?.label;

    return (
        <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">{t("confirmBookingTitle")}</h2>
            <p className="text-sm text-gray-500 mb-5">{t("confirmBookingSubtitle")}</p>

            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">{t("sessionDetailsLabel")}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-blue-500 font-medium mb-0.5">{t("tutorLabel")}</p>
                        <p className="text-sm font-semibold text-gray-800">{tutor?.full_name || tutor?.username}</p>
                        <p className="text-xs text-gray-500">{t("mathTutorLabel")}</p>
                    </div>
                    <div>
                        <p className="text-xs text-blue-500 font-medium mb-0.5">{t("dateTimeLabel")}</p>
                        <p className="text-sm font-semibold text-gray-800">{dateLabel}</p>
                        <p className="text-xs text-gray-500">{timeLabel} ({t("sessionDuration")})</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">{t("sessionTopicLabel")}</p>
                <p className="text-xs text-gray-500 mb-3">{t("sessionTopicDescription")}</p>
                <textarea
                    value={topic}
                    onChange={e => onTopicChange(e.target.value)}
                    rows={4}
                    placeholder={t("sessionTopicPlaceholder")}
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-400"
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-800">{t("sessionFeeLabel")}</p>
                    <p className="text-xs text-gray-500">{t("sessionFeeDescription")}</p>
                </div>
                <span className="text-lg font-bold text-green-600">{t("freeLabel")}</span>
            </div>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-between">
                <button onClick={onBack} className="btn btn-sm btn-ghost rounded-lg px-6">{t("backButton")}</button>
                <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="btn btn-info btn-sm px-6 rounded-lg disabled:opacity-40"
                >
                    {loading ? <span className="loading loading-spinner loading-xs" /> : t("confirmBookingButton")}
                </button>
            </div>
        </div>
    );
}
