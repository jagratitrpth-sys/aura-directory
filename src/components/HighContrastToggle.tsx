import { Contrast } from "lucide-react";
import { useHighContrast } from "@/hooks/useHighContrast";

/**
 * Floating accessibility toggle (top-right) for high-contrast mode.
 * Persists across sessions and honors prefers-contrast on first load.
 */
const HighContrastToggle = () => {
  const { enabled, toggle } = useHighContrast();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Disable high contrast mode" : "Enable high contrast mode"}
      title={enabled ? "Disable high contrast" : "Enable high contrast"}
      className={[
        "fixed top-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-full",
        "font-mono text-[10px] uppercase tracking-widest font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        enabled
          ? "bg-ink text-ink-foreground border-2 border-ink shadow-ink"
          : "glass border border-border text-ink hover:scale-105",
      ].join(" ")}
    >
      <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{enabled ? "HC on" : "High contrast"}</span>
    </button>
  );
};

export default HighContrastToggle;
