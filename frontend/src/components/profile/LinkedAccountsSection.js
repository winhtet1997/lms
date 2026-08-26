"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, CheckCircle2, Unlink, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { resolveMediaUrl } from "@/lib/media";
import { useParentStore } from "@/store/useParentStore";
import { parentService } from "@/service/parentService";
import { useConfirm } from "@/components/ui/AlertModal";

const GRADE_LEVELS = ["6", "7", "8", "9", "10", "11", "12"];
const SEARCH_DEBOUNCE_MS = 400;

const fieldRowClass =
    "flex items-center border border-gray-300 rounded-lg px-3 gap-2 focus-within:border-blue-400 transition-colors";
const fieldInputClass = "input input-ghost flex-1 focus:outline-none px-0 h-11";

function LinkChildTab({ t, onSubmit, submitting, error }) {
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
                <div className={fieldRowClass}>
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        type="text"
                        className={fieldInputClass}
                        placeholder={t("searchUsernamePlaceholder")}
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        onFocus={() => setOpen(true)}
                        autoComplete="off"
                        required
                    />
                </div>
                {open && query.trim().length >= 2 && (
                    <ul className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg divide-y divide-gray-50 max-h-60 overflow-y-auto">
                        {searching ? (
                            <li className="px-4 py-3 text-sm text-gray-400">{t("searchingLabel")}</li>
                        ) : results.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-gray-400">{t("noResultsFound")}</li>
                        ) : (
                            results.map((student) => (
                                <li key={student.id}>
                                    <button
                                        type="button"
                                        className="flex flex-col items-start w-full px-4 py-2.5 text-left hover:bg-blue-50 transition-colors"
                                        onClick={() => handleSelect(student)}
                                    >
                                        <span className="font-medium text-sm text-gray-800">
                                            {student.full_name || student.username}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {student.username}
                                            {student.email ? ` |  ${student.email}` : ""}
                                            {student.grade_level
                                                ? ` |  ${t("gradeOption", { grade: student.grade_level })}`
                                                : ""}
                                        </span>
                                    </button>
                                </li>
                            ))
                        )}
                    </ul>
                )}
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <button className="btn btn-info shadow-none w-full" disabled={submitting || !selected}>
                {t("linkChildSubmitButton")}
            </button>
        </form>
    );
}

function CreateChildTab({ t, onSubmit, submitting, error }) {
    const [form, setForm] = useState({
        username: "",
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
        grade_level: "",
    });

    const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit(form);
            }}
        >
            <div className={fieldRowClass}>
                <input
                    type="text"
                    className={fieldInputClass}
                    placeholder={t("usernameLabel")}
                    value={form.username}
                    onChange={(e) => handleChange("username", e.target.value)}
                    required
                />
            </div>
            <div className={fieldRowClass}>
                <input
                    type="text"
                    className={fieldInputClass}
                    placeholder={t("fullNameLabel")}
                    value={form.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                />
            </div>
            <div className={fieldRowClass}>
                <input
                    type="email"
                    className={fieldInputClass}
                    placeholder={t("emailLabel")}
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                />
            </div>
            <div className={fieldRowClass}>
                <select
                    className="select select-ghost flex-1 focus:outline-none px-0 h-11"
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
            <div className={fieldRowClass}>
                <input
                    type="password"
                    className={fieldInputClass}
                    placeholder={t("passwordLabel")}
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    required
                />
            </div>
            <div className={fieldRowClass}>
                <input
                    type="password"
                    className={fieldInputClass}
                    placeholder={t("confirmPasswordLabel")}
                    value={form.confirm_password}
                    onChange={(e) => handleChange("confirm_password", e.target.value)}
                    required
                />
            </div>
            {error && <p className="text-error text-sm">{error}</p>}
            <button className="btn btn-info shadow-none w-full" disabled={submitting}>
                {t("createChildSubmitButton")}
            </button>
        </form>
    );
}

