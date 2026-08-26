"use client";
import React, { useEffect, useState } from "react";
import { sessionService } from "@/service/sessionService";
import { Plus, Trash2, Clock } from "lucide-react";
import TimePicker from "@/components/ui/TimePicker";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ui/AlertModal";
import { useTranslations } from "next-intl";


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

    const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const ok = await onSave(form);
        if (ok) setForm(EMPTY_FORM);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Plus size={14} className="text-blue-500" /> {t("addSlotTitle")}
            </h3>

            <div className="grid md:grid-cols-3 gap-3 mb-4">
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t("labelDay")}</label>
                    <select
                        value={form.day_of_week}
                        onChange={e => handleChange("day_of_week", Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-blue-400"
                    >
                        {days.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t("labelStartTime")}</label>
                    <TimePicker value={form.start_time} onChange={v => handleChange("start_time", v)} />
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">{t("labelEndTime")}</label>
                    <TimePicker value={form.end_time} onChange={v => handleChange("end_time", v)} />
                </div>

            </div>

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
                type="submit"
                disabled={saving}
                className="btn btn-info btn-sm shadow-none rounded-lg px-5 disabled:opacity-40"
            >
                {saving ? <span className="loading loading-spinner loading-xs" /> : t("saveSlotButton")}
            </button>
        </form>
    );
}

function SlotRow({ slot, onToggle, onDelete, busy }) {
    const t = useTranslations("TutorAvailabilityPage");
    return (
        <div 
            className={`grid items-center justify-between py-2 px-3 rounded-lg border transition-all duration-200 gap-2 w-full ${
                slot.is_active 
                    ? "bg-white border-gray-200 shadow-sm" 
                    : "bg-gray-100 border-gray-100 opacity-65"
            }`}
        >
            {/* Left Side: Time */}
            <div className="flex items-start -full gap-2">
                <div className={`shrink-0 p-1 rounded-md transition-colors ${slot.is_active ? "bg-blue-50" : "bg-gray-100"}`}>
                    <Clock size={12} className={slot.is_active ? "text-blue-500" : "text-gray-400"} />
                </div>
                <span className="text-xs font-medium text-gray-700 ">
                  {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                </span>
            </div>

            {/* Right Side: Control Actions */}
            <div className="flex items-center gap-2 shrink-0">
                {/* Active Switch */}
                <label className="flex items-center gap-1 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="toggle toggle-xs toggle-success"
                        checked={slot.is_active}
                        onChange={() => onToggle(slot)}
                        disabled={busy}
                    />
                    <span className="text-[10px] font-medium text-gray-400 hidden sm:inline-block w-8">
                        {slot.is_active ? t("activeLabel") : t("inactiveLabel")}
                    </span>
                </label>

                {/* Micro-Divider */}
                <div className="h-3.5 w-px bg-gray-200 hidden sm:block" />

                {/* Delete button */}
                <button
                    onClick={() => onDelete(slot.id)}
                    disabled={busy}
                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}

export default function TutorAvailabilityPage() {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [addError, setAddError] = useState(null);
    const { confirm, ConfirmModal } = useConfirm();
    const t = useTranslations("TutorAvailabilityPage");

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

    useEffect(() => { fetchSlots(); }, []);

    const handleAdd = async (form) => {
        setSaving(true);
        setAddError(null);
        try {
            await sessionService.addAvailabilitySlot(form);
            await fetchSlots();
            toast.success(t("slotAddedToast"));
            return true;
        } catch (e) {
            const msg = e?.response?.data?.non_field_errors?.[0]
                || e?.response?.data?.detail
                || t("failedToAddError");
            setAddError(msg);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (slot) => {
        setBusyId(slot.id);
        try {
            await sessionService.updateAvailabilitySlot(slot.id, { is_active: !slot.is_active });
            setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, is_active: !s.is_active } : s));
            if (!slot.is_active) {
                toast.success(t("slotActivatedToast"));
            } else {
                toast(t("slotArchivedToast"), { icon: "🗃️" });
            }
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (id) => {
        document.activeElement.blur(); 
        const ok = await confirm({
            title: t("deleteSlotTitle"),
            message: t("deleteSlotMessage"),
            confirmText: t("deleteSlotButton"),
        });
        if (!ok) return;
        setBusyId(id);
        try {
            await sessionService.deleteAvailabilitySlot(id);
            setSlots(prev => prev.filter(s => s.id !== id));
            toast.success(t("slotDeletedToast"));
        } finally {
            setBusyId(null);
        }
    };

    // Group slots by day for display
    const translatedDays = [
        { value: 0, label: t("monday") },
        { value: 1, label: t("tuesday") },
        { value: 2, label: t("wednesday") },
        { value: 3, label: t("thursday") },
        { value: 4, label: t("friday") },
        { value: 5, label: t("saturday") },
        { value: 6, label: t("sunday") },
    ];

    const weeklyData = translatedDays.map(day => ({
        ...day,
        slots: slots.filter(s => s.day_of_week === day.value),
    }));

    return (
        <div className="p-3 container mx-auto w-full">
            <ConfirmModal />
            {/* Top Branding Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t("pageTitle")}</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {t("pageSubtitle")}
                </p>
            </div>

            <AddSlotForm onSave={handleAdd} saving={saving} error={addError} />

            {/* Weekly Grid Content Wrapper */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {t("weeklyOverviewTitle")}
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-semibold">
                        {t("totalSlotsCount", { count: slots.length })}
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20 bg-white rounded-xl border border-gray-150 shadow-sm">
                        <span className="loading loading-spinner loading-md text-slate-400" />
                    </div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl">
                        <Clock size={32} className="mx-auto mb-2 text-gray-300 opacity-60" />
                        <p className="text-sm font-medium text-gray-500">{t("emptyStateTitle")}</p>
                        <p className="text-xs text-gray-400 mt-1">{t("emptyStateSubtitle")}</p>
                    </div>
                ) : (
                   
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-start">
                        {weeklyData.map(day => (
                            <div 
                                key={day.value} 
                                className="bg-gray-50/60 rounded-xl p-3.5  border border-gray-200/60 lg:border-none shadow-sm  flex flex-col h-full min-w-0"
                            >
                                {/* Header Title for individual Day Columns */}
                                <div className="pb-2 mb-2.5 border-b border-gray-200/80 flex items-center justify-between lg:block">
                                    <p className="text-xs font-bold text-gray-800 lg:text-gray-400 uppercase tracking-wider">
                                        {day.label}
                                    </p>

                                </div>
                                
                                {/* Vertical container stack for active slots */}
                                <div className="flex flex-col gap-2 pt-0.5">
                                    {day.slots.length === 0 ? (
                                        <p className="text-[11px] font-medium italic text-gray-300 py-3 hidden lg:block text-center bg-white/40 border border-dashed border-gray-200 rounded-lg">
                                            {t("noSlotsDay")}
                                        </p>
                                    ) : (
                                        day.slots.map(slot => (
                                            <SlotRow
                                                key={slot.id}
                                                slot={slot}
                                                onToggle={handleToggle}
                                                onDelete={handleDelete}
                                                busy={busyId === slot.id}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
