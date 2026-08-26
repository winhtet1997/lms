"use client";

import { useState, useEffect, useRef } from "react";
import { User, Mail, Phone, Shield, Calendar, Loader2, Camera } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { resolveMediaUrl } from "@/lib/media";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
};

export default function ProfileSection({ user }) {
    const t = useTranslations("AccountSettings");
    const { updateMe } = useAuthStore();

    const [form, setForm] = useState({
        full_name: "",
        username: "",
        email: "",
        phone: "",
        dob: "",
    });
    const [saving, setSaving] = useState(false);

    const fileInputRef = useRef(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                full_name: user.full_name || "",
                username: user.username || "",
                email: user.email || "",
                phone: user.phone || "",
                dob: user.dob || "",
            });
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateMe({ ...form, dob: form.dob || null });
            toast.success(t("toastSaveSuccess"));
        } catch (err) {
            toast.error(err?.message || t("toastSaveError"));
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(t("avatarInvalidType"));
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            toast.error(t("avatarTooLarge"));
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setAvatarPreview(objectUrl);
        setUploadingAvatar(true);
        try {
            const avatarForm = new FormData();
            avatarForm.append("avatar", file);
            await updateMe(avatarForm);
            toast.success(t("avatarUploadSuccess"));
        } catch (err) {
            toast.error(err?.message || t("avatarUploadError"));
        } finally {
            setUploadingAvatar(false);
            URL.revokeObjectURL(objectUrl);
            setAvatarPreview(null);
        }
    };

    const avatarUrl = avatarPreview || resolveMediaUrl(user.avatar);

    return (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-6">
            <div>
                <h2 className="text-base font-semibold">{t("profileSectionTitle")}</h2>
                <p className="text-sm text-gray-500">{t("profileSectionSubtitle")}</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-full bg-info flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={user.full_name || user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            getInitials(user.full_name || user.username)
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-300 text-gray-600 flex items-center justify-center shadow-sm"
                    >
                        {uploadingAvatar ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Camera className="w-3.5 h-3.5" />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="hidden"
                    />
                </div>
                <div>
                    <p className="font-semibold text-gray-800">
                        {user.full_name || user.username}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-info badge-sm gap-1">
                            <Shield className="w-3 h-3" />
                            {user.role}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {t("joinedLabel")} {user.date_joined}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("labelFullName")}
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 focus-within:border-blue-400 transition-colors">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={form.full_name}
                            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                            placeholder={t("placeholderFullName")}
                            className="input input-ghost flex-1 focus:outline-none px-0 h-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("labelUsername")}
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 focus-within:border-blue-400 transition-colors">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={form.username}
                            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                            placeholder={t("placeholderUsername")}
                            className="input input-ghost flex-1 focus:outline-none px-0 h-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("labelEmail")}
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 focus-within:border-blue-400 transition-colors">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            placeholder={t("placeholderEmail")}
                            className="input input-ghost flex-1 focus:outline-none px-0 h-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("labelPhone")}
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 focus-within:border-blue-400 transition-colors">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                            placeholder={t("placeholderPhone")}
                            className="input input-ghost flex-1 focus:outline-none px-0 h-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("labelDateOfBirth")}
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 focus-within:border-blue-400 transition-colors">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="date"
                            value={form.dob}
                            onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                            className="input input-ghost flex-1 focus:outline-none px-0 h-11"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                        {t("labelRole")}
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 gap-2 bg-gray-50">
                        <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={user.role}
                            readOnly
                            className="input input-ghost flex-1 focus:outline-none px-0 h-11 text-gray-400 cursor-not-allowed"
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t("roleHint")}</p>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-info shadow-none min-w-32"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("saveChangesButton")}
                </button>
            </div>
        </div>
    );
}
