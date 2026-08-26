"use client";

import { useState } from "react";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";
import PasswordResetModal from "@/components/account/PasswordResetModal";

export default function PasswordSection({ userEmail, userPhone, userUsername, titleLabel, subtitleLabel, otpLabel, buttonLabel }) {
    const [open, setOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            {showModal && (
                <PasswordResetModal
                    userEmail={userEmail}
                    userPhone={userPhone}
                    userUsername={userUsername}
                    onClose={() => setShowModal(false)}
                />
            )}

            <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setOpen((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 p-6"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                            <Lock className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold">{titleLabel}</h2>
                            <p className="text-sm text-gray-500">{subtitleLabel}</p>
                        </div>
                    </div>
                    {open ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                </button>

                {open && (
                    <div className="px-6 pb-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-400">{otpLabel}</p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-outline btn-sm shadow-none shrink-0"
                        >
                            {buttonLabel}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
