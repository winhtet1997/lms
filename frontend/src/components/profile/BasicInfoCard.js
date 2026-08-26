"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

const editableKeys = (extraFields) =>
    extraFields.filter((f) => f.kind !== "disabled").map((f) => f.key);

const buildForm = (user, extraFields) => {
    const form = {
        full_name: user.full_name || "",
        username: user.username || "",
        phone: user.phone || "",
    };
    editableKeys(extraFields).forEach((key) => {
        form[key] = user[key] || "";
    });
    return form;
};

const fieldRowClass = (disabled) =>
    `flex items-center border rounded-lg px-3 gap-2 transition-colors ${
        disabled
            ? "bg-gray-50 border-gray-200"
            : "border-gray-300 focus-within:border-blue-400"
    }`;

const inputClass = (disabled) =>
    `input input-ghost flex-1 focus:outline-none px-0 h-11 ${
        disabled ? "text-gray-400 cursor-not-allowed" : ""
    }`;

export default function BasicInfoCard({
    user,
    editing,
    onStopEditing,
    titleLabel,
    subtitleLabel,
    labels,
    toasts,
    extraFields = [],
}) {
    const { updateMe } = useAuthStore();

    const [form, setForm] = useState(() => buildForm(user, extraFields));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) setForm(buildForm(user, extraFields));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleCancel = () => {
        setForm(buildForm(user, extraFields));
        onStopEditing();
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...form };
            extraFields.forEach((field) => {
                if (field.kind === "date" && payload[field.key] === "") {
                    payload[field.key] = null;
                }
            });
            await updateMe(payload);
            toast.success(toasts.success);
            onStopEditing();
        } catch (err) {
            toast.error(err?.message || toasts.error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">{titleLabel}</h2>
                    <p className="text-sm text-gray-500">{subtitleLabel}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {labels.fullName}
                    </label>
                    <div className={fieldRowClass(!editing)}>
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={form.full_name}
                            disabled={!editing}
                            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                            placeholder={labels.placeholderFullName}
                            className={inputClass(!editing)}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {labels.username}
                    </label>
                    <div className={fieldRowClass(!editing)}>
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={form.username}
                            disabled={!editing}
                            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                            placeholder={labels.placeholderUsername}
                            className={inputClass(!editing)}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {labels.email}
                    </label>
                    <div className={fieldRowClass(true)}>
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="email"
                            value={user.email || ""}
                            readOnly
                            className={inputClass(true)}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{labels.emailHint}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {labels.phone}
                    </label>
                    <div className={fieldRowClass(!editing)}>
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="tel"
                            value={form.phone}
                            disabled={!editing}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            placeholder={labels.placeholderPhone}
                            className={inputClass(!editing)}
                        />
                    </div>
                </div>

                {extraFields.map((field) => {
                    const Icon = field.Icon;
                    const colSpanClass = field.colSpan === 2 ? "md:col-span-2" : "";

                    if (field.kind === "date") {
                        return (
                            <div key={field.key} className={colSpanClass}>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    {field.label}
                                </label>
                                <div className={fieldRowClass(!editing)}>
                                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input
                                        type="date"
                                        value={form[field.key]}
                                        disabled={!editing}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, [field.key]: e.target.value }))
                                        }
                                        className={inputClass(!editing)}
                                    />
                                </div>
                            </div>
                        );
                    }

                    if (field.kind === "select") {
                        return (
                            <div key={field.key} className={colSpanClass}>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    {field.label}
                                </label>
                                <div className={fieldRowClass(!editing)}>
                                    <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                                    <select
                                        value={form[field.key]}
                                        disabled={!editing}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, [field.key]: e.target.value }))
                                        }
                                        className={`select border-none  flex-1 focus:outline-none px-0 h-11 ${
                                            !editing ? "text-gray-400 cursor-not-allowed" : ""
                                        }`}
                                    >
                                        <option value="">-</option>
                                        {field.options.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={field.key} className={colSpanClass}>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                {field.label}
                            </label>
                            <div className={fieldRowClass(true)}>
                                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    value=""
                                    readOnly
                                    placeholder={field.placeholder}
                                    className={inputClass(true)}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{field.hint}</p>
                        </div>
                    );
                })}
            </div>

            {editing && (
                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="btn btn-outline shadow-none"
                    >
                        {labels.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-info shadow-none min-w-32"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : labels.save}
                    </button>
                </div>
            )}
        </div>
    );
}