export default function LinkedAccountsSection({
    titleLabel,
    subtitleLabel,
    emptyLabel,
    addButtonLabel,
    unlinkLabel,
    pendingLabel,
    comingSoonMessage,
    role = "student",
}) {
    const t = useTranslations("ParentsHome");
    const isParent = role === "parent";
    const { children, loading, fetchChildren, createChild, linkChild, unlinkChild } =
        useParentStore();
    const { confirm, ConfirmModal } = useConfirm();

    const [showAdd, setShowAdd] = useState(false);
    const [mode, setMode] = useState("link");
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [unlinkingId, setUnlinkingId] = useState(null);

    useEffect(() => {
        if (isParent) fetchChildren();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isParent]);

    const notReady = () => toast(comingSoonMessage);

    const accounts = isParent
        ? children.map((child) => ({
              id: child.id,
              full_name: child.full_name || child.username,
              email: child.email,
              avatar: child.avatar,
              status: child.is_active ? undefined : "pending",
          }))
        : [];

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
                    t("addChildFailed")
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
            setFormError((data && Object.values(data)?.[0]?.[0]) || t("addChildFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddClick = () => {
        if (!isParent) {
            notReady();
            return;
        }
        setShowAdd((v) => !v);
        setFormError(null);
    };

    const handleUnlink = async (id) => {
        const ok = await confirm({
            title: t("unlinkChildTitle"),
            message: t("unlinkChildMessage"),
            confirmText: t("unlinkChildConfirmButton"),
        });
        if (!ok) return;
        setUnlinkingId(id);
        try {
            await unlinkChild(id);
            toast.success(t("toastChildUnlinked"));
        } catch (err) {
            toast.error(err?.response?.data?.error || t("toastUnlinkFailed"));
        } finally {
            setUnlinkingId(null);
        }
    };

    return (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Link2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-base font-semibold">{titleLabel}</h2>
                    <p className="text-sm text-gray-500">{subtitleLabel}</p>
                </div>
            </div>

            {isParent && showAdd && (
                <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                    <div className="inline-flex bg-gray-100 rounded-xl p-1 w-fit">
                        <button
                            type="button"
                            onClick={() => setMode("link")}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                mode === "link" ? "bg-white text-info shadow-sm" : "text-gray-500"
                            }`}
                        >
                            {t("linkExistingTab")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("create")}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                mode === "create" ? "bg-white text-info shadow-sm" : "text-gray-500"
                            }`}
                        >
                            {t("createNewTab")}
                        </button>
                    </div>
                    {mode === "link" ? (
                        <LinkChildTab t={t} onSubmit={handleLink} submitting={submitting} error={formError} />
                    ) : (
                        <CreateChildTab t={t} onSubmit={handleCreate} submitting={submitting} error={formError} />
                    )}
                </div>
            )}

            {isParent && loading ? (
                <div className="flex justify-center py-6">
                    <span className="loading loading-spinner text-info"></span>
                </div>
            ) : accounts.length === 0 ? (
                <p className="text-sm text-gray-400">{emptyLabel}</p>
            ) : (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                                    {account.avatar && (
                                        <img
                                            src={resolveMediaUrl(account.avatar)}
                                            alt={account.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {account.full_name}
                                        </p>
                                        {account.status === "pending" ? (
                                            <span className="badge badge-warning badge-xs">
                                                {pendingLabel}
                                            </span>
                                        ) : (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{account.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => (isParent ? handleUnlink(account.id) : notReady())}
                                    disabled={unlinkingId === account.id}
                                    className="flex items-center gap-1 text-sm text-error hover:underline disabled:opacity-50"
                                >
                                    {unlinkingId === account.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Unlink className="w-3.5 h-3.5" />
                                    )}
                                    {unlinkLabel}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={handleAddClick}
                className="btn btn-outline btn-info border-dashed w-full shadow-none"
            >
                + {addButtonLabel}
            </button>

            {isParent && <ConfirmModal />}
        </div>
    );
}
