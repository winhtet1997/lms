"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import PasswordResetModal from "@/components/account/PasswordResetModal";

export default function SecuritySection({ userEmail }) {
    const t = useTranslations("AccountSettings");
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            {showModal && (
                <PasswordResetModal
                    userEmail={userEmail}
                    onClose={() => setShowModal(false)}
                />
            )}

            <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-4">
                <div>
                    <h2 className="text-base font-semibold">{t("securitySectionTitle")}</h2>
                    <p className="text-sm text-gray-500">{t("securitySectionSubtitle")}</p>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <KeyRound className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">{t("passwordLabel")}</p>
                            <p className="text-xs text-gray-400">
                                {t("otpWillBeSent", { email: userEmail })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-outline btn-sm shadow-none"
                    >
                        {t("resetPasswordButton")}
                    </button>
                </div>
            </div>
        </>
    );
}
