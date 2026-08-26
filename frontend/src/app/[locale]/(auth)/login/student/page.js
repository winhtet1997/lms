"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { CircleAlert, Eye, EyeOff, Lock, Smile, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const StudentLogin = () => {
  const t = useTranslations("LoginStudent");
  const login = useAuthStore((state) => state.loginStudent);
  const error = useAuthStore((state) => state.error);
  const fieldErrors = useAuthStore((state) => state.fieldErrors);
  const reset = useAuthStore((state) => state.resetErrors);
  // const isVerified = useAuthStore((state) => state.isVerified);

  useEffect(() => {
    reset();
  }, [reset]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pricingRedirect = searchParams.get("pricing") === "true";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        router.push(pricingRedirect ? "/pricing" : "/student/home");
      } else if (result.isUnverified) {
        router.push("/registration/verify-otp?type=verify&userType=student&source=login");
      }
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center px-4 py-20">
      <div className="card w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="card-body gap-4">
          <form onSubmit={handleLoginSubmit}>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Smile size={36} color="#fff" />
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-center text-black my-2">
              {t("title")}
            </h1>
            <p className="text-center text-sm text-gray-500 my-2">
              {t("subtitle")}
            </p>

            <div className="alert alert-info bg-blue-50 border border-blue-200 shadow-none items-start ">
              <CircleAlert color="#000" size={16} className="my-1" />
              <span className="text-sm text-blue-900">{t("infoAlert")}</span>
            </div>

            <div className="form-control my-3">
              <span className="label-text font-medium text-black">
                {t("usernameLabel")}
              </span>
              <label className="input w-full">
                <User size={16} color="#737373" />
                <input
                  type="text"
                  required
                  placeholder={t("usernamePlaceholder")}
                  minLength="3"
                  maxLength="254"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
            </div>

            <div className="form-control my-3">
              <span className="label-text font-medium text-black">
                {t("passwordLabel")}
              </span>

              <label className="input w-full flex items-center gap-2">
                <Lock size={16} color="#737373" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </label>

              <div className="flex justify-end mt-1">
                <Link
                  href="/forgot-password"
                  className="text-blue-700  text-xs hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
            </div>
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
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary bg-[#0052b4] w-full text-white rounded-lg shadow-none my-2 disabled:opacity-60"
            >
              {submitting ? t("submitting") : t("submitButton")}
            </button>

            <div className="divider text-gray-400 text-xs my-1">OR</div>
            <GoogleSignInButton
              role={1}
              pricingRedirect={pricingRedirect}
              onNeedsSetup={() => router.push("/registration/student")}
            />

            <div className="text-center mt-3">
              {t("noAccount")}{" "}
              <Link
                href="/registration/student"
                className="text-[#0052b4] underline-none text-sm"
              >
                {t("signUpLink")}
              </Link>
            </div>
            <div className="text-center mt-3">
              <Link href="/" className="text-[#0052b4] underline-none text-sm">
                {t("backToHome")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
