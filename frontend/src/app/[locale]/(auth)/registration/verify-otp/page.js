"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const VerifyOTP = () => {
  const router = useRouter();
  const inputsRef = useRef([]);
  const searchParams = useSearchParams();

  const otpType = searchParams.get("type");
  const userType = searchParams.get("userType");
  const source = searchParams.get("source");

  const verifyUser = useAuthStore((state) => state.verifyOtp);
  const error = useAuthStore((state) => state.error);
  const fieldErrors = useAuthStore((state) => state.fieldErrors);
  const reset = useAuthStore((state) => state.resetErrors);
  const resend = useAuthStore((state) => state.resendOtp);

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [contact] = useState(() => {
    if (typeof window === "undefined") return "";
    const email = localStorage.getItem("pendingEmail");
    const phone = localStorage.getItem("pendingPhone");
    if (email && email !== "null") return email;
    if (phone && phone !== "null") return phone;
    return "";
  });
  const autoSentRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (source !== "login" || !contact || !otpType || autoSentRef.current) return;
    autoSentRef.current = true;

    (async () => {
      try {
        await resend(contact, otpType);
        toast((t) => (
          <span>
            A new verification code has been sent to <b>{contact}</b>
            <button onClick={() => toast.dismiss(t.id)} className="ml-2 underline btn">Okay</button>
          </span>
        ));
      } catch (err) {
        console.error("Auto-send OTP failed", err);
      }
    })();
  }, [source, contact, otpType, resend]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < inputsRef.current.length - 1) {
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
    if (code.length !== 4) return;

    setSubmitting(true);
    try {
      await verifyUser(code, contact);

      toast.success("Account verified successfully!");
      localStorage.removeItem("pendingEmail");
      localStorage.removeItem("pendingPhone");

      const loginRoute = userType === "parents" ? "/login/parents" : "/login/student";
      router.push(loginRoute);
    } catch (err) {
      console.error("OTP verification failed", err);
    } finally {
      setSubmitting(false);
    }
  };
  const handleResend = async (e) => {
    e.preventDefault();
    if (!otpType) {
      toast.error("Invalid OTP type. Cannot resend.");
      return;
    }

    const email = localStorage.getItem("pendingEmail");
    const storedPhone = localStorage.getItem("pendingPhone");
    const target = email && email !== "null" ? email : storedPhone && storedPhone !== "null" ? storedPhone : null;

    if (!target) {
      toast.error("No contact information available to resend OTP.");
      return;
    }

    setResending(true);
    try {
      const result = await resend(target, otpType);
      console.log("OTP resent successfully", result);
      toast((t) => (
        <span>
          OTP has been resent to <b>{target}</b>
          <button onClick={() => toast.dismiss(t.id)} className="ml-2 underline btn">Okay</button>
        </span>
      ));
    } catch (err) {
      console.error("Failed to resend OTP", err);
      toast((t) => (
        <span>
          Failed to resend OTP. Please try again.
          <button onClick={() => toast.dismiss(t.id)} className="ml-2 underline btn">Okay</button>
        </span>
      ));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="card-body gap-4">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="my-3 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#0052b4] flex items-center justify-center">
                  <Shield color="#fff" size={32} />
                </div>
              </div>

              <h1 className="text-2xl font-semibold text-black my-2">
                Verify OTP
              </h1>

              <p className="text-sm text-gray-500">
                We’ve sent a 4-digit verification code to
              </p>
              <p className="font-semibold text-black break-all">{contact}</p>
            </div>

            {/* OTP Inputs */}
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
              disabled={submitting || resending}
              className="btn bg-[#0052b4] w-full text-white rounded-lg shadow-none my-4 disabled:opacity-70"
            >
              {submitting ? "Verifying..." : "Verify"}
            </button>

            {/* Links */}
            <div className="text-center text-sm">
              <p>Didn’t receive the code?</p>
              <p
                onClick={submitting || resending ? undefined : handleResend}
                className={`text-[#0052b4] ${
                  submitting || resending
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                {resending ? "Resending..." : "Resend Code"}
              </p>
            </div>

            <div className="text-center mt-2">
              <Link href="/registration" className="text-[#0052b4] text-sm">
                ← Back to Registration
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
