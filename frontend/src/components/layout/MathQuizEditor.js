"use client";

import MDEditor, { commands } from "@uiw/react-md-editor";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const REMARK = [[remarkMath]];
const REHYPE = [[rehypeKatex]];

const mkCmd = (label, title, snippet) => ({
    name: `m-${label}`,
    keyCommand: `m-${label}`,
    buttonProps: { title },
    icon: <span style={{ fontSize: 11, fontFamily: "monospace", padding: "0 1px" }}>{label}</span>,
    execute(_state, api) {
        api.replaceSelection(snippet);
    },
});

const MATH_EXTRA = [
    commands.divider,
    commands.group(
        [
            mkCmd("$x$",   "Inline math  $...$",       "$ $"),
            mkCmd("$$x$$", "Block math  $$...$$",       "$$\n\n$$"),
            mkCmd("a/b",   "Fraction  \\frac{}{}",      "\\frac{}{}"),
            mkCmd("√x",    "Square root  \\sqrt{}",     "\\sqrt{}"),
            mkCmd("xⁿ",    "Superscript  ^{}",          "^{}"),
            mkCmd("xₙ",    "Subscript  _{}",            "_{}"),
            mkCmd("(x)",   "Parentheses  \\left(\\right)", "\\left(\\right)"),
        ],
        {
            name: "math",
            groupName: "math",
            buttonProps: { title: "Math structures" },
            icon: <span style={{ fontStyle: "italic", fontWeight: 700, fontSize: 13 }}>∑</span>,
        }
    ),
    commands.group(
        [
            mkCmd("π", "\\pi",     "\\pi"),
            mkCmd("α", "\\alpha",  "\\alpha"),
            mkCmd("β", "\\beta",   "\\beta"),
            mkCmd("θ", "\\theta",  "\\theta"),
            mkCmd("λ", "\\lambda", "\\lambda"),
            mkCmd("Δ", "\\Delta",  "\\Delta"),
            mkCmd("μ", "\\mu",     "\\mu"),
            mkCmd("σ", "\\sigma",  "\\sigma"),
            mkCmd("∞", "\\infty",  "\\infty"),
        ],
        {
            name: "greek",
            groupName: "greek",
            buttonProps: { title: "Greek letters" },
            icon: <span style={{ fontStyle: "italic", fontSize: 13 }}>α</span>,
        }
    ),
    commands.group(
        [
            mkCmd("±", "\\pm",     "\\pm"),
            mkCmd("×", "\\times",  "\\times"),
            mkCmd("÷", "\\div",    "\\div"),
            mkCmd("≤", "\\leq",    "\\leq"),
            mkCmd("≥", "\\geq",    "\\geq"),
            mkCmd("≠", "\\neq",    "\\neq"),
            mkCmd("≈", "\\approx", "\\approx"),
        ],
        {
            name: "ops",
            groupName: "ops",
            buttonProps: { title: "Operators" },
            icon: <span style={{ fontSize: 13 }}>±</span>,
        }
    ),
    commands.group(
        [
            mkCmd("∑",   "Summation  \\sum_{i=1}^{n}",  "\\sum_{i=1}^{n}"),
            mkCmd("∫",   "Integral   \\int_{}^{}",       "\\int_{}^{}"),
            mkCmd("lim", "Limit      \\lim_{x \\to }",   "\\lim_{x \\to }"),
            mkCmd("log", "Logarithm  \\log_{}",          "\\log_{}"),
            mkCmd("→",   "\\to",                         "\\to"),
            mkCmd("⇒",   "\\Rightarrow",                 "\\Rightarrow"),
        ],
        {
            name: "calc",
            groupName: "calc",
            buttonProps: { title: "Calculus / logic" },
            icon: <span style={{ fontStyle: "italic", fontSize: 13 }}>∫</span>,
        }
    ),
];

const COMMANDS = [...commands.getCommands(), ...MATH_EXTRA];

export default function MathQuizEditor({ value, onChange, height = 280 }) {
    return (
        <div data-color-mode="light">
            <MDEditor
                value={value}
                onChange={(v) => onChange(v ?? "")}
                preview="live"
                height={height}
                commands={COMMANDS}
                previewOptions={{ remarkPlugins: REMARK, rehypePlugins: REHYPE }}
            />
        </div>
    );
}
