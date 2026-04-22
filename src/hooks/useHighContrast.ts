import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "kiosk:high-contrast";

/**
 * High-contrast accessibility mode.
 * - Persists preference in localStorage.
 * - Honors prefers-contrast: more on first load when no manual choice exists.
 * - Toggles a `hc` class on <html> so global styles can respond.
 */
export function useHighContrast() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return window.matchMedia?.("(prefers-contrast: more)").matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) root.classList.add("hc");
    else root.classList.remove("hc");
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);
  return { enabled, toggle, setEnabled };
}
