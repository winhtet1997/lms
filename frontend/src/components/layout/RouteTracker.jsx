"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useNavigationHistoryStore } from "@/store/useNavigationHistoryStore";

// Remembers the previously visited pathname so pages can build breadcrumbs
// that reflect where the user actually navigated from.
export default function RouteTracker() {
  const pathname = usePathname();
  const previousRef = useRef(null);
  const setPreviousPath = useNavigationHistoryStore((s) => s.setPreviousPath);

  useEffect(() => {
    if (previousRef.current && previousRef.current !== pathname) {
      setPreviousPath(previousRef.current);
    }
    previousRef.current = pathname;
  }, [pathname, setPreviousPath]);

  return null;
}
