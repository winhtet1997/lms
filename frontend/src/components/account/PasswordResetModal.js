"use client";

import { useState, useRef } from "react";
import { Mail, Phone, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function PasswordResetModal({ userEmail, userPhone, userUsername, onClose }) {
    const t = useTranslations("AccountSettings");
    const { ForgotPassword, verifyOtp, resetPassword } = useAuthStore();
    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState("");
    const otpRefs = useRef([]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [busy, setBusy] = useState(false);

    // Prefer email when the account has one on file; otherwise fall back to
    // phone, which sends the OTP via SMS instead of email.
    const useEmail = Boolean(userEmail);
    const contact = userEmail || userPhone;
    const channel = useEmail ? "email" : "phone";

    const handleSendOtp = async () => {
        setBusy(true);
        try {
            await ForgotPassword({ username: userUsername, channel });
            toast.success(t("toastOtpSentTo", { contact }));
            setStep(2);
        } catch (err) {
            toast.error(err?.message || t("toastOtpSendFailed"));
        } finally {
            setBusy(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) return toast.error(t("toastOtpRequired"));
        setBusy(true);
        try {
            await verifyOtp(otp.trim(), userUsername, "username");
            toast.success(t("toastOtpVerified"));
            setStep(3);
        } catch (err) {
            toast.error(err?.message || t("toastOtpInvalid"));
        } finally {
            setBusy(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword)
            return toast.error(t("toastPasswordFieldsRequired"));
        if (newPassword.length < 6)
            return toast.error(t("toastPasswordTooShort"));
        if (newPassword !== confirmPassword)
            return toast.error(t("toastPasswordMismatch"));
        setBusy(true);
        try {
            await resetPassword(newPassword, confirmPassword, otp.trim(), userUsername, "username");
            toast.success(t("toastPasswordChanged"));
            onClose();
        } catch (err) {
            toast.error(err?.message || t("toastPasswordResetFailed"));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-gray-400"
                >
                    ✕
                </button>

                <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                                    step >= s
                                        ? "bg-info text-white"
                                        : "bg-gray-200 text-gray-500"
                                }`}
                            >
                                {s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`h-0.5 w-8 transition-colors ${
                                        step > s ? "bg-info" : "bg-gray-200"
                                    }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold">{t("modalStep1Title")}</h2>
                            <p className="text-sm text-gray-500 mt-1">{t("modalStep1Subtitle")}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3">
                            {useEmail ? (
                                <Mail className="w-4 h-4 text-gray-400" />
                            ) : (
                                <Phone className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm text-gray-700">{contact}</span>
                        </div>
                        <button
                            onClick={handleSendOtp}
                            disabled={busy}
                            className="btn btn-info w-full shadow-none"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("modalSendOtpButton")}
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold">{t("modalStep2Title")}</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {t("modalStep2Subtitle", { email: contact })}
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            {[0, 1, 2, 3].map((i) => (
                                <input
                                    key={i}
                                    ref={(el) => (otpRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={otp[i] || ""}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        const digits = otp.split("");
                                        digits[i] = val;
                                        setOtp(digits.join("").slice(0, 4));
                                        if (val && i < 3) otpRefs.current[i + 1]?.focus();
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Backspace" && !otp[i] && i > 0)
                                            otpRefs.current[i - 1]?.focus();
                                    }}
                                    onPaste={(e) => {
                                        e.preventDefault();
                                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
                                        setOtp(pasted);
                                        otpRefs.current[Math.min(pasted.length, 3)]?.focus();
                                    }}
                                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-info focus:outline-none transition-colors"
                                />
                            ))}
                        </div>
                        <button
                            onClick={handleVerifyOtp}
                            disabled={busy || otp.length < 4}
                            className="btn btn-info w-full shadow-none"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("modalVerifyOtpButton")}
                        </button>
                        <button
                            onClick={handleSendOtp}
                            disabled={busy}
                            className="btn btn-ghost btn-sm w-full text-gray-500"
                        >
                            {t("modalResendOtpButton")}
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-semibold">{t("modalStep3Title")}</h2>
                            <p className="text-sm text-gray-500 mt-1">{t("modalStep3Subtitle")}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                {t("modalLabelNewPassword")}
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2">
                                <KeyRound className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={t("modalPlaceholderNewPassword")}
                                    className="input input-ghost flex-1 focus:outline-none px-0 h-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw((v) => !v)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                {t("modalLabelConfirmPassword")}
                            </label>
                            <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2">
                                <KeyRound className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t("modalPlaceholderConfirmPassword")}
                                    className="input input-ghost flex-1 focus:outline-none px-0 h-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleResetPassword}
                            disabled={busy}
                            className="btn btn-info w-full shadow-none"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("modalSavePasswordButton")}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
