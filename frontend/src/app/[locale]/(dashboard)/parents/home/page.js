"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  Clock,
  GraduationCap,
  Plus,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import { useParentStore } from "@/store/useParentStore";
import { parentService } from "@/service/parentService";

const GRADE_LEVELS = ["6", "7", "8", "9", "10", "11", "12"];
const SEARCH_DEBOUNCE_MS = 400;

const CARD_GRADIENTS = [
  "bg-linear-to-br from-blue-500 to-cyan-400",
  "bg-linear-to-br from-purple-600 to-indigo-500",
  "bg-linear-to-br from-emerald-500 to-teal-400",
  "bg-linear-to-br from-orange-500 to-amber-400",
  "bg-linear-to-br from-pink-500 to-rose-400",
];

const LinkChildForm = ({ onSubmit, loading, error }) => {
  const t = useTranslations("ParentsHome");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleQueryChange = (value) => {
    setQuery(value);
    setSelected(null);
    setOpen(true);
    clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await parentService.searchChildren(trimmed);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSelect = (student) => {
    setSelected(student);
    setQuery(student.username);
    setResults([]);
    setOpen(false);
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!selected) return;
        onSubmit({ username: selected.username });
      }}
    >
      <div className="relative" ref={containerRef}>
        <span className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={16} color="gray" />
        </span>
        <input
          type="text"
          className="input input-bordered w-full pl-10 rounded-xl focus:outline-none"
          placeholder={t("searchUsernamePlaceholder")}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          required
        />
        {open && query.trim().length >= 2 && (
          <ul className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg divide-y divide-gray-50 max-h-60 overflow-y-auto">
            {searching ? (
              <li className="px-4 py-3 text-sm text-gray-400">
                {t("searchingLabel")}
              </li>
            ) : results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">
                {t("noResultsFound")}
              </li>
            ) : (
              results.map((student) => (
                <li key={student.id}>
                  <button
                    type="button"
                    className="flex flex-col items-start w-full px-4 py-2.5 text-left hover:bg-indigo-50/60 transition-colors"
                    onClick={() => handleSelect(student)}
                  >
                    <span className="font-medium text-sm text-gray-800">
                      {student.full_name || student.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      @{student.username}
                      {student.email ? ` · ${student.email}` : ""}
                      {student.grade_level ? ` · ${t("gradeOption", { grade: student.grade_level })}` : ""}

                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {error && <p className="text-error text-sm">{error}</p>}
      <button
        className="btn bg-info text-white border-none shadow-none rounded-xl w-full"
        disabled={loading || !selected}
      >
        {t("linkChildSubmitButton")}
      </button>
    </form>
  );
};

const CreateChildForm = ({ onSubmit, loading, error }) => {
  const t = useTranslations("ParentsHome");
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    grade_level: "",
  });

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form
      className="grid md:grid-cols-2 gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="child-username" className="text-sm font-medium text-gray-700">
          {t("usernameLabel")}
        </label>
        <input
          id="child-username"
          type="text"
          className="input input-bordered w-full rounded-xl focus:outline-none"
          placeholder={t("usernameLabel")}
          value={form.username}
          onChange={(e) => handleChange("username", e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="child-full-name" className="text-sm font-medium text-gray-700">
          {t("fullNameLabel")}
        </label>
        <input
          id="child-full-name"
          type="text"
          className="input input-bordered w-full rounded-xl focus:outline-none"
          placeholder={t("fullNameLabel")}
          value={form.full_name}
          onChange={(e) => handleChange("full_name", e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="child-email" className="text-sm font-medium text-gray-700">
          {t("emailLabel")}
        </label>
        <input
          id="child-email"
          type="email"
          className="input input-bordered w-full rounded-xl focus:outline-none"
          placeholder={t("emailLabel")}
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="child-grade-level" className="text-sm font-medium text-gray-700">
          {t("gradeLevelLabel")}
        </label>
        <select
          id="child-grade-level"
          className="select select-bordered w-full rounded-xl focus:outline-none"
          value={form.grade_level}
          onChange={(e) => handleChange("grade_level", e.target.value)}
        >
          <option value="">{t("selectGradeDefault")}</option>
          {GRADE_LEVELS.map((grade) => (
            <option key={grade} value={grade}>
              {t("gradeOption", { grade })}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="child-password" className="text-sm font-medium text-gray-700">
          {t("passwordLabel")}
        </label>
        <input
          id="child-password"
          type="password"
          className="input input-bordered w-full rounded-xl focus:outline-none"
          placeholder={t("passwordLabel")}
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="child-confirm-password" className="text-sm font-medium text-gray-700">
          {t("confirmPasswordLabel")}
        </label>
        <input
          id="child-confirm-password"
          type="password"
          className="input input-bordered w-full rounded-xl focus:outline-none"
          placeholder={t("confirmPasswordLabel")}
          value={form.confirm_password}
          onChange={(e) => handleChange("confirm_password", e.target.value)}
          required
        />
      </div>
      {error && <p className="text-error text-sm">{error}</p>}
      <button
        className="btn bg-info text-white border-none shadow-none rounded-xl w-full"
        disabled={loading}
      >
        {t("createChildSubmitButton")}
      </button>
    </form>
  );
};

const ChildCard = ({ child, index, t }) => (
  <div className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all duration-200">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]}`}
        >
          <GraduationCap size={18} />
        </div>
        <div className="min-w-0">
          <h6 className="font-bold text-gray-800 truncate">
            {child.full_name || child.username}
          </h6>
          <p className="text-gray-500 text-xs truncate">
            @{child.username} @{child.email ? `${child.email}` : ""}
            {child.grade_level
              ? ` · ${t("gradeOption", { grade: child.grade_level })}`
              : ""}
          </p>
        </div>
      </div>
      {child.is_active ? (
        <span className="badge badge-sm bg-emerald-50 text-emerald-700 rounded-full text-[10px] gap-1 shrink-0">
          <CircleCheck size={11} /> {t("activeBadge")}
        </span>
      ) : (
        <span className="badge badge-sm bg-amber-50 text-amber-700 rounded-full text-[10px] gap-1 shrink-0">
          <Clock size={11} /> {t("pendingBadge")}
        </span>
      )}
    </div>
    {!child.is_active && (
      <p className="text-xs text-amber-600 mb-3">
        {t("pendingApprovalNotice")}
      </p>
    )}
    <Link href="/courses">
      <button className="btn btn-sm bg-indigo-50 text-info  border-none shadow-none rounded-lg gap-1.5 w-full">
        {t("browseCoursesButton")}
        <ArrowRight size={14} />
      </button>
    </Link>
  </div>
);

const ParentsHome = () => {
  const t = useTranslations("ParentsHome");
  const { children, loading, fetchChildren, createChild, linkChild } =
    useParentStore();

  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState("link");
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleLink = async (payload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await linkChild(payload);
      setShowAdd(false);
    } catch (err) {
      setFormError(
        err?.response?.data?.username?.[0] ||
        err?.response?.data?.error ||
        t("addChildFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (payload) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await createChild(payload);
      setShowAdd(false);
    } catch (err) {
      const data = err?.response?.data;
      const message =
        (data && Object.values(data)?.[0]?.[0]) || t("addChildFailed");
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 md:pt-28 md:pb-16 max-w-5xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm p-6 md:p-10 mb-10">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-100 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-purple-100 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-info mb-2">
              <Users size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t("pageTitle")}
              </span>
            </div>
            <p className="text-lg md:text-2xl font-bold text-gray-800 mb-1">
              {t("pageTitle")}
            </p>
            <p className="text-gray-500 text-sm">{t("pageSubtitle")}</p>
          </div>
          <button
            className="btn bg-linear-to-r from-blue-600 to-purple-600 text-white border-none shadow-none rounded-xl gap-2 shrink-0 w-full md:w-auto"
            onClick={() => {
              setShowAdd((v) => !v);
              setFormError(null);
            }}
          >
            <Plus size={16} /> {t("addChildButton")}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="card border border-gray-200 shadow-sm rounded-2xl mb-10">
          <div className="card-body p-6 md:p-8">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 w-fit mb-5">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "link"
                    ? "bg-white text-info shadow-sm"
                    : "text-gray-500"
                  }`}
                onClick={() => setMode("link")}
                type="button"
              >
                {t("linkExistingTab")}
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === "create"
                    ? "bg-white text-info shadow-sm"
                    : "text-gray-500"
                  }`}
                onClick={() => setMode("create")}
                type="button"
              >
                {t("createNewTab")}
              </button>
            </div>

            {mode === "link" ? (
              <LinkChildForm
                onSubmit={handleLink}
                loading={submitting}
                error={formError}
              />
            ) : (
              <CreateChildForm
                onSubmit={handleCreate}
                loading={submitting}
                error={formError}
              />
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <span className="loading loading-spinner loading-lg text-info"></span>
        </div>
      ) : children.length === 0 ? (
        <div className="card bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <div className="bg-indigo-50 text-info w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={22} />
          </div>
          <p className="text-sm text-gray-500">{t("noChildrenMessage")}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {children.map((child, index) => (
            <ChildCard key={child.id} child={child} index={index} t={t} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentsHome;
