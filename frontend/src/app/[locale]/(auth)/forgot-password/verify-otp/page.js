"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const VerifyOTP = () => {
  const t = useTranslations("ForgotPasswordVerifyOtp");
  const router = useRouter();
  const searchParams = useSearchParams();
  const otpType = searchParams.get("type"); // 'reset' or 'verify'
  const inputsRef = useRef([]);

  const verifyUser = useAuthStore((state) => state.verifyOtp);
  const resend = useAuthStore((state) => state.resendOtp);
  const error = useAuthStore((state) => state.error);
  const fieldErrors = useAuthStore((state) => state.fieldErrors);
  const reset = useAuthStore((state) => state.resetErrors);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [contact, setContact] = useState("");
  const [username, setUsername] = useState("");
  const [channel, setChannel] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    reset();

    if (otpType === "reset") {
      const storedUsername = localStorage.getItem("pendingUsername");
      const storedMasked = localStorage.getItem("pendingMaskedContact");
      const storedChannel = localStorage.getItem("pendingChannel");
      if (storedUsername && storedUsername !== "null") setUsername(storedUsername);
      if (storedMasked && storedMasked !== "null") setContact(storedMasked);
      if (storedChannel && storedChannel !== "null") setChannel(storedChannel);
    } else {
      const storedEmail = localStorage.getItem("pendingEmail");
      const storedPhone = localStorage.getItem("pendingPhone");
      if (storedEmail && storedEmail !== "null") setContact(storedEmail);
      else if (storedPhone && storedPhone !== "null") setContact(storedPhone);
    }
  }, [reset, otpType]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 4) newOtp[i] = char;
    });
    setOtp(newOtp);
    
    // Focus the last filled input or the first empty one
    const nextIndex = Math.min(pastedData.length, 3);
    inputsRef.current[nextIndex]?.focus();
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    reset();

    const code = otp.join("");
    if (code.length !== 4) {
      alert(t("alertEnterAllDigits"));
      return;
    }

    setSubmitting(true);
    try {
      const result =
        otpType === "reset"
          ? await verifyUser(code, username, "username")
          : await verifyUser(code, contact);

      if (result && result.message === "Otp verified successfully.") {
        localStorage.setItem("otp", code);
        console.log(code)

        if (otpType === "reset") {
          router.push("/forgot-password/reset-password");
        } else if (otpType === "verify") {
          localStorage.removeItem("pendingEmail");
          localStorage.removeItem("pendingPhone");
          router.push("/registration/success");
        }
      } else {
        alert(t("alertOtpVerificationFailed"));
      }
    } catch (err) {
      console.error("OTP verification failed", err);
      alert(err.message || t("alertOtpVerificationFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!otpType) {
      alert(t("alertOtpTypeMissing"));
      return;
    }

    setResending(true);
    try {
      if (otpType === "reset") {
        if (!username) {
          alert(t("alertContactNotFound"));
          return;
        }
        await resend(username, otpType, "username", channel);
        alert(t("alertOtpResent"));
        return;
      }

      if (!contact) {
        alert(t("alertContactNotFound"));
        return;
      }

      await resend(contact, otpType);
      alert(t("alertOtpResent"));
    } catch (err) {
      console.error("Failed to resend OTP", err);
      alert(t("alertResendFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="card-body gap-4">
          <form onSubmit={handleSubmit}>
            <div className="my-3 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#0052b4] flex items-center justify-center">
                  <Shield color="#fff" size={32} />
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-black my-2">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-500">
                {t("subtitle")}
              </p>
              <p className="font-semibold text-black break-all">{contact}</p>
            </div>

            <div className="flex items-center gap-2.5 justify-center my-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  ref={(el) => (inputsRef.current[index] = el)}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  className="w-16 h-16 font-semibold outline-none text-xl text-gray-700 text-center border rounded-md bg-gray-100 border-gray-300 focus:border-blue-500"
                />
              ))}
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
              disabled={submitting || resending}
              className="btn bg-[#0052b4] w-full text-white rounded-lg shadow-none my-4 disabled:opacity-70"
            >
              {submitting ? t("verifyingButton") : t("submitButton")}
            </button>

            <div className="text-center text-sm">
              <p>{t("didntReceive")}</p>
              <p
                onClick={submitting || resending ? undefined : handleResend}
                className={`text-[#0052b4] ${
                  submitting || resending
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {resending ? t("resendingButton") : t("resendCode")}
              </p>
            </div>

            <div className="text-center mt-2">
              <Link href="/registration" className="text-[#0052b4] text-sm">
                {t("backToRegistration")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
