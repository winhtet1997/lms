"use client";
import { useAuthStore } from "@/store/useAuthStore";
import { Mail, Phone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ForgotPassword = () => {
  const t = useTranslations("ForgotPassword");
  const [step, setStep] = useState(1); // 1 = enter username, 2 = choose channel
  const [username, setUsername] = useState("");
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getChannels = useAuthStore((state) => state.getForgotPasswordChannels);
  const forgotPassword = useAuthStore((state) => state.ForgotPassword);
  const error = useAuthStore((state) => state.error);
  const fieldErrors = useAuthStore((state) => state.fieldErrors);
  const reset = useAuthStore((state) => state.resetErrors);

  const router = useRouter();

  useEffect(() => {
    reset();
  }, [reset]);

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    reset();

    setSubmitting(true);
    try {
      const result = await getChannels(username.trim());
      const availableChannels = result?.channels || [];

      if (availableChannels.length === 0) {
        alert(t("noChannelsFound"));
        return;
      }

      setChannels(availableChannels);
      setSelectedChannel(availableChannels[0].type);
      setStep(2);
    } catch (err) {
      console.error("Failed to look up channels", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    reset();

    setSubmitting(true);
    try {
      const result = await forgotPassword({
        username: username.trim(),
        channel: selectedChannel,
      });

      localStorage.setItem("pendingUsername", username.trim());
      localStorage.setItem("pendingChannel", selectedChannel);
      localStorage.setItem("pendingMaskedContact", result?.masked_contact || "");
      localStorage.removeItem("pendingEmail");
      localStorage.removeItem("pendingPhone");

      router.push("/forgot-password/verify-otp?type=reset");
    } catch (err) {
      console.error("Forgot password failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-200">
        <div className="card-body gap-4">
          {step === 1 && (
            <form onSubmit={handleUsernameSubmit}>
              <h1 className="text-2xl font-semibold text-center text-black my-2">
                {t("title")}
              </h1>
              <p className="text-center text-sm text-gray-500">
                {t("usernameSubtitle")}
              </p>

              <div className="form-control gap-1 my-3">
                <label className="input w-full">
                  <User size={16} color="#737373" />
                  <input
                    type="text"
                    placeholder={t("usernamePlaceholder")}
                    className="w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </label>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {fieldErrors && Object.keys(fieldErrors).length > 0 && (
                <div className="text-red-500 text-sm">
                  {Object.values(fieldErrors).map((msg, i) => (
                    <p key={i}>{msg}</p>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn bg-[#0052b4] w-full text-white rounded-lg shadow-none my-2 disabled:opacity-70"
              >
                {submitting ? t("loadingButton") : t("nextButton")}
              </button>

              <div className="text-center">
                <Link href="/" className="text-[#0052b4] text-sm">
                  {t("backToHome")}
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSendCode}>
              <h1 className="text-2xl font-semibold text-center text-black my-2">
                {t("chooseChannelTitle")}
              </h1>
              <p className="text-center text-sm text-gray-500">
                {t("chooseChannelSubtitle")}
              </p>

              <div className="flex flex-col gap-2 my-3">
                {channels.map((ch) => (
                  <label
                    key={ch.type}
                    className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition ${
                      selectedChannel === ch.type
                        ? "border-[#0052b4] bg-blue-50"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={ch.type}
                      checked={selectedChannel === ch.type}
                      onChange={() => setSelectedChannel(ch.type)}
                      className="radio radio-sm"
                    />
                    {ch.type === "email" ? (
                      <Mail size={16} />
                    ) : (
                      <Phone size={16} />
                    )}
                    <span className="text-sm">{ch.masked}</span>
                  </label>
                ))}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {fieldErrors && Object.keys(fieldErrors).length > 0 && (
                <div className="text-red-500 text-sm">
                  {Object.values(fieldErrors).map((msg, i) => (
                    <p key={i}>{msg}</p>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn bg-[#0052b4] w-full text-white rounded-lg shadow-none my-2 disabled:opacity-70"
              >
                {submitting ? t("loadingButton") : t("sendCodeButton")}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[#0052b4] text-sm underline"
                >
                  {t("backButton")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;