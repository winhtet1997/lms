"use client";

import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Clock,
  CreditCard,
  BookOpen,
  Lock,
  Trash2,
  Edit2,
  ChevronLeft,
  CircleCheckBig,
  Ban,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEnrollmentStore } from "@/store/useEnrollmentStore";
import { useRouter, useParams } from "next/navigation";
import { useConfirm } from "@/components/ui/AlertModal";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { usePermission } from "@/hooks/usePermission";

const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function UserDetails() {
  const { id } = useParams();
  const router = useRouter();
  const t = useTranslations("UserManagementDetails");
  const fetchUserById = useAuthStore((state) => state.fetchUserById);
  const deleteUser = useAuthStore((state) => state.deleteUser);
  const updateUserById = useAuthStore((state) => state.updateUserById);
  const enrollments = useEnrollmentStore((state) => state.enrollments);
  const enrollmentsLoading = useEnrollmentStore((state) => state.loading);
  const fetchEnrollments = useEnrollmentStore((state) => state.fetchEnrollments);

  const { can } = usePermission();
  const { confirm, ConfirmModal } = useConfirm();
  const canViewEnrollments = can("lms_billing", "view_enrollment");

  const [user, setUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const isProtected = user?.role === "Superadmin";

  const GRADE_OPTIONS = ["6", "7", "8", "9", "10", "11", "12"];

  const startEdit = () => {
    setEditForm({
      full_name: user.full_name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      grade_level: user.grade_level || "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateUserById(Number(id), editForm);
      setUser((prev) => ({ ...prev, ...updated }));
      setIsEditing(false);
      toast.success(t("updateSuccess"));
    } catch (err) {
      toast.error(err?.message || t("updateError"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchUserById(id)
      .then((data) => setUser(data))
      .catch((err) => setPageError(err?.message || t("notFound")))
      .finally(() => setPageLoading(false));
  }, [id, fetchUserById, t]);

  useEffect(() => {
    if (user?.role === "Student" && canViewEnrollments) {
      fetchEnrollments();
    }
  }, [user?.role, canViewEnrollments, fetchEnrollments]);

  const userEnrollments = user
    ? enrollments.filter((e) => e.user === user.username)
    : [];

  const handleToggleActive = async () => {
    const activating = !user.is_active;
    const ok = await confirm({
      title: activating ? t("activateConfirmTitle") : t("suspendConfirmTitle"),
      message: activating
        ? t("activateConfirmMessage")
        : t("suspendConfirmMessage"),
      confirmText: activating
        ? t("activateConfirmButton")
        : t("suspendConfirmButton"),
    });
    if (!ok) return;
    setToggling(true);
    try {
      const updated = await updateUserById(Number(id), {
        is_active: activating,
      });
      setUser((prev) => ({ ...prev, ...updated }));
      toast.success(activating ? t("activateSuccess") : t("suspendSuccess"));
    } catch {
      toast.error(activating ? t("activateError") : t("suspendError"));
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmMessage"),
      confirmText: t("deleteConfirmButton"),
    });

    if (!ok) return;

    setDeleting(true);
    try {
      await deleteUser(Number(id));
      toast.success(t("deleteSuccess"));
      router.push("/dashboard/user-management");
    } catch {
      toast.error(t("deleteError"));
      setDeleting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (pageError || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-error font-semibold">{pageError || t("notFound")}</p>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push("/dashboard/user-management")}
        >
          <ChevronLeft size={16} /> {t("backToUsers")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <ConfirmModal />

      {/* Profile Header */}
      <div className="flex flex-col gap-4">
        <button
          className="btn btn-ghost btn-sm flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors w-fit"
          onClick={() => router.push("/dashboard/user-management")}
        >
          <ChevronLeft size={16} /> {t("backToUsers")}
        </button>

        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="avatar placeholder">
            <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center">
              <span className="text-xl font-bold">
                {getInitials(user.full_name || user.username)}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">
                {user.full_name || user.username}
              </h1>
              <span className="badge badge-sm border-gray-300 font-semibold text-xs rounded-full">
                {user.role}
              </span>
              <span
                className={`badge badge-sm badge-info font-bold text-xs uppercase rounded-full ${user.is_active ? "badge-info" : "badge-error text-white"}`}
              >
                {user.is_active ? t("activeStatus") : t("suspendedStatus")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
              <Mail size={14} /> {user.email}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* 1. Basic Information */}
        <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="card-body p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <User size={20} className="text-slate-400" />{" "}
                {t("basicInfoTitle")}
              </h3>
              {can("lms_auth", "edit_user") &&
                (isEditing ? (
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm btn-ghost gap-2 border border-slate-200"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      {t("cancelButton")}
                    </button>
                    <button
                      className="btn btn-sm btn-info gap-2"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        t("saveButton")
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-sm btn-ghost gap-2 border border-slate-200"
                    onClick={startEdit}
                  >
                    <Edit2 size={14} /> {t("editButton")}
                  </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t("fullName")}
                </p>
                {isEditing ? (
                  <input
                    className="input input-sm input-bordered w-full"
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                  />
                ) : (
                  <p className="font-semibold text-slate-700">
                    {user.full_name || "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t("username")}
                </p>
                {isEditing ? (
                  <input
                    className="input input-sm input-bordered w-full"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, username: e.target.value }))
                    }
                  />
                ) : (
                  <p className="font-semibold text-slate-700">
                    {user.username || "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t("emailAddress")}
                </p>
                {isEditing ? (
                  <input
                    type="email"
                    className="input input-sm input-bordered w-full"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                ) : (
                  <p className="font-semibold text-slate-700">
                    {user.email || "-"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t("phoneNumber")}
                </p>
                {isEditing ? (
                  <input
                    className="input input-sm input-bordered w-full"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
                  />
                ) : (
                  <p className="font-semibold text-slate-700">
                    {user.phone || "-"}
                  </p>
                )}
              </div>

              {(user.role === "Student" || isEditing) && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t("gradeLevel")}
                  </p>
                  {isEditing && user.role === "Student" ? (
                    <select
                      className="select select-sm select-bordered w-full"
                      value={editForm.grade_level}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          grade_level: e.target.value,
                        }))
                      }
                    >
                      <option value="">-</option>
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          Grade {g}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-semibold text-slate-700">
                      {user.grade_level ? `Grade ${user.grade_level}` : "-"}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t("userId")}
                </p>
                <p className="font-semibold text-slate-700">#{user.id}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {t("role")}
                </p>
                <p className="font-semibold text-slate-700">
                  {user.role || "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar size={16} />
                <span className="font-medium">{t("joinDate")}:</span>
                {user.date_joined ?? "-"}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock size={16} />
                <span className="font-medium">{t("lastActive")}:</span>
                {user.last_active}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Subscription Plan */}
        {user.role === "Student" && canViewEnrollments && (
          <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="card-body p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-6">
                <CreditCard size={20} className="text-slate-400" />{" "}
                {t("subscriptionTitle")}
              </h3>
              {enrollmentsLoading ? (
                <div className="flex justify-center py-6">
                  <span className="loading loading-spinner loading-sm" />
                </div>
              ) : userEnrollments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">
                  {t("noEnrollments")}
                </p>
              ) : (
                <div className="space-y-3">
                  {userEnrollments.map((enrollment) => {
                    const isExpired =
                      enrollment.is_active === false &&
                      !!enrollment.expires_at &&
                      new Date(enrollment.expires_at) < new Date();
                    const statusBadge = enrollment.is_active
                      ? {
                          label: t("enrollmentActiveStatus"),
                          className: "bg-emerald-100 text-emerald-700",
                        }
                      : isExpired
                        ? {
                            label: t("enrollmentExpiredStatus"),
                            className: "bg-gray-200 text-gray-600",
                          }
                        : {
                            label: t("enrollmentPendingStatus"),
                            className: "bg-amber-100 text-amber-700",
                          };
                    const planLabel =
                      enrollment.plan && enrollment.plan !== "Free"
                        ? `${enrollment.plan.name} — ${enrollment.plan.price} ${enrollment.plan.currency}`
                        : t("freePlanLabel");

                    return (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between gap-4 border border-slate-100 bg-slate-50/50 rounded-xl p-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-700 text-sm truncate">
                              {enrollment.course_title}
                            </p>
                            <span
                              className={`badge badge-sm rounded-full text-[10px] whitespace-nowrap ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {planLabel}
                          </p>
                          {enrollment.is_active && enrollment.expires_at && (
                            <p className="text-xs text-slate-400 mt-0.5">
                              {t("expiresLabel", {
                                date: new Date(
                                  enrollment.expires_at,
                                ).toLocaleDateString(),
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {/* 3. Learning Progress */}
        <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div className="card-body p-6">
            <h3 className="font-bold text-lg flex items-center gap-2 mb-6">
              <BookOpen size={20} className="text-slate-400" />{" "}
              {t("learningProgressTitle")}
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-2xl font-black text-blue-700">-</p>
                <p className="text-xs font-bold text-blue-600/70 mt-1 uppercase">
                  {t("coursesEnrolled")}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-2xl font-black text-green-700">-</p>
                <p className="text-xs font-bold text-green-600/70 mt-1 uppercase">
                  {t("completed")}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-2xl font-black text-amber-700">-</p>
                <p className="text-xs font-bold text-amber-600/70 mt-1 uppercase">
                  {t("inProgress")}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center">
              {t("progressNotAvailable")}
            </p>
          </div>
        </div>

        {/* 4. Danger Zone */}
        <div className="space-y-4 pt-6">
          <div className="card bg-white border border-slate-200 shadow-sm rounded-2xl">
            <div className="card-body p-6 flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock size={20} className="text-slate-400" />
                <div>
                  <h5 className="font-bold text-slate-700">
                    {t("securityTitle")}
                  </h5>
                  <p className="text-sm text-slate-400">
                    {t("securitySubtitle")}
                  </p>
                </div>
              </div>
              <button className="btn btn-sm btn-outline gap-2">
                <Lock size={14} /> {t("sendPasswordReset")}
              </button>
            </div>
          </div>

          {can("lms_auth", "delete_user") && (
            <div
              className={`card border-2 bg-white overflow-hidden shadow-sm rounded-2xl transition-opacity ${isProtected ? "border-slate-100 opacity-50" : "border-slate-200"}`}
            >
              <div className="p-3 flex items-center gap-2">
                {user?.is_active ? (
                  <CircleCheckBig
                    size={20}
                    className={
                      isProtected ? "text-slate-300" : "text-slate-400"
                    }
                  />
                ) : (
                  <Ban
                    size={20}
                    className={isProtected ? "text-slate-300" : "text-red-400"}
                  />
                )}
                <div>
                  <h5 className="font-bold text-slate-700">
                    {t("accountStatusTitle")}
                  </h5>
                  <p className="text-sm text-slate-400">
                    {isProtected
                      ? t("adminProtected")
                      : t("accountStatusSubtitle")}
                  </p>
                </div>
              </div>
              <div className="p-4">
                <button
                  className={`btn w-full text-white font-bold gap-2 shadow-none border-none ${user?.is_active ? "btn-error" : "btn-info"}`}
                  onClick={handleToggleActive}
                  disabled={isProtected || toggling}
                >
                  {toggling ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : user?.is_active ? (
                    <>
                      <Lock size={18} /> {t("suspendButton")}
                    </>
                  ) : (
                    <>
                      <CircleCheckBig size={18} /> {t("activateButton")}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {can("lms_auth", "delete_user") && (
            <div
              className={`card border-2 overflow-hidden rounded-2xl transition-opacity ${isProtected ? "border-slate-100 bg-slate-50 opacity-50" : "border-red-100 bg-red-50/30"}`}
            >
              <div className="p-6">
                <h5
                  className={`font-bold flex items-center gap-2 mb-1 ${isProtected ? "text-slate-400" : "text-red-700"}`}
                >
                  <Trash2 size={18} /> {t("deleteTitle")}
                </h5>
                <p
                  className={`text-xs mb-4 ${isProtected ? "text-slate-400" : "text-red-500/70"}`}
                >
                  {isProtected ? t("adminProtected") : t("deleteSubtitle")}
                </p>
                <button
                  className="btn border-none w-full font-bold gap-2 text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  onClick={handleDelete}
                  disabled={deleting || isProtected}
                >
                  {deleting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    t("deletePermanently")
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
