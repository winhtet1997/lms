"use client";

import { useEffect, useRef, useId } from "react";
import JXG from "jsxgraph";
import * as math from "mathjs";
import "./jsxgraph.css";

// "y = 2x + 1"  ->  (x) => 2x + 1
function compileLatexExpression(latex) {
  const rhs = latex.includes("=") ? latex.split("=").slice(1).join("=") : latex;
  const cleaned = rhs
    .replace(/\\frac{([^{}]+)}{([^{}]+)}/g, "(($1)/($2))")
    .replace(/\\/g, "")
    .replace(/\^/g, "^");
  try {
    const compiled = math.compile(cleaned);
    return (x) => compiled.evaluate({ x });
  } catch {
    return null;
  }
}

function drawBarChart(board, expr) {
  const data = expr.data || [];
  const barWidth = expr.bar?.width ?? 0.6;
  const fillColor = expr.bar?.fillColor ?? "#5BC1C1";
  const strokeColor = expr.bar?.strokeColor ?? "#2f8f8f";
  const fillOpacity = expr.bar?.fillOpacity ?? 0.8;
  const baseline = expr.baseline ?? 0;

  data.forEach((point, i) => {
    const x = i + 1;
    board.create(
      "polygon",
      [
        [x - barWidth / 2, baseline],
        [x + barWidth / 2, baseline],
        [x + barWidth / 2, point.value],
        [x - barWidth / 2, point.value],
      ],
      {
        fillColor,
        fillOpacity,
        borders: { strokeColor },
        vertices: { visible: false },
        withLines: true,
        fixed: true,
      }
    );
    board.create("text", [x, baseline - 0.5, point.label], {
      anchorX: "middle",
      fontSize: 12,
      fixed: true,
    });
  });
}

export default function JSXGraphBoard({ spec }) {
  const rawId = useId();
  const containerId = `jxg-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const boardRef = useRef(null);

  useEffect(() => {
    if (!spec) return undefined;

    const isArraySpec = Array.isArray(spec);
    const options = isArraySpec ? {} : spec.options || {};
    const expressions = isArraySpec ? [] : spec.expressions || [];
    const elements = isArraySpec ? spec : spec.elements || [];
    const boundingbox = options.boundingbox || [-6, 6, 6, -6];

    const board = JXG.JSXGraph.initBoard(containerId, {
      boundingbox,
      axis: options.axis ?? true,
      grid: options.grid ?? false,
      showNavigation: options.showNavigation ?? false,
      showCopyright: false,
      keepAspectRatio: false,
    });
    boardRef.current = board;

    expressions.forEach((expr) => {
      if (expr.type === "chart" && expr.chartType === "bar") {
        drawBarChart(board, expr);
        return;
      }
      if (expr.latex) {
        const fn = compileLatexExpression(expr.latex);
        if (fn) {
          board.create("functiongraph", [fn, boundingbox[0], boundingbox[2]], {
            strokeColor: expr.color || "#5BC1C1",
            strokeWidth: 2,
            name: expr.label || "",
          });
        }
      }
    });

    elements.forEach((el) => {
      // Supports both the full GraphSpec element shape ({type, parents, attrs})
      // and the compact generic-array shape ({t, p, a}).
      const type = el.type || el.t;
      const parents = el.parents || el.p;
      const attrs = el.attrs || el.a || {};
      if (type && parents) {
        try {
          board.create(type, parents, attrs);
        } catch (e) {
          console.error("JSXGraph: failed to create element", type, e);
        }
      }
    });

    return () => {
      JXG.JSXGraph.freeBoard(board);
    };
  }, [spec, containerId]);

  return (
    <div
      id={containerId}
      className="jxgbox w-full h-72 rounded-lg border border-gray-200 my-2 bg-white"
    />
  );
}