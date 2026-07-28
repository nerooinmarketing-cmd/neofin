"use client";

import { useEffect, useRef } from "react";

/** Formdaki değerleri 800ms sessizlikten sonra sunucuya taslak olarak kaydeder. */
export function useDraftAutosave(values: unknown, enabled: boolean) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serialized = JSON.stringify(values);

  useEffect(() => {
    if (!enabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      fetch("/api/onboarding/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: serialized,
      }).catch(() => {
        // Taslak kaydı en iyi çaba (best-effort); sessizce yok say.
      });
    }, 800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [serialized, enabled]);
}
