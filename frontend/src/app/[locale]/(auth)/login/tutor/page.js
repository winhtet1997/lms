"use client";
import { useAuthStore } from "@/store/useAuthStore";
import {
  CircleAlert,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const TutorLogin = () => {
  const t = useTranslations("LoginTutor");
  const login = useAuthStore((state) => state.loginTutor);
  const error = useAuthStore((state) => state.error);
  const fieldErrors = useAuthStore((state) => state.fieldErrors);
  const reset = useAuthStore((state) => state.resetErrors);

  useEffect(() => {
    reset();
  }, [reset]);

  const Router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      Router.push("/tutor/home?role=tutor");
    } catch (error) {
      console.log("login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-green-50 via-white to-blue-50 py-20">
      <div className="card w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="card-body gap-4">
          <form onSubmit={handleLoginSubmit}>
            <div className="flex justify-center items-start my-2">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <GraduationCap size={28} color="#ffffff" />
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-center text-black">
              {t("title")}
            </h1>
            <p className="text-center text-sm text-gray-500 my-2">
              {t("subtitle")}
            </p>

            <div className="alert alert-info bg-blue-50 border border-blue-200 shadow-none items-start">
              <CircleAlert size={16} color="#000" className="my-1" />
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
              <label className="input w-full">
                <Lock size={16} color="#737373" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              className="btn btn-primary bg-[#0052b4] w-full text-white rounded-lg shadow-none my-2"
            >
              {t("submitButton")}
            </button>
            <div className="bg-yellow-50 border border-yellow-400 text-center my-3 rounded-lg p-3 text-xs text-yellow-900">
              <p>{t("noteBox")}</p>
            </div>

            {googleError && (
              <p className="text-red-500 text-sm text-center font-medium animate-in fade-in duration-300">
                {googleError}
              </p>
            )}

            <div className="divider text-gray-400 text-xs my-1">OR</div>
            <GoogleSignInButton
              role={3}
              onNeedsSetup={() =>
                setGoogleError(
                  "No account found for this Google account. Ask your admin to create your account first, then log in.",
                )
              }
            />

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

export default TutorLogin;
