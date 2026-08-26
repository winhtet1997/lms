"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";

function buildSlots(availabilitySlots, date) {
  const dayOfWeek = date.getDay();
  const backendDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const cutoff = new Date(Date.now() + 1 * 60 * 1000);

  return availabilitySlots
    .filter((s) => s.day_of_week === backendDay && s.is_active)
    .map((s) => {
      const [h, m] = s.start_time.split(":").map(Number);
      const dt = new Date(date);
      dt.setHours(h, m, 0, 0);
      const label = dt.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return {
        label,
        isoString: dt.toISOString(),
        startTime: s.start_time,
        endTime: s.end_time,
        dt,
      };
    })
    .filter((slot) => slot.dt > cutoff);
}

function MiniCalendar({ value, onChange }) {
  const t = useTranslations("BookTutorPage");
  const DAYS = [
    t("daySun"),
    t("dayMon"),
    t("dayTue"),
    t("dayWed"),
    t("dayThu"),
    t("dayFri"),
    t("daySat"),
  ];
  const MONTHS = [
    t("monthJanuary"),
    t("monthFebruary"),
    t("monthMarch"),
    t("monthApril"),
    t("monthMay"),
    t("monthJune"),
    t("monthJuly"),
    t("monthAugust"),
    t("monthSeptember"),
    t("monthOctober"),
    t("monthNovember"),
    t("monthDecember"),
  ];

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const isPast = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(23, 59, 59);
    return d < today;
  };

  const isSelected = (day) =>
    value &&
    value.getFullYear() === viewYear &&
    value.getMonth() === viewMonth &&
    value.getDate() === day;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs text-gray-400 font-medium py-1"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className="flex justify-center">
            {day ? (
              <button
                disabled={isPast(day)}
                onClick={() => onChange(new Date(viewYear, viewMonth, day))}
                className={`w-8 h-8 rounded-full text-sm transition-colors ${
                  isSelected(day)
                    ? "bg-blue-600 text-white font-semibold"
                    : isPast(day)
                      ? "text-gray-300 cursor-not-allowed"
                      : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {day}
              </button>
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SelectTimeStep({
  availability,
  loadingSlots,
  selectedDate,
  selectedSlot,
  onDateChange,
  onSlotSelect,
  onNext,
  onBack,
}) {
  const t = useTranslations("BookTutorPage");
  const slots = selectedDate ? buildSlots(availability, selectedDate) : [];
  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">
        {t("selectDateTimeTitle")}
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        {t("selectDateTimeSubtitle")}
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <Calendar size={12} /> {t("selectDateLabel")}
          </p>
          <MiniCalendar value={selectedDate} onChange={onDateChange} />
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
            <Clock size={12} /> {t("availableSlotsLabel")}
            {dateLabel && (
              <span className="font-normal text-gray-400 ml-1">
                {dateLabel}
              </span>
            )}
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-50">
            {!selectedDate ? (
              <p className="text-sm text-gray-400 text-center pt-8">
                {t("selectDateFirst")}
              </p>
            ) : loadingSlots ? (
              <div className="flex justify-center pt-8">
                <span className="loading loading-spinner loading-sm text-slate-400" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-400 text-center pt-8">
                {t("noSlotsAvailable")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.isoString}
                    onClick={() => onSlotSelect(slot)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSlot?.isoString === slot.isoString
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="btn btn-sm btn-ghost rounded-lg px-6"
        >
          {t("backButton")}
        </button>
        <button
          onClick={onNext}
          disabled={loadingSlots || !selectedDate || !selectedSlot}
          className="btn btn-info btn-sm px-6 rounded-lg disabled:opacity-40"
        >
          {t("continueButton")}
        </button>
      </div>
    </div>
  );
}
