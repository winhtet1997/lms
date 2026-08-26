"use client";

import { useRef, useState } from "react";
import { Pencil, User as UserIcon, Camera, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

export default function ProfileCard({
    name,
    avatarUrl,
    editing,
    badgeLabel,
    BadgeIcon,
    editLabel,
    onEditProfile,
    avatarLabels = {},
}) {
    const { updateMe } = useAuthStore();
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const openFilePicker = () => {
        if (editing && !uploading) fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error(avatarLabels.invalidType);
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            toast.error(avatarLabels.tooLarge);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setUploading(true);
        try {
            const form = new FormData();
            form.append("avatar", file);
            await updateMe(form);
            toast.success(avatarLabels.success);
        } catch (err) {
            toast.error(err?.message || avatarLabels.error);
        } finally {
            setUploading(false);
            URL.revokeObjectURL(objectUrl);
            setPreview(null);
        }
    };

    const displayedAvatar = preview || avatarUrl;

    return (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
            <div className="relative">
                <div
                    onClick={openFilePicker}
                    className={`w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ${
                        editing ? "cursor-pointer" : ""
                    }`}
                >
                    {displayedAvatar ? (
                        <img src={displayedAvatar} alt={name} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-12 h-12 text-gray-400" />
                    )}
                </div>

                {editing && (
                    <button
                        type="button"
                        onClick={openFilePicker}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-info text-white flex items-center justify-center border-2 border-white"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            <p className="font-semibold text-gray-800 text-lg">{name}</p>

            <span className="badge badge-info badge-sm gap-1">
                <BadgeIcon className="w-3 h-3" />
                {badgeLabel}
            </span>

            <button
                onClick={onEditProfile}
                className="btn btn-info shadow-none w-full mt-2 gap-2"
            >
                <Pencil className="w-4 h-4" />
                {editLabel}
            </button>
        </div>
    );
}
