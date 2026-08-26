"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ResetPassword = () => {
  const t = useTranslations("ForgotPasswordReset");
  const router = useRouter();

  const resetPassword = useAuthStore((state) => state.resetPassword);
  const error = useAuthStore((state) => state.error);
  const fieldErrors = useAuthStore((state) => state.fieldErrors);
  const resetErrors = useAuthStore((state) => state.resetErrors);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    resetErrors();

    const storedOtp = localStorage.getItem("otp");
    const storedUsername = localStorage.getItem("pendingUsername");

    if (!storedOtp || !storedUsername || storedUsername === "null") {
      // If OTP or identity info not found, redirect user back to forgot-password
      router.replace("/forgot-password");
      return;
    }

    setOtp(storedOtp); // for logging or debugging
    console.log("Using OTP from previous step:", storedOtp);
  }, [resetErrors, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    const storedOtp = localStorage.getItem("otp"); // read OTP directly
    const storedUsername = localStorage.getItem("pendingUsername");

    if (!storedOtp || !storedUsername || storedUsername === "null") {
      alert(t("alertOtpMissing"));
      router.replace("/forgot-password");
      return;
    }

    setSubmitting(true);
    try {
      // Send payload to backend
      await resetPassword(password, confirmPassword, storedOtp, storedUsername, "username");

      alert(t("alertPasswordResetSuccess"));
      router.push("/"); // redirect to login or home
    } catch (err) {
      console.error("Reset password failed", err);
      // fieldErrors and error will already be updated in store
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="card-body gap-4">
          <form onSubmit={handleSubmit}>
            <h1 className="text-2xl font-semibold text-center text-black my-2">
              {t("title")}
            </h1>

            <p className="text-center text-sm text-gray-500">
              {t("subtitle")}
            </p>

            {/* Password */}
            <div className="form-control my-3">
              <span className="label-text font-medium text-black">{t("newPasswordLabel")}</span>
              <label className="input w-full flex items-center gap-2">
                <Lock size={16} color="#737373" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={t("newPasswordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </div>

            {/* Confirm Password */}
            <div className="form-control my-3">
              <span className="label-text font-medium text-black">{t("confirmPasswordLabel")}</span>
              <label className="input w-full flex items-center gap-2">
                <Lock size={16} color="#737373" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder={t("confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>

            {/* Errors */}
            {error ? (
              <p className="text-red-500 text-sm text-center font-medium animate-in fade-in duration-300">
                {error}
              </p>
            ) : (
              /* Priority 2: Show specific field errors only if no main error exists */
              fieldErrors &&
              Object.keys(fieldErrors).length > 0 && (
                <div className="text-red-500 text-sm text-center space-y-1">
                  {Object.values(fieldErrors).map((msg, i) => (
                    <p key={i}>{msg}</p>
                  ))}
                </div>
              )
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn bg-[#0052b4] w-full text-white rounded-lg shadow-none my-3 disabled:opacity-70"
            >
              {submitting ? t("resettingButton") : t("submitButton")}
            </button>

            <div className="text-center">
              <Link href="/" className="text-[#0052b4] text-sm">
                {t("backToHome")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
