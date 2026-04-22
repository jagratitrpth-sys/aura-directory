import { useEffect, useState } from "react";
import { Hand } from "lucide-react";

interface DwellOverlayProps {
  cursor: { x: number; y: number } | null;
  nodes: React.MutableRefObject<Map<string, HTMLElement>>;
  activeId: string | null;
  progress: number;
  centerToleranceRatio: number;
}

interface ZoneRect {
  id: string;
  cx: number;
  cy: number;
  rx: number; // tolerance radius x
  ry: number; // tolerance radius y
}

/**
 * Renders, for every registered dwell option:
 *  - a dashed "center zone" oval matching the actual tolerance the hook uses
 *  - lights it up when the cursor is inside (= activeId)
 * Also renders a precise viewport hand cursor at the cursor coordinates.
 *
 * Recomputes the rects on every animation frame so it follows scroll/resize.
 */
const DwellOverlay = ({
  cursor,
  nodes,
  activeId,
  progress,
  centerToleranceRatio,
}: DwellOverlayProps) => {
  const [zones, setZones] = useState<ZoneRect[]>([]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const next: ZoneRect[] = [];
      nodes.current.forEach((el, id) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        next.push({
          id,
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          rx: (r.width / 2) * centerToleranceRatio,
          ry: (r.height / 2) * centerToleranceRatio,
        });
      });
      setZones(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes, centerToleranceRatio]);

  if (zones.length === 0 && !cursor) return null;

  // Detect high-contrast mode for amplified stroke weights
  const hc = typeof document !== "undefined" && document.documentElement.classList.contains("hc");
  const inactiveStroke = hc ? 2.5 : 1.25;
  const activeStroke = hc ? 4 : 2;
  const arcStroke = hc ? 5 : 3;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30"
      role="presentation"
      aria-hidden="true"
    >
      <svg className="absolute inset-0 w-full h-full" aria-hidden="true" focusable="false">
        {zones.map((z) => {
          const active = activeId === z.id;
          return (
            <g key={z.id}>
              <ellipse
                cx={z.cx}
                cy={z.cy}
                rx={z.rx}
                ry={z.ry}
                fill={active ? "hsl(var(--primary) / 0.10)" : "transparent"}
                stroke={active ? "hsl(var(--primary))" : "hsl(var(--ink) / 0.25)"}
                strokeWidth={active ? activeStroke : inactiveStroke}
                strokeDasharray={active ? "0" : hc ? "6 4" : "4 6"}
                style={{ transition: "stroke 120ms ease, stroke-width 120ms ease, fill 120ms ease" }}
              />
              {/* Center crosshair dot */}
              <circle
                cx={z.cx}
                cy={z.cy}
                r={active ? (hc ? 4 : 3) : hc ? 3 : 2}
                fill={active ? "hsl(var(--primary))" : "hsl(var(--ink) / 0.35)"}
              />
              {active && (
                /* Progress arc around the zone */
                <ProgressArc cx={z.cx} cy={z.cy} rx={z.rx + 8} ry={z.ry + 8} progress={progress} strokeWidth={arcStroke} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Hand cursor */}
      {cursor && (
        <div
          className="absolute"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden="true"
        >
          <div className="relative w-12 h-12">
            {!activeId && (
              <span className="absolute inset-0 rounded-full bg-primary/25 animate-ring-pulse" />
            )}
            <div
              className={[
                "relative w-12 h-12 rounded-full flex items-center justify-center shadow-glow transition-colors",
                activeId ? "bg-gradient-mint" : "bg-ink",
                hc ? "ring-2 ring-foreground" : "",
              ].join(" ")}
            >
              <Hand
                className={activeId ? "w-5 h-5 text-primary-foreground" : "w-5 h-5 text-ink-foreground"}
                strokeWidth={2.4}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Stroked elliptical arc that fills clockwise based on `progress` (0..1). */
const ProgressArc = ({
  cx, cy, rx, ry, progress, strokeWidth = 3,
}: { cx: number; cy: number; rx: number; ry: number; progress: number; strokeWidth?: number }) => {
  // Approximate ellipse perimeter (Ramanujan)
  const h = Math.pow(rx - ry, 2) / Math.pow(rx + ry, 2);
  const perimeter = Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  const dash = perimeter * progress;
  const gap = perimeter - dash;
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={`${dash} ${gap}`}
      transform={`rotate(-90 ${cx} ${cy})`}
      style={{ transition: "stroke-dasharray 80ms linear" }}
    />
  );
};

export default DwellOverlay;
