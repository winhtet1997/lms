"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const REMARK_PLUGINS = [[remarkMath]];
const REHYPE_PLUGINS = [[rehypeKatex]];

const CATEGORIES = [
  {
    name: "Format",
    items: [
      { label: "$...$", insert: "$$" },
      { label: "$$...$$", insert: "$$\n\n$$" },
      { label: "\\(...\\)", insert: "\\(\\)" },
      { label: "\\[...\\]", insert: "\\[\\]" },
    ],
  },
  {
    name: "Core",
    items: [
      { label: "Fraction", insert: "\\frac{a}{b}" },
      { label: "Square Root", insert: "\\sqrt{x}" },
      { label: "Nth Root", insert: "\\sqrt[n]{x}" },
      { label: "Power", insert: "x^{2}" },
      { label: "Subscript", insert: "x_{n}" },
      { label: "Absolute", insert: "|x|" },
    ],
  },
  {
    name: "Calculus",
    items: [
      { label: "Sum", insert: "\\sum_{i=1}^{n}" },
      { label: "Product", insert: "\\prod_{i=1}^{n}" },
      { label: "Limit", insert: "\\lim_{x \\to 0}" },
      { label: "Integral", insert: "\\int_{a}^{b}" },
      { label: "Double Integral", insert: "\\iint" },
      { label: "Derivative", insert: "\\frac{d}{dx}" },
    ],
  },
  {
    name: "Relations",
    items: [
      { label: "≤", insert: "\\leq" },
      { label: "≥", insert: "\\geq" },
      { label: "≠", insert: "\\neq" },
      { label: "≈", insert: "\\approx" },
      { label: "±", insert: "\\pm" },
      { label: "·", insert: "\\cdot" },
    ],
  },
  {
    name: "Set & Logic",
    items: [
      { label: "∈", insert: "\\in" },
      { label: "∉", insert: "\\notin" },
      { label: "⊂", insert: "\\subset" },
      { label: "∪", insert: "\\cup" },
      { label: "∩", insert: "\\cap" },
      { label: "∀", insert: "\\forall" },
    ],
  },
  {
    name: "Greek",
    items: [
      { label: "α", insert: "\\alpha" },
      { label: "β", insert: "\\beta" },
      { label: "γ", insert: "\\gamma" },
      { label: "θ", insert: "\\theta" },
      { label: "λ", insert: "\\lambda" },
      { label: "π", insert: "\\pi" },
      { label: "σ", insert: "\\sigma" },
      { label: "ω", insert: "\\omega" },
    ],
  },
  {
    name: "Structures",
    items: [
      { label: "Matrix", insert: "\\begin{matrix} a & b \\\\ c & d \\end{matrix}" },
      { label: "Bracket Matrix", insert: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}" },
      { label: "Cases", insert: "\\begin{cases} a & \\text{if } x > 0 \\\\ b & \\text{otherwise} \\end{cases}" },
      { label: "Binomial", insert: "\\binom{n}{k}" },
    ],
  },
];

export default function LatexInsertPopover({ initialValue = "", onInsert, onClose }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="absolute bottom-full mb-2 left-0 w-96 max-h-[28rem] flex flex-col bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          autoFocus
          placeholder="Type or build LaTeX below…"
          className="w-full text-sm border border-gray-200 rounded-lg p-2 font-mono outline-none focus:border-gray-400"
        />
        <p className="text-[10px] uppercase tracking-wide text-gray-400 mt-2 mb-1">
          Equation preview
        </p>
        <div className="text-base px-1 min-h-[28px] flex items-center overflow-x-auto">
          <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
            {`$${value || " "}$`}
          </ReactMarkdown>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
              {cat.name}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {cat.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setValue((prev) => `${prev}${item.insert}`)}
                  className="btn btn-xs btn-outline border-gray-200 rounded-md normal-case font-normal truncate px-1"
                  title={item.label}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 p-3 border-t border-gray-100">
        <button type="button" onClick={onClose} className="btn btn-xs btn-ghost normal-case">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            if (value.trim()) onInsert(`$${value}$`);
            onClose();
          }}
          className="btn btn-xs bg-gray-900 hover:bg-gray-800 text-white border-none normal-case"
        >
          Insert
        </button>
      </div>
    </div>
  );
}