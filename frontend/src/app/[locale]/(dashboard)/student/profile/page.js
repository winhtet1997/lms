"use client";

import { useState } from "react";
import { GraduationCap, Mail, Phone, Calendar, School, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/useAuthStore";
import { resolveMediaUrl } from "@/lib/media";
import ProfileCard from "@/components/profile/ProfileCard";
import AccountInfoCard from "@/components/profile/AccountInfoCard";
import BasicInfoCard from "@/components/profile/BasicInfoCard";
import PasswordSection from "@/components/profile/PasswordSection";
import LinkedAccountsSection from "@/components/profile/LinkedAccountsSection";

const GRADE_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];
const GENDER_OPTIONS = ["male", "female", "other"];

export default function StudentProfilePage() {
    const c = useTranslations("ProfileCommon");
    const t = useTranslations("StudentProfilePage");
    const { user } = useAuthStore();
    const [editing, setEditing] = useState(false);

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 pt-16 pb-6 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <ProfileCard
                        name={user.full_name || user.username}
                        avatarUrl={resolveMediaUrl(user.avatar)}
                        editing={editing}
                        badgeLabel={t("studentAccountBadge")}
                        BadgeIcon={GraduationCap}
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
                            {
                                Icon: GraduationCap,
                                value: user.grade_level ? `${c("gradeLabel")} ${user.grade_level}` : null,
                            },
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
                            {
                                key: "dob",
                                kind: "date",
                                label: t("labelDateOfBirth"),
                                Icon: Calendar,
                                colSpan: 1,
                            },
                            {
                                key: "grade_level",
                                kind: "select",
                                label: t("labelGrade"),
                                Icon: GraduationCap,
                                options: GRADE_OPTIONS.map((g) => ({
                                    value: g,
                                    label: `${c("gradeLabel")} ${g}`,
                                })),
                                colSpan: 1,
                            },
                            {
                                key: "gender",
                                kind: "select",
                                label: t("labelGender"),
                                Icon: Users,
                                options: GENDER_OPTIONS.map((g) => ({
                                    value: g,
                                    label: t(`gender${g.charAt(0).toUpperCase()}${g.slice(1)}`),
                                })),
                                colSpan: 1,
                            },
                            // {
                            //     key: "school",
                            //     kind: "disabled",
                            //     label: t("labelSchool"),
                            //     Icon: School,
                            //     placeholder: t("placeholderSchool"),
                            //     hint: c("comingSoonHint"),
                            //     colSpan: 2,
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
                        titleLabel={t("parentSectionTitle")}
                        subtitleLabel={t("parentSectionSubtitle")}
                        emptyLabel={t("noParentsLinked")}
                        addButtonLabel={t("linkParentButton")}
                        unlinkLabel={c("unlinkButton")}
                        pendingLabel={c("pendingBadge")}
                        comingSoonMessage={c("featureComingSoonToast")}
                    />
                </div>
            </div>
        </div>
    );
}
