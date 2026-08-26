"use client";

import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const JSXGraphBoard = dynamic(() => import("./JSXGraphBoard"), { ssr: false });

const REMARK_PLUGINS = [[remarkMath]];
const REHYPE_PLUGINS = [[rehypeKatex]];

function ChoiceButtons({ choices, onChoose }) {
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const isShort = choices.every((c) => String(c).trim().length <= 2);
  return (
    <div className="flex flex-wrap gap-2 my-2">
      {choices.map((choice, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChoose?.(choice)}
          className={
            isShort
              ? "w-9 h-9 flex items-center justify-center rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              : "px-4 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          }
        >
          {choice}
        </button>
      ))}
    </div>
  );
}

function CodeRenderer(onChoose) {
  return function CodeBlock({ inline, className, children, ...props }) {
    const lang = /language-(\w+)/.exec(className || "")?.[1];
    const raw = String(children).replace(/\n$/, "");

    if (!inline && (lang === "jsxgraph" || lang === "json")) {
      try {
        const spec = JSON.parse(raw);
        const looksLikeGraph =
          lang === "jsxgraph" ||
          Array.isArray(spec) ||
          spec.options ||
          spec.expressions ||
          spec.elements;
        if (looksLikeGraph) {
          return <JSXGraphBoard spec={spec} />;
        }
      } catch {
        // not valid JSON — fall through to default code rendering below
      }
    }

    if (!inline && lang === "choices") {
      try {
        const choices = JSON.parse(raw);
        if (Array.isArray(choices)) {
          return <ChoiceButtons choices={choices} onChoose={onChoose} />;
        }
      } catch {
        // fall through
      }
    }

    if (inline) {
      return (
        <code className="px-1 py-0.5 bg-gray-100 rounded text-[0.9em]" {...props}>
          {children}
        </code>
      );
    }

    return (
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto text-sm my-2">
        <code {...props}>{children}</code>
      </pre>
    );
  };
}

export default function AIChatMessage({ content, onChoose }) {
  if (!content) return null;

  return (
    <div className="prose prose-sm max-w-none prose-headings:my-2">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={{
          code: CodeRenderer(onChoose),
          p: ({ children }) => <div className="my-2">{children}</div>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}