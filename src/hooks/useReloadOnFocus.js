import { useEffect, useRef } from "react";

/**
 * Calls `reload` when the tab becomes visible again or the window is focused.
 * Skips the first focus after mount (initial fetch already ran).
 */
export default function useReloadOnFocus(reload, { minIntervalMs = 1500 } = {}) {
  const reloadRef = useRef(reload);
  const lastRef = useRef(0);
  const readyRef = useRef(false);

  useEffect(() => { reloadRef.current = reload; }, [reload]);

  useEffect(() => {
    const run = () => {
      if (!readyRef.current) return;
      const now = Date.now();
      if (now - lastRef.current < minIntervalMs) return;
      lastRef.current = now;
      reloadRef.current?.();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };

    const readyT = setTimeout(() => { readyRef.current = true; }, 800);
    window.addEventListener("focus", run);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(readyT);
      window.removeEventListener("focus", run);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [minIntervalMs]);
}
