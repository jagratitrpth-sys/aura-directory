import { useCallback, useEffect, useRef, useState } from "react";

interface UseDwellSelectOptions {
  /** Cursor position in viewport pixels, or null when no hand is visible. */
  cursor: { x: number; y: number } | null;
  /** Required dwell duration in ms before firing onSelect. */
  dwellMs?: number;
  /**
   * Max distance (in px) from the element's center for the cursor to count
   * as "centered" on it. Defaults to 40% of the smaller side.
   */
  centerToleranceRatio?: number;
  onSelect: (id: string) => void;
}

interface UseDwellSelectReturn {
  /** Attach to each option: register(id)(node). */
  register: (id: string) => (node: HTMLElement | null) => void;
  /** Currently dwelling id (null when cursor isn't centered on anything). */
  activeId: string | null;
  /** 0..1 progress for the current dwell. */
  progress: number;
}

/**
 * Tracks a virtual "hand cursor" against a set of registered DOM elements.
 * Starts a 2s dwell timer ONLY while the cursor is within `centerToleranceRatio`
 * of an element's center, and cancels immediately when the cursor leaves OR
 * moves to a different element.
 */
export function useDwellSelect({
  cursor,
  dwellMs = 2000,
  centerToleranceRatio = 0.4,
  onSelect,
}: UseDwellSelectOptions): UseDwellSelectReturn {
  const nodesRef = useRef<Map<string, HTMLElement>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const firedRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const register = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      const map = nodesRef.current;
      if (node) map.set(id, node);
      else map.delete(id);
    },
    []
  );

  // Determine which (if any) registered element the cursor is centered over
  useEffect(() => {
    if (!cursor) {
      setActiveId(null);
      return;
    }
    let bestId: string | null = null;
    let bestDist = Infinity;
    nodesRef.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      // First require the cursor to be inside the rect at all
      if (cursor.x < r.left || cursor.x > r.right || cursor.y < r.top || cursor.y > r.bottom) return;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (cursor.x - cx) / (r.width / 2);
      const dy = (cursor.y - cy) / (r.height / 2);
      // Normalized distance from center: 0 = dead-center, 1 = on the edge
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= centerToleranceRatio && d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    });
    setActiveId(bestId);
  }, [cursor, centerToleranceRatio]);

  // Drive the dwell timer based on activeId
  useEffect(() => {
    const cancelTimer = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startRef.current = null;
    };

    if (!activeId) {
      cancelTimer();
      setProgress(0);
      firedRef.current = null;
      return;
    }

    // New target — restart timer
    if (firedRef.current !== activeId) {
      firedRef.current = null;
      startRef.current = performance.now();
    }

    const tick = () => {
      const start = startRef.current;
      if (start == null) return;
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / dwellMs);
      setProgress(p);
      if (p >= 1) {
        if (firedRef.current !== activeId) {
          firedRef.current = activeId;
          onSelectRef.current(activeId);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return cancelTimer;
  }, [activeId, dwellMs]);

  return { register, activeId, progress };
}
