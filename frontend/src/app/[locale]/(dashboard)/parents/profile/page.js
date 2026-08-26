"use client";

import { useState } from "react";
import { Users, Mail, Phone, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/useAuthStore";
import { resolveMediaUrl } from "@/lib/media";
import ProfileCard from "@/components/profile/ProfileCard";
import AccountInfoCard from "@/components/profile/AccountInfoCard";
import BasicInfoCard from "@/components/profile/BasicInfoCard";
import PasswordSection from "@/components/profile/PasswordSection";
import LinkedAccountsSection from "@/components/profile/LinkedAccountsSection";

export default function ParentProfilePage() {
    const c = useTranslations("ProfileCommon");
    const t = useTranslations("ParentProfilePage");
    const { user } = useAuthStore();
    const [editing, setEditing] = useState(false);

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 pt-20 pb-6 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <ProfileCard
                        name={user.full_name || user.username}
                        avatarUrl={resolveMediaUrl(user.avatar)}
                        editing={editing}
                        badgeLabel={t("parentAccountBadge")}
                        BadgeIcon={Users}
                        editLabel={c("editProfileButton")}
                        onEditProfile={() => setEditing(true)}
                        avatarLabels={{
                            success: c("avatarUploadSuccess"),
                            error: c("avatarUploadError"),
                            invalidType: c("avatarInvalidType"),
                            tooLarge: c("avatarTooLarge"),
                        }}
                    />
                    <AccountInfoCard
                        titleLabel={c("accountInfoTitle")}
                        rows={[
                            { Icon: Mail, value: user.email },
                            { Icon: Phone, value: user.phone },
                        ]}
                    />
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <BasicInfoCard
                        user={user}
                        editing={editing}
                        onStopEditing={() => setEditing(false)}
                        titleLabel={c("basicInfoSectionTitle")}
                        subtitleLabel={c("basicInfoSectionSubtitle")}
                        labels={{
                            fullName: c("labelFullName"),
                            placeholderFullName: c("placeholderFullName"),
                            username: c("labelUsername"),
                            placeholderUsername: c("placeholderUsername"),
                            email: c("labelEmail"),
                            emailHint: c("emailLockedHint"),
                            phone: c("labelPhone"),
                            placeholderPhone: c("placeholderPhone"),
                            cancel: c("cancelButton"),
                            save: c("saveChangesButton"),
                        }}
                        toasts={{ success: c("toastSaveSuccess"), error: c("toastSaveError") }}
                        extraFields={[
                            // {
                            //     key: "occupation",
                            //     kind: "disabled",
                            //     label: t("labelOccupation"),
                            //     Icon: Briefcase,
                            //     placeholder: t("placeholderOccupation"),
                            //     hint: c("comingSoonHint"),
                            //     colSpan: 1,
                            // },
                        ]}
                    />

                    <PasswordSection
                        userEmail={user.email}
                        userPhone={user.phone}
                        userUsername={user.username}
                        titleLabel={c("passwordSectionTitle")}
                        subtitleLabel={c("passwordSectionSubtitle")}
                        otpLabel={c("otpWillBeSent", { email: user.email || user.phone })}
                        buttonLabel={c("resetPasswordButton")}
                    />

                    <LinkedAccountsSection
                        titleLabel={t("childSectionTitle")}
                        subtitleLabel={t("childSectionSubtitle")}
                        emptyLabel={t("noChildrenLinked")}
                        addButtonLabel={t("linkChildButton")}
                        unlinkLabel={c("unlinkButton")}
                        pendingLabel={c("pendingBadge")}
                        comingSoonMessage={c("featureComingSoonToast")}
                        role="parent"
                    />
                </div>
            </div>
        </div>
    );
}
