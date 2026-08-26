"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export default function AIChatLocked({ detail, courseId, isAuthenticated = true, notConfigured = false }) {
  const upgradeHref = courseId ? `/courses/${courseId}/subscribe` : "/pricing";

  const title = !isAuthenticated
    ? "Login required"
    : notConfigured
    ? "Ask AI isn't ready yet"
    : "Enrollment required";

  const message = !isAuthenticated
    ? "Please log in to use Ask AI."
    : detail || "This lesson is part of paid content. Enroll in this course to unlock it.";

  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center px-6 mt-24 h-[calc(100vh-224px)] bg-slate-900 rounded-2xl">
      <Lock className="w-8 h-8 text-white/70" />
      <p className="text-white font-bold text-lg">{title}</p>
      <p className="text-white/60 text-sm max-w-md">{message}</p>
      {!notConfigured && (
        <Link
          href={isAuthenticated ? upgradeHref : "/login/student"}
          className="btn btn-sm bg-white text-black hover:bg-white/90 border-none mt-2"
        >
          {isAuthenticated ? "View Plans" : "Login"}
        </Link>
      )}
    </div>
  );
}