import { Hand } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DwellCardProps {
  onSelect: () => void;
  /** When true, the user's hand is hovering over this card. Triggers a 2s dwell. */
  hovered?: boolean;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
  dwellMs?: number;
}

/**
 * A card that supports both a normal click AND a "dwell-to-select"
 * gesture: when `hovered` is true continuously for `dwellMs`, onSelect fires.
 * Shows an animated SVG progress ring during the dwell.
 */
const DwellCard = ({
  onSelect,
  hovered = false,
  active = false,
  className = "",
  children,
  dwellMs = 2000,
}: DwellCardProps) => {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    const cancel = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startRef.current = null;
    };

    if (!hovered) {
      cancel();
      setProgress(0);
      firedRef.current = false;
      return;
    }

    firedRef.current = false;
    startRef.current = performance.now();
    const tick = () => {
      const start = startRef.current;
      if (start == null) return;
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / dwellMs);
      setProgress(p);
      if (p >= 1) {
        if (!firedRef.current) {
          firedRef.current = true;
          onSelect();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return cancel;
  }, [hovered, dwellMs, onSelect]);

  const showRing = hovered || active;
  const C = 2 * Math.PI * 20; // r = 20
  const offset = C * (1 - (active && !hovered ? 0.4 : progress));

  return (
    <button
      onClick={onSelect}
      className={[
        "relative group rounded-3xl border transition-all duration-300 cursor-pointer",
        "p-8 flex flex-col items-start justify-between min-h-[220px] text-left overflow-hidden",
        active || hovered
          ? "bg-card border-2 border-primary shadow-glow scale-[1.05] z-10"
          : "glass border-border shadow-card hover:scale-[1.02] hover:border-primary/50",
        className,
      ].join(" ")}
    >
      <Hand className="absolute top-5 right-5 w-6 h-6 text-primary/40" strokeWidth={2} />

      {children}

      {showRing && (
        <div className="absolute bottom-6 right-6 w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 80ms linear" }}
            />
          </svg>
        </div>
      )}

      {hovered && (
        <span className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-gradient-mint text-primary-foreground text-xs font-bold uppercase tracking-widest shadow-card">
          Selecting · {Math.round(progress * 100)}%
        </span>
      )}
    </button>
  );
};

export default DwellCard;
