"use client";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export const REMARK_PLUGINS = [[remarkMath]];
export const REHYPE_PLUGINS = [[rehypeKatex]];

export function MathText({ source }) {
    if (!source) return null;
    return (
        <ReactMarkdown
            remarkPlugins={REMARK_PLUGINS}
            rehypePlugins={REHYPE_PLUGINS}
            components={{ p: ({ children }) => <span>{children}</span> }}
        >
            {source}
        </ReactMarkdown>
    );
}
