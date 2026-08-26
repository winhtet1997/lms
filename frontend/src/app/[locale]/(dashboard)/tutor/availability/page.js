"use client";
import React, { useEffect, useState } from "react";
import { sessionService } from "@/service/sessionService";
import { Plus, Trash2, Clock } from "lucide-react";

const DAYS = [
    { value: 0, label: "Monday" },
    { value: 1, label: "Tuesday" },
    { value: 2, label: "Wednesday" },
    { value: 3, label: "Thursday" },
    { value: 4, label: "Friday" },
    { value: 5, label: "Saturday" },
    { value: 6, label: "Sunday" },
];

const EMPTY_FORM = { day_of_week: 0, start_time: "09:00", end_time: "10:00" };

function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

function AddSlotForm({ onSave, saving, error }) {
  const t = useTranslations("TutorAvailabilityPage");
  const [form, setForm] = useState(EMPTY_FORM);

  const days = [
    { value: 0, label: t("monday") },
    { value: 1, label: t("tuesday") },
    { value: 2, label: t("wednesday") },
    { value: 3, label: t("thursday") },
    { value: 4, label: t("friday") },
    { value: 5, label: t("saturday") },
    { value: 6, label: t("sunday") },
  ];

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await onSave(form);
    if (ok) setForm(EMPTY_FORM);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-5"
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Plus size={14} className="text-blue-500" /> {t("addSlotTitle")}
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            {t("labelDay")}
          </label>
          <select
            value={form.day_of_week}
            onChange={(e) =>
              handleChange("day_of_week", Number(e.target.value))
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
          >
            {days.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            {t("labelStartTime")}
          </label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => handleChange("start_time", e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            {t("labelEndTime")}
          </label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => handleChange("end_time", e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="btn btn-info btn-sm shadow-none rounded-lg px-5 disabled:opacity-40"
      >
        {saving ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          t("saveSlotButton")
        )}
      </button>
    </form>
  );
}

function SlotRow({ slot, onToggle, onDelete, busy }) {
  const t = useTranslations("TutorAvailabilityPage");
  const days = [
    { value: 0, label: t("monday") },
    { value: 1, label: t("tuesday") },
    { value: 2, label: t("wednesday") },
    { value: 3, label: t("thursday") },
    { value: 4, label: t("friday") },
    { value: 5, label: t("saturday") },
    { value: 6, label: t("sunday") },
  ];
  const day = days.find((d) => d.value === slot.day_of_week);

  return (
    <div
      className={`flex items-center justify-between py-3 px-4 rounded-lg border transition-colors ${
        slot.is_active
          ? "bg-white border-gray-200"
          : "bg-gray-50 border-gray-100"
      }`}
    >
      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold text-gray-600 w-20">
          {day?.label}
        </span>
        <span className="flex items-center gap-1 text-sm text-gray-700">
          <Clock size={13} className="text-gray-400" />
          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            className="toggle toggle-xs toggle-success"
            checked={slot.is_active}
            onChange={() => onToggle(slot)}
            disabled={busy}
          />
          <span className="text-xs text-gray-500">
            {slot.is_active ? t("activeLabel") : t("inactiveLabel")}
          </span>
        </label>
        <button
          onClick={() => onDelete(slot.id)}
          disabled={busy}
          className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function TutorAvailabilityPage() {
  const t = useTranslations("TutorAvailabilityPage");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [addError, setAddError] = useState(null);

  const days = [
    { value: 0, label: t("monday") },
    { value: 1, label: t("tuesday") },
    { value: 2, label: t("wednesday") },
    { value: 3, label: t("thursday") },
    { value: 4, label: t("friday") },
    { value: 5, label: t("saturday") },
    { value: 6, label: t("sunday") },
  ];

  const fetchSlots = async () => {
    try {
      const data = await sessionService.getMyAvailability();
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleAdd = async (form) => {
    setSaving(true);
    setAddError(null);
    try {
      await sessionService.addAvailabilitySlot(form);
      await fetchSlots();
      return true;
    } catch (e) {
      const msg =
        e?.response?.data?.non_field_errors?.[0] ||
        e?.response?.data?.detail ||
        t("failedToAddError");
      setAddError(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (slot) => {
    setBusyId(slot.id);
    try {
      await sessionService.updateAvailabilitySlot(slot.id, {
        is_active: !slot.is_active,
      });
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id ? { ...s, is_active: !s.is_active } : s,
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await sessionService.deleteAvailabilitySlot(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const grouped = days
    .map((day) => ({
      ...day,
      slots: slots.filter((s) => s.day_of_week === day.value),
    }))
    .filter((d) => d.slots.length > 0);

  return (
    <div className="pt-24 pb-12 max-w-2xl mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("pageSubtitle")}</p>
      </div>

      <AddSlotForm onSave={handleAdd} saving={saving} error={addError} />

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">
          {t("totalSlotsCount", { count: slots.length })}
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-md text-slate-400" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Clock size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t("emptyStateTitle")}</p>
            <p className="text-xs mt-1">{t("emptyStateSubtitle")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map((day) => (
              <div key={day.value}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {day.label}
                </p>
                <div className="flex flex-col gap-2">
                  {day.slots.map((slot) => (
                    <SlotRow
                      key={slot.id}
                      slot={slot}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      busy={busyId === slot.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
