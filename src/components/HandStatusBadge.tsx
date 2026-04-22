import { Hand, X, Camera } from "lucide-react";
import { useHandRaise } from "@/hooks/useHandRaise";

interface HandStatusBadgeProps {
  enabled: boolean;
  onToggle: () => void;
  active: boolean;
  confidence: number;
  position: { x: number; y: number } | null;
  error?: string | null;
}

/**
 * Floating bottom-right indicator that shows whether the hand-tracking camera is
 * on, current confidence, and a virtual cursor position when a hand is detected.
 */
const HandStatusBadge = ({
  enabled,
  onToggle,
  active,
  confidence,
  position,
  error,
}: HandStatusBadgeProps) => {
  return (
    <>
      {/* Virtual hand cursor */}
      {enabled && active && position && (
        <div
          className="pointer-events-none fixed z-40 transition-all duration-100"
          style={{
            left: `${position.x * 100}%`,
            top: `${position.y * 60 + 20}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative w-14 h-14">
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ring-pulse" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-mint flex items-center justify-center shadow-glow">
              <Hand className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
        </div>
      )}

      {/* Floating control */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onToggle}
          className={[
            "flex items-center gap-3 pl-4 pr-5 py-3 rounded-full font-semibold text-sm transition-all shadow-ink",
            enabled
              ? "bg-gradient-ink text-ink-foreground"
              : "glass-dark text-ink-foreground hover:scale-105",
          ].join(" ")}
        >
          {enabled ? (
            <>
              <span className="relative w-3 h-3">
                <span
                  className={[
                    "absolute inset-0 rounded-full",
                    active ? "bg-primary-glow" : "bg-muted-foreground",
                  ].join(" ")}
                />
                {active && (
                  <span className="absolute inset-0 rounded-full bg-primary-glow animate-ring-pulse" />
                )}
              </span>
              <span className="font-mono uppercase tracking-wider text-xs">
                {error ? "No camera" : active ? `Hand · ${Math.round(confidence * 100)}%` : "Watching"}
              </span>
              <X className="w-4 h-4 opacity-60" />
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span className="font-mono uppercase tracking-wider text-xs">Enable hand tracking</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default HandStatusBadge;
export { useHandRaise };
