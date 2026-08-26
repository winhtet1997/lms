"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import ProfileSection from "./ProfileSection";
import SecuritySection from "./SecuritySection";

export default function AccountSettings() {
    const t = useTranslations("AccountSettings");
    const { user } = useAuthStore();

    if (!user) return null;

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
                <p className="text-sm text-gray-500 mt-1">{t("pageSubtitle")}</p>
            </div>

            <ProfileSection user={user} />

            <SecuritySection userEmail={user.email} />

            <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-3">
                <h2 className="text-base font-semibold">{t("helpSectionTitle")}</h2>
                <p className="text-sm text-gray-500">{t("helpSectionSubtitle")}</p>
                <button className="btn btn-outline btn-sm shadow-none">
                    {t("contactSupportButton")}
                </button>
            </div>
        </div>
    );
}
