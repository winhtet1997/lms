import React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Clock, PhoneOff, User, Users } from "lucide-react";

export default function SessionCard({
  session,
  isPrivate,
  onApprove,
  onReject,
  onEnd,
}) {
  const t = useTranslations("SessionCard");
  const locale = useLocale();
  const displayStatus = session.displayStatus ?? session.status;
  const isLive = session.status === "live";
  const isPast = session.scheduled_at
    ? new Date(session.scheduled_at) <= new Date()
    : false;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">
            {session.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("tutorLabel")}: {session.tutor}
          </p>
        </div>

        {displayStatus === "upcoming" && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            {t("statusUpcoming")}
          </span>
        )}
        {displayStatus === "not_approved" && isPast && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            {t("statusTimePassed")}
          </span>
        )}
        {displayStatus === "not_approved" && !isPast && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            {t("statusNotApproved")}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex gap-2 items-center">
          <Calendar size={12} /> {session.date}
        </span>
        <span className="flex gap-2 items-center">
          <Clock size={12} /> {session.time}
        </span>
        {isPrivate ? (
          <span className="flex gap-2 items-center">
            <User size={12} /> {session.student}
          </span>
        ) : (
          <span className="flex gap-2 items-center">
            <Users size={12} />{" "}
            {t("studentsCount", { count: session.students })}
          </span>
        )}
      </div>

      {displayStatus === "not_approved" && (
        <div className="flex gap-2 mt-1 border-t border-gray-100 pt-3 justify-end">
          {!isPast && (
            <button
              onClick={() => onApprove?.(session.id)}
              className="btn btn-xs btn-info border-none shadow-none text-white text-xs font-semibold px-3 py-1"
            >
              <Clock size={12} /> {t("approveButton")}
            </button>
          )}
          <button
            onClick={() => onReject?.(session.id)}
            className="btn btn-xs btn-outline border-gray-300 shadow-none text-xs font-semibold px-3 py-1"
          >
            {t("declineButton")}
          </button>
        </div>
      )}

      {displayStatus === "upcoming" && (
        <div className="flex gap-2 mt-1 border-t border-gray-100 pt-3 justify-end">
          <button
            onClick={() =>
              window.open(
                `/${locale}/dashboard/sessions/${session.id}`,
                "_blank",
              )
            }
            className="btn btn-xs btn-info border-none shadow-none text-white text-xs font-semibold px-3 py-1"
          >
            {isLive ? t("joinNowButton") : t("startSessionButton")}
          </button>
          {isLive && (
            <button
              onClick={() => onEnd?.(session.id)}
              className="btn btn-xs btn-error border-none shadow-none text-white text-xs font-semibold px-3 py-1 gap-1"
            >
              <PhoneOff size={12} /> {t("endButton")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
