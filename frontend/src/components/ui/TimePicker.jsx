"use client";

import React, { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

const HOURS_12   = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const PERIODS    = ["AM", "PM"];

const H_REPS = 3;
const M_REPS = 3;

const HOURS_LOOP   = Array.from({ length: H_REPS }, () => HOURS_12).flat();
const MINUTES_LOOP = Array.from({ length: M_REPS }, () => MINUTES_60).flat();

// Module-level so these objects/strings are never recreated on re-render
const NO_SCROLLBAR = { scrollbarWidth: "none", msOverflowStyle: "none" };
const COL_CLASS    = "overflow-y-auto flex flex-col items-center py-1 border-r border-gray-100";
const SEG_CLASS    = "text-sm font-medium text-center rounded-sm cursor-default select-none outline-none focus:bg-info focus:text-white caret-transparent";

function to12h(value) {
  const [hStr, mStr] = (value || "09:00").split(":");
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return { hour: String(hour).padStart(2, "0"), minute: mStr || "00", period };
}

function to24h(hour, minute, period) {
  let h = parseInt(hour, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

// Scroll the middle-copy selected item to the vertical center of its column
function scrollToCenter(ref, val, baseList, reps) {
  const el = ref.current;
  if (!el) return;
  const itemH    = el.scrollHeight / (baseList.length * reps);
  const midStart = Math.floor(reps / 2) * baseList.length;
  const idx      = midStart + baseList.indexOf(val);
  el.scrollTop   = idx * itemH - el.clientHeight / 2 + itemH / 2;
}

// When the user reaches the first or last copy, silently jump to the same
// position in the adjacent middle copy — creates the infinite-scroll illusion
function cyclicScroll(ref, reps) {
  const el = ref.current;
  if (!el) return;
  const singleH = el.scrollHeight / reps;
  if (el.scrollTop < singleH)                    el.scrollTop += singleH;
  else if (el.scrollTop >= singleH * (reps - 1)) el.scrollTop -= singleH;
}

export default function TimePicker({ value, onChange, className = "" }) {
  const { hour, minute, period } = to12h(value);
  const [open, setOpen] = useState(false);

  const hourBuf    = useRef("");
  const minuteBuf  = useRef("");
  const containerRef  = useRef(null);
  const minuteRef     = useRef(null);
  const periodRef     = useRef(null);
  const hoursColRef   = useRef(null);
  const minutesColRef = useRef(null);

  const emit = (h, m, p) => onChange?.(to24h(h, m, p));

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Center the selected item in each column when the panel opens
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      scrollToCenter(hoursColRef,   hour,   HOURS_12,   H_REPS);
      scrollToCenter(minutesColRef, minute, MINUTES_60, M_REPS);
    }, 10);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Segment keyboard handlers ──────────────────────────────────────────────

  const handleHourKey = (e) => {
    const h = parseInt(hour, 10);
    if (e.key === "ArrowUp") {
      e.preventDefault();
      emit(String((h % 12) + 1).padStart(2, "0"), minute, period);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      emit(String(h === 1 ? 12 : h - 1).padStart(2, "0"), minute, period);
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const buf = hourBuf.current + e.key;
      const num = parseInt(buf, 10);
      if (buf.length === 1 && num <= 1) {
        hourBuf.current = buf;
        emit(String(num || 12).padStart(2, "0"), minute, period);
      } else {
        emit(String(Math.min(Math.max(num, 1), 12)).padStart(2, "0"), minute, period);
        hourBuf.current = "";
        minuteRef.current?.focus();
      }
    }
  };

  const handleMinuteKey = (e) => {
    const m = parseInt(minute, 10);
    if (e.key === "ArrowUp") {
      e.preventDefault();
      emit(hour, String((m + 1) % 60).padStart(2, "0"), period);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      emit(hour, String((m + 59) % 60).padStart(2, "0"), period);
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      const buf = minuteBuf.current + e.key;
      const num = parseInt(buf, 10);
      if (buf.length === 1 && num <= 5) {
        minuteBuf.current = buf;
        emit(hour, String(num).padStart(2, "0"), period);
      } else {
        emit(hour, String(Math.min(num, 59)).padStart(2, "0"), period);
        minuteBuf.current = "";
        periodRef.current?.focus();
      }
    }
  };

  const handlePeriodKey = (e) => {
    if (e.key === "a" || e.key === "A") { e.preventDefault(); emit(hour, minute, "AM"); }
    else if (e.key === "p" || e.key === "P") { e.preventDefault(); emit(hour, minute, "PM"); }
    else if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
      e.preventDefault();
      emit(hour, minute, period === "AM" ? "PM" : "AM");
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>

      {/* ── Segmented input row ────────────────────────────────────────────── */}
      <div className="flex items-center border border-gray-200 rounded-lg bg-white px-3 py-2.5 focus-within:border-info focus-within:ring-1 focus-within:ring-info/20 transition-colors">

        <div className="flex flex-nowrap items-center gap-0.5 flex-1">
          <span
            tabIndex={0} role="spinbutton" aria-label="Hour"
            onBlur={() => { hourBuf.current = ""; }}
            onKeyDown={handleHourKey}
            className={`${SEG_CLASS} w-6`}
          >
            {hour}
          </span>

          <span className="text-gray-400 text-sm select-none">:</span>

          <span
            ref={minuteRef}
            tabIndex={0} role="spinbutton" aria-label="Minute"
            onBlur={() => { minuteBuf.current = ""; }}
            onKeyDown={handleMinuteKey}
            className={`${SEG_CLASS} w-6`}
          >
            {minute}
          </span>

          <span
            ref={periodRef}
            tabIndex={0} role="spinbutton" aria-label="AM/PM"
            onKeyDown={handlePeriodKey}
            className={`${SEG_CLASS} w-9 ml-1 text-gray-500 focus:text-white`}
          >
            {period}
          </span>
        </div>

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(o => !o)}
          className="shrink-0 text-gray-300 hover:text-info transition-colors focus:outline-none cursor-pointer"
        >
          <Clock size={15} />
        </button>
      </div>

      {/* ── Scroll picker panel ────────────────────────────────────────────── */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">

          {/* Column labels */}
          <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50/80">
            {["Hr", "Min", "Period"].map((l) => (
              <span key={l} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide py-1.5">
                {l}
              </span>
            ))}
          </div>

          {/* Columns */}
          <div className="grid grid-cols-3 h-44 text-sm">

            {/* Hours */}
            <div
              ref={hoursColRef}
              onScroll={() => cyclicScroll(hoursColRef, H_REPS)}
              className={COL_CLASS} style={NO_SCROLLBAR}
            >
              {HOURS_LOOP.map((h, i) => (
                <button key={i} type="button"
                  onClick={() => emit(h, minute, period)}
                  className={`w-[calc(100%-8px)] text-center py-1.5 my-0.5 rounded-md font-medium transition-colors ${
                    hour === h ? "bg-info text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div
              ref={minutesColRef}
              onScroll={() => cyclicScroll(minutesColRef, M_REPS)}
              className={COL_CLASS} style={NO_SCROLLBAR}
            >
              {MINUTES_LOOP.map((m, i) => (
                <button key={i} type="button"
                  onClick={() => emit(hour, m, period)}
                  className={`w-[calc(100%-8px)] text-center py-1.5 my-0.5 rounded-md font-medium transition-colors ${
                    minute === m ? "bg-info text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* AM / PM — just two items, centered vertically */}
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              {PERIODS.map((p) => (
                <button key={p} type="button"
                  onClick={() => emit(hour, minute, p)}
                  className={`w-[calc(100%-12px)] text-center py-2.5 text-xs font-bold rounded-md transition-colors ${
                    period === p ? "bg-info text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/80 flex justify-between items-center">
            <span className="text-xs font-semibold text-info">{hour}:{minute} {period}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn btn-sm btn-ghost text-info shadow-none rounded-md px-4"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
