"use client";

import { ChevronLeft, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function buildHeightScript(token) {
  return `
<script>
    var __heightToken = ${JSON.stringify(token)};
    var __lastSent = -1;
    var __scheduled = false;
    function measure() {
        return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    }
    function sendHeight() {
        __scheduled = false;
        var h = measure();
        if (Math.abs(h - __lastSent) < 2) return;
        __lastSent = h;
        window.parent.postMessage({ type: 'setHeight', height: h, token: __heightToken }, '*');
    }
    function scheduleSend() {
        if (__scheduled) return;
        __scheduled = true;
        requestAnimationFrame(sendHeight);
    }
    window.addEventListener('load', scheduleSend);
    new ResizeObserver(scheduleSend).observe(document.body);
</script>`;
}

function InjectHeight(code, token) {
  if (!code) return code;
  const script = buildHeightScript(token);
  if (code.includes("</body>")) {
    return code.replace("</body>", script + "</body>");
  }
  if (code.includes("</html>")) {
    return code.replace("</html>", script + "</html>");
  }
  return code + script;
}

const ABSOLUTE_MAX_HEIGHT = 6000;
const MAX_CONSECUTIVE_GROWTHS = 6;

export default function ActivityViewer({ item, showHeader = true }) {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(800);
  const token = item?.id != null ? String(item.id) : "none";
  const lastHeightRef = useRef(800);
  const growthStreakRef = useRef(0);
  useEffect(() => {
    const handler = (e) => {
      if (
        e.data?.type !== "setHeight" ||
        !(e.data.height > 0) ||
        e.data.token !== token
      ) {
        return;
      }
      const h = Math.min(e.data.height, ABSOLUTE_MAX_HEIGHT);
      if (h <= lastHeightRef.current) {
        growthStreakRef.current = 0;
        lastHeightRef.current = h;
        setIframeHeight(h);
        return;
      }
      if (growthStreakRef.current >= MAX_CONSECUTIVE_GROWTHS) {
        return;
      }
      growthStreakRef.current += 1;
      lastHeightRef.current = h;
      setIframeHeight(h);
    };
    window.addEventListener("message", handler);
    return () => {
      window.removeEventListener("message", handler);
    };
  }, [token]);
  useEffect(() => {
    lastHeightRef.current = 800;
    growthStreakRef.current = 0;
    setIframeHeight(800);
  }, [item?.id]);
  const srcDoc = InjectHeight(item?.activity_code, token);

  const handleReset = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.srcdoc = "";
    setTimeout(() => {
      iframe.srcdoc = srcDoc;
    }, 50);
  };
  const t = useTranslations("ActivityViewer");

  return (
    <div className="max-w-7xl mx-auto my-2">
      {showHeader && (
        <Link
          href={`/dashboard/content`}
          className="btn btn-ghost btn-xs btn-circle border border-slate-300 flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
      )}
      <div className="card h-auto border border-gray-200 shadow-md mt-4 ">
        <div className="card-body">
          <div className="flex justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{item?.title}</h2>
              <p className="text-muted-foreground">{item?.description}</p>
            </div>
            <button
              className="btn btn-sm w-10 h-10"
              onClick={handleReset}
              title={t("resetActivityTitle")}
            >
              <RefreshCcw size={20} />
            </button>
          </div>

          <iframe
            ref={iframeRef}
            srcDoc={srcDoc}
            style={{ width: "100%", height: iframeHeight, overflow: "auto" }}
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
