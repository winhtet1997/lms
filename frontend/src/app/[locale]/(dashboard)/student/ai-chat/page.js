"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Bot,
  Send,
  BookOpen,
  Sigma,
  Copy,
  RefreshCw,
  Trash2,
  X,
  Plus,
  MessageSquare,
  MoreVertical,
  Menu,
} from "lucide-react";
import toast from "react-hot-toast";
import { aiChatService } from "@/service/aiChatService";
import AIChatMessage from "@/components/ai-chat/AIChatMessage";
import AIChatLocked from "@/components/ai-chat/AIChatLocked";
import LatexInsertPopover from "@/components/ai-chat/LatexInsertPopover";
import AIChatBreadcrumb from "@/components/ai-chat/AIChatBreadcrumb";

// Adjust these two to rebrand the empty-state greeting.
const ASSISTANT_NAME = "LuLu AI";
const ASSISTANT_TAGLINE = "Your Mathematics AI Teacher";

function Avatar() {
  return (
    <div className="w-7 h-7 rounded-full border-2 border-teal-300 bg-teal-50 flex items-center justify-center text-teal-500 shrink-0">
      <Bot size={14} />
    </div>
  );
}

function SubjectPicker({ onPick, onClose }) {
  const [subjects, setSubjects] = useState(null); // null = loading
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    aiChatService
      .getSubjects()
      .then((res) => {
        if (!cancelled) setSubjects(res?.data || []);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load subjects.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="absolute bottom-full mb-2 left-0 w-72 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-20">
      <div className="flex items-center justify-between px-2 py-1">
        <p className="text-xs font-semibold text-gray-500">Branches of math</p>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>
      {subjects === null && !error && (
        <p className="text-xs text-gray-400 px-2 py-3">Loading…</p>
      )}
      {error && <p className="text-xs text-red-500 px-2 py-3">{error}</p>}
      {subjects?.length === 0 && (
        <p className="text-xs text-gray-400 px-2 py-3">No subjects available.</p>
      )}
      {subjects?.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(s)}
          className="w-full text-left px-2 py-2 rounded-lg hover:bg-gray-50 text-sm"
        >
          <span className="font-medium text-gray-800">{s.title}</span>
          {s.course_title && (
            <span className="block text-xs text-gray-400">{s.course_title}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function formatThreadLabel(thread) {
  const d = new Date(thread.updated_at || thread.created_at);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ThreadSidebar({ threads, activeThreadId, onSelect, onNewChat, onRequestDelete, disabled }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <div className="w-64 h-full bg-white border-r border-gray-100 flex flex-col">
      <div className="p-3 border-b border-gray-100">
        <button
          type="button"
          onClick={onNewChat}
          disabled={disabled}
          className="btn btn-sm w-full justify-start gap-2 bg-gray-900 hover:bg-gray-800 text-white border-none normal-case disabled:opacity-50"
        >
          <Plus size={14} /> New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {threads.length === 0 && (
          <p className="text-xs text-gray-400 px-2 py-3">No conversations yet.</p>
        )}
        {threads.map((t) => (
          <div key={t.id} className="relative group">
            <button
              type="button"
              onClick={() => onSelect(t)}
              className={`w-full text-left px-3 py-2 pr-8 rounded-lg text-sm flex items-start gap-2 ${
                t.id === activeThreadId
                  ? "bg-teal-50 text-teal-800"
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-60" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{t.title}</span>
                <span className="block text-[11px] text-gray-400">
                  {formatThreadLabel(t)}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId((cur) => (cur === t.id ? null : t.id));
              }}
              className="absolute right-1 top-1.5 p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100"
              aria-label="Chat options"
            >
              <MoreVertical size={14} />
            </button>

            {openMenuId === t.id && (
              <>
                {/* Click-outside catcher */}
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setOpenMenuId(null)}
                />
                <div className="absolute right-1 top-7 z-30 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenuId(null);
                      onRequestDelete(t);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ thread, onCancel, onConfirm, deleting }) {
  if (!thread) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5">
        <h3 className="font-bold text-gray-800 mb-1">Delete this chat?</h3>
        <p className="text-sm text-gray-500 mb-4">
          "{thread.title}" will be removed from your chat history. This can't
          be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="btn btn-sm btn-ghost normal-case"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="btn btn-sm bg-red-600 hover:bg-red-700 text-white border-none normal-case"
          >
            {deleting ? <span className="loading loading-spinner loading-xs" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIChatPage() {
  const searchParams = useSearchParams();
  const chapterId = searchParams.get("chapter_id");
  const courseIdParam = searchParams.get("course_id");
  const locale = useLocale();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [locked, setLocked] = useState(null); // { detail, courseId, isAuthenticated } | null
  const [canSend, setCanSend] = useState(true);
  const [resolvedCourseId, setResolvedCourseId] = useState(null);

  const [thread, setThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingSlow, setSendingSlow] = useState(false);
  const [showLatexPopover, setShowLatexPopover] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [subjectId, setSubjectId] = useState(null); // null = let backend pick a default
  const [subjectLabel, setSubjectLabel] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pendingNewChatRef = useRef(false);

  // StudentSubNavbar's "Ask AI" button is the only entry point into this
  // page, and it always encodes course_id/chapter_id explicitly whenever
  // there's course context. No course_id in the URL means Global scope —
  // there's no other signal to fall back to (a stale last-viewed-course
  // store hint would silently turn a Global chat into a Course-scoped one).
  const courseHint = courseIdParam;

  const refreshThreadList = async (scopeThread) => {
    try {
      const list = await aiChatService.getThreads(
        scopeThread?.chapter_id || chapterId,
        scopeThread?.course_id,
        subjectId
      );
      setThreads(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load chat history list:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setCheckingAccess(true);
      setLocked(null);
      setThread(null);
      setMessages([]);
      setThreads([]);

      let access;
      try {
        access = await aiChatService.checkAccess(chapterId, courseHint);
      } catch (err) {
        if (cancelled) return;
        const status = err?.response?.status;
        const data = err?.response?.data;
        if (![400, 401, 403].includes(status)) {
          console.error("Ask AI access check failed unexpectedly:", err);
        }
        setLocked({
          isAuthenticated: status !== 401,
          notConfigured: status === 400,
          detail: data?.detail,
          courseId: data?.course_id ?? null,
        });
        setCheckingAccess(false);
        return;
      }
      if (cancelled) return;
      setCheckingAccess(false);
      setCanSend(access?.can_send !== false);
      setResolvedCourseId(access?.course_id ?? null);

      setLoadingThread(true);
      try {
        const list = await aiChatService.getThreads(
          chapterId,
          chapterId ? undefined : access?.course_id,
          chapterId ? undefined : subjectId
        );
        if (cancelled) return;
        const existing = Array.isArray(list) ? list : [];
        setThreads(existing);

        const mostRecent = existing[0] || null;
        setThread(mostRecent);

        if (mostRecent) {
          const history = await aiChatService.getHistory(mostRecent.id);
          if (cancelled) return;
          setMessages(Array.isArray(history) ? history : []);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load AI chat history:", err);
        toast.error(
          err?.response?.data?.detail || "Couldn't load your conversations. Please try again."
        );
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [chapterId, courseHint, subjectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!sending) {
      setSendingSlow(false);
      return;
    }
    const t = setTimeout(() => setSendingSlow(true), 8000);
    return () => clearTimeout(t);
  }, [sending]);

  const handleNewChat = () => {
    if (loadingThread || sending || !canSend) return;
    pendingNewChatRef.current = true;
    setThread(null);
    setMessages([]);
  };

  const handleSelectThread = async (t) => {
    if (!t || t.id === thread?.id || loadingThread || sending) return;
    pendingNewChatRef.current = false;
    setLoadingThread(true);
    setThread(t);
    setMessages([]);
    try {
      const history = await aiChatService.getHistory(t.id);
      setMessages(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error("Failed to load that conversation:", err);
      toast.error("Couldn't load that conversation. Please try again.");
    } finally {
      setLoadingThread(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setDeletingThread(true);
    try {
      await aiChatService.deleteThread(deleteCandidate.id);
      setThreads((prev) => prev.filter((t) => t.id !== deleteCandidate.id));
      if (thread?.id === deleteCandidate.id) {
        const remaining = threads.filter((t) => t.id !== deleteCandidate.id);
        const next = remaining[0] || null;
        setThread(next);
        if (next) {
          const history = await aiChatService.getHistory(next.id);
          setMessages(Array.isArray(history) ? history : []);
        } else {
          setMessages([]);
        }
      }
      toast.success("Chat deleted");
    } catch (err) {
      console.error("Failed to delete chat:", err);
      toast.error("Couldn't delete that chat. Please try again.");
    } finally {
      setDeletingThread(false);
      setDeleteCandidate(null);
    }
  };

  const handleSend = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending || !canSend) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    try {
      let activeThread = thread;
      if (!activeThread) {
        activeThread = await aiChatService.startThread(
          chapterId,
          courseHint,
          subjectId,
          pendingNewChatRef.current
        );
        pendingNewChatRef.current = false;
        setThread(activeThread);
      }

      const { reply } = await aiChatService.sendMessage(activeThread.id, text, locale);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      refreshThreadList(activeThread);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error(
        err?.response?.data?.detail || "Math AI didn't respond. Please try again."
      );
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleRegenerate = async (assistantIndex) => {
    const userMsg = messages[assistantIndex - 1];
    if (!userMsg || userMsg.role !== "user" || !thread || sending) return;

    setSending(true);
    try {
      const { reply } = await aiChatService.sendMessage(thread.id, userMsg.content, locale);
      setMessages((prev) => {
        const next = [...prev];
        next[assistantIndex] = { role: "assistant", content: reply };
        return next;
      });
    } catch (err) {
      console.error("Failed to regenerate:", err);
      toast.error(
        err?.response?.data?.detail || "Couldn't regenerate that response."
      );
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const insertLatex = (snippet) => {
    setInput((prev) => (prev ? `${prev} ${snippet} ` : `${snippet} `));
    inputRef.current?.focus();
  };

  const handlePickSubject = (subject) => {
    setSubjectId(subject.id);
    setSubjectLabel(subject.title);
    setShowSubjectPicker(false);
  };

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center mt-24 h-[calc(100vh-224px)] text-sm text-gray-400">
        Checking access…
      </div>
    );
  }

  if (locked) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <AIChatLocked
          detail={locked.detail}
          courseId={locked.courseId}
          isAuthenticated={locked.isAuthenticated}
          notConfigured={locked.notConfigured}
        />
      </div>
    );
  }

  const isEmpty = messages.length === 0;
  const isLessonScoped = thread?.scope === "lesson";
  const greetingSubtitle = isLessonScoped
    ? thread?.title
    : subjectLabel || ASSISTANT_TAGLINE;

  return (
    <>
    <div className="container mx-auto px-2 sm:px-4 max-w-5xl mt-24 h-[calc(100vh-224px)] flex flex-col">
      <AIChatBreadcrumb />
      <div className="flex-1 min-h-0 flex bg-white rounded-2xl border border-gray-200 shadow-sm shadow-gray-200/60 overflow-hidden relative">
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`${sidebarOpen ? "flex" : "hidden"} lg:flex fixed lg:static inset-y-0 left-0 z-50 lg:z-auto h-screen lg:h-auto`}
      >
        <ThreadSidebar
          threads={threads}
          activeThreadId={thread?.id}
          onSelect={(t) => {
            handleSelectThread(t);
            setSidebarOpen(false);
          }}
          onNewChat={() => {
            handleNewChat();
            setSidebarOpen(false);
          }}
          onRequestDelete={setDeleteCandidate}
          disabled={loadingThread || sending || !canSend}
        />
      </div>

      <div className="flex-1 flex flex-col px-4 sm:px-6 py-4 sm:py-6 min-w-0 min-h-0">
        <div className="lg:hidden flex items-center gap-2 pb-3 mb-1 border-b border-gray-100 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="btn btn-sm btn-square btn-outline border-gray-200"
            aria-label="Open chat history"
          >
            <Menu size={16} />
          </button>
          <span className="text-sm font-medium text-gray-500">Chats</span>
        </div>
        {!canSend && !loadingThread && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>
              Your enrollment has ended — you can still read past
              conversations, but you'll need an active subscription to send
              new messages.
            </span>
            <Link
              href={
                resolvedCourseId
                  ? `/courses/${resolvedCourseId}/subscribe`
                  : `/pricing`
              }
              className="btn btn-xs bg-amber-800 hover:bg-amber-900 text-white border-none normal-case shrink-0"
            >
              Subscribe
            </Link>
          </div>
        )}
        {loadingThread ? (
          <div className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-400">
            <span className="loading loading-spinner loading-sm" />
            Loading messages…
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-indigo-100 text-indigo-600 flex items-center justify-center">
                <Bot size={28} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{ASSISTANT_NAME}</h1>
              {isLessonScoped ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1">
                  <BookOpen size={12} /> Scoped to: {thread?.title}
                </span>
              ) : (
                <p className="text-sm text-gray-500">{greetingSubtitle}</p>
              )}
            </div>

            <div className="relative w-full max-w-xl">
              {showLatexPopover && (
                <LatexInsertPopover
                  onInsert={insertLatex}
                  onClose={() => setShowLatexPopover(false)}
                />
              )}
              <div className="border border-gray-200 rounded-2xl p-3 bg-white shadow-sm">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={!canSend ? "Subscribe to keep chatting…" : isLessonScoped ? "Ask about this chapter…" : "Explain…"}
                  rows={2}
                  disabled={loadingThread || sending || !canSend}
                  className="w-full resize-none outline-none text-sm px-1 py-1 bg-transparent"
                />
                <div className="flex items-center justify-between mt-1">
                  <button
                    type="button"
                    onClick={() => setShowLatexPopover((v) => !v)}
                    className="btn btn-xs btn-outline border-gray-200 gap-1 rounded-full normal-case"
                  >
                    <Sigma size={12} /> LaTeX
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loadingThread || sending || !canSend}
                    className="btn btn-circle btn-sm bg-gray-900 hover:bg-gray-800 border-none text-white disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            {!isLessonScoped && (
              <div className="relative">
                {showSubjectPicker && (
                  <SubjectPicker
                    onPick={handlePickSubject}
                    onClose={() => setShowSubjectPicker(false)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setShowSubjectPicker((v) => !v)}
                  disabled={loadingThread || sending || !canSend}
                  className="btn btn-sm btn-outline border-gray-200 gap-2 rounded-full normal-case"
                >
                  <BookOpen size={14} /> Branches Of Math
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {isLessonScoped && (
              <div className="pb-3 mb-1 border-b border-gray-100">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-3 py-1">
                  <BookOpen size={12} /> Scoped to: {thread?.title}
                </span>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto py-4 space-y-5">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`group flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
                >
                  {m.role === "assistant" && <Avatar />}

                  <div
                    className={
                      m.role === "user"
                        ? "bg-teal-100 text-gray-800 rounded-2xl px-4 py-2 max-w-[85%] mt-1"
                        : "max-w-[90%] mt-2"
                    }
                  >
                    <AIChatMessage content={m.content} onChoose={handleSend} />
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.content)}
                      className="hover:text-gray-500"
                      aria-label="Copy"
                    >
                      <Copy size={12} />
                    </button>
                    {m.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() => handleRegenerate(i)}
                        disabled={sending}
                        className="hover:text-gray-500 disabled:opacity-40"
                        aria-label="Regenerate"
                      >
                        <RefreshCw size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="loading loading-dots loading-xs" />
                  {sendingSlow ? "Still thinking, this can take a minute…" : "Responding…"}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="relative border-t border-gray-100 pt-3">
              {showLatexPopover && (
                <LatexInsertPopover
                  onInsert={insertLatex}
                  onClose={() => setShowLatexPopover(false)}
                />
              )}
              <div className="flex items-end gap-2 border border-gray-200 rounded-2xl p-2 bg-white">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={!canSend ? "Subscribe to keep chatting…" : isLessonScoped ? "Ask about this chapter…" : "Explain…"}
                  disabled={loadingThread || sending || !canSend}
                  className="flex-1 resize-none outline-none text-sm px-2 py-1.5 bg-transparent max-h-32"
                />
                <button
                  type="button"
                  onClick={() => setShowLatexPopover((v) => !v)}
                  className="btn btn-xs btn-outline border-gray-200 gap-1 rounded-full normal-case shrink-0"
                >
                  <Sigma size={12} /> LaTeX
                </button>
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loadingThread || sending || !canSend}
                  className="btn btn-circle btn-sm bg-gray-900 hover:bg-gray-800 border-none text-white shrink-0 disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
    <DeleteConfirmDialog
      thread={deleteCandidate}
      deleting={deletingThread}
      onCancel={() => setDeleteCandidate(null)}
      onConfirm={handleConfirmDelete}
    />
    </>
  );
}