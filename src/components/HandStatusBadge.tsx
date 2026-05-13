import { Hand, X, Camera } from "lucide-react";
import { useHandRaise } from "@/hooks/useHandRaise";
import { getPermissionHelp } from "@/lib/permissionHelp";

interface HandStatusBadgeProps {
  enabled: boolean;
  onToggle: () => void;
  active: boolean;
  confidence: number;
  position: { x: number; y: number } | null;
  error?: string | null;
  /** Hide the built-in floating hand cursor (when another overlay draws it). */
  hideCursor?: boolean;
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
  hideCursor = false,
}: HandStatusBadgeProps) => {
  return (
    <>
      {/* Virtual hand cursor */}
      {!hideCursor && enabled && active && position && (
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {enabled && error && (() => {
          const help = getPermissionHelp("camera");
          const announcement = `Camera access is blocked, so hand-gesture tracking is paused. To enable the camera in ${help.browser}, click the lock or site-info icon in the address bar, allow camera access for this site, then tap "Enable hand tracking" again. Visit the ${help.browser} help page for step-by-step instructions: ${help.url}`;
          return (
            <div
              role="alert"
              aria-live="assertive"
              className="glass-dark text-ink-foreground text-xs font-mono uppercase tracking-wider px-3 py-2 rounded-xl shadow-ink max-w-xs flex flex-col items-end gap-1 animate-fade-in"
            >
              <span className="sr-only">{announcement}</span>
              <span aria-hidden="true">Camera blocked — hand tracking paused</span>
              <a
                href={help.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${help.browser} help: how to enable camera permissions`}
                className="text-primary-glow underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm normal-case tracking-normal"
              >
                How to enable camera in {help.browser}
              </a>
            </div>
          );
        })()}
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
