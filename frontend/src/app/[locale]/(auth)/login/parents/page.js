"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock, User, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

const ParentsLogin = () => {
  const t = useTranslations("LoginParents");
  const router = useRouter();
  const login = useAuthStore((state) => state.loginParents);
  const fieldErrors = useAuthStore((state) => state.fieldErrors);
  const error = useAuthStore((state) => state.error);
  const reset = useAuthStore((state) => state.resetErrors);
  useEffect(() => {
    reset();
  }, [reset]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const result = await login(username, password);
    if (result.success) {
      router.push("/parents/home");
    } else if (result.isUnverified) {
      console.log("Redirecting to OTP...");
      router.push("/registration/verify-otp?type=verify&userType=parents&source=login");
    } else {
      console.error("Login failed:", result.message);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="card w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="card-body gap-4">
          <form onSubmit={handleLoginSubmit}>
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#0052b4] flex items-center justify-center">
                <Users color="#fff" size={32} />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-center text-black my-2">
              {t("title")}
            </h1>
            <p className="text-center text-sm text-gray-500">{t("subtitle")}</p>
            <div className="form-control my-3">
              <span className="label-text font-medium text-black mb-2">
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
              <span className="label-text font-medium text-black mb-2">
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
                {/* If error is an object, show the message; if it's a string, show the string */}
                {typeof error === "object" ? error.message : error}
              </p>
            ) : (
              fieldErrors &&
              Object.keys(fieldErrors).length > 0 && (
                <div className="text-red-500 text-sm text-center space-y-1">
                  {Object.values(fieldErrors)
                    .flat()
                    .map((msg, i) => (
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
            <div className="divider text-gray-400 text-xs my-1">OR</div>
            <GoogleSignInButton
              role={2}
              onNeedsSetup={() => router.push("/registration/parents")}
            />

            <div className="text-center mt-3">
              {t("noAccount")}{" "}
              <Link
                href="/registration/parents"
                className="text-[#0052b4] underline-none text-sm"
              >
                {t("signUpLink")}
              </Link>
            </div>
            <div className="text-center">
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

export default ParentsLogin;
