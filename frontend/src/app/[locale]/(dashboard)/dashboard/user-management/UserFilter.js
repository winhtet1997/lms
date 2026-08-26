"use client";

import { ChevronRight, Search } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import Pagination from "@/components/layout/Pagination";
import { usePermission } from "@/hooks/usePermission";

const PAGE_SIZE = 10;

const UserFilter = () => {
  const t = useTranslations("UserManagement");

  const ROLES = [
    { label: t("allRoles"), value: "" },
    { label: t("roleStudent"), value: "Student" },
    { label: t("roleParent"), value: "Parent" },
    { label: t("roleTutor"), value: "Tutor" },
    { label: t("roleAdmin"), value: "Admin" },
    { label: t("roleSuperadmin"), value: "Superadmin" },
  ];

  const users = useAuthStore((state) => state.users);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const fetchUsers = useAuthStore((state) => state.fetchUsers);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { can } = usePermission();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    let result = [...(users ?? [])];

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(lower) ||
          u.email?.toLowerCase().includes(lower) ||
          u.username?.toLowerCase().includes(lower),
      );
    }

    if (roleFilter !== "") {
      result = result.filter((u) => u.role === roleFilter);
    }

    return result;
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRole = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="w-full bg-base-100 rounded-xl shadow-sm border border-base-200">
        {/* Filters */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-base-200">
          <h2 className="text-xl font-bold px-2">{t("allUsersHeading")}</h2>
          <div className="grid md:grid-cols-2 items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2   w-4 h-4 z-10" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="input input-sm input-bordered pl-10 w-64 focus:input-primary"
                value={search}
                onChange={handleSearch}
              />
            </div>
            <select
              className="select select-sm select-bordered font-medium"
              value={roleFilter}
              onChange={handleRole}
            >
              {ROLES.map((r) => (
                <option key={String(r.value)} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200/50 text-base-content/70">
              <tr>
                <th className="font-bold py-4">{t("colName")}</th>
                <th className="font-bold">{t("colEmail")}</th>
                <th className="font-bold">{t("colRole")}</th>
                <th className="font-bold">{t("colSubscription")}</th>
                <th className="font-bold">{t("colStatus")}</th>
                <th className="text-right px-6">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <span className="loading loading-spinner loading-md" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-10 text-base-content/40"
                  >
                    {t("noUsersFound")}
                  </td>
                </tr>
              ) : (
                paginated.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-base-200/30 transition-colors group"
                  >
                    <td className="font-semibold text-base-content/80">
                      {user.full_name || user.username}
                    </td>
                    <td className="text-base-content/60">{user.email}</td>
                    <td>
                      <span className="badge badge-ghost border-base-300 font-medium py-3 px-4">
                        {user.role}
                      </span>
                    </td>
                    <td className="text-base-content/60">Platinum</td>
                    <td>
                      <span
                        className={`badge badge-sm font-bold py-3 px-4 rounded-full capitalize ${user.is_active ? "badge-info" : "badge-error"}`}
                      >
                        {user.is_active
                          ? t("statusActive")
                          : t("statusSuspended")}
                      </span>
                    </td>
                    {can("lms_auth", "edit_user") && (
                      <td className="text-right px-6">
                        <Link href={`/dashboard/user-management/${user.id}`}>
                          <button className="btn btn-ghost btn-xs btn-square group-hover:bg-base-300">
                            <ChevronRight
                              size={18}
                              className="text-base-content/40"
                            />
                          </button>
                        </Link>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default UserFilter;
