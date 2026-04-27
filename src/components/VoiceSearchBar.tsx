import { Hand, Mic, MicOff, Search, CornerDownLeft } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

export type MatchStrength = "best" | "strong" | "close" | "fuzzy";

export interface SearchSuggestion {
  /** Stable key for React */
  id: string;
  /** Primary line shown in the suggestion (e.g. medicine name) */
  label: string;
  /** Optional secondary line (e.g. generic, location) */
  hint?: string;
  /** Optional match strength badge ("Best", "Strong", "Close", "Fuzzy") */
  strength?: MatchStrength;
}

const STRENGTH_META: Record<MatchStrength, { label: string; classes: string }> = {
  best:   { label: "Best",   classes: "bg-gradient-mint text-primary-foreground" },
  strong: { label: "Strong", classes: "bg-primary/15 text-primary border border-primary/30" },
  close:  { label: "Close",  classes: "bg-accent/20 text-accent-foreground border border-accent/40" },
  fuzzy:  { label: "Fuzzy",  classes: "bg-muted text-muted-foreground border border-border" },
};

interface VoiceSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoStart?: boolean;
  /** Notified on final transcript so caller can also navigate / act. */
  onFinalTranscript?: (text: string) => void;
  /** Optional autocomplete suggestions, already sorted by relevance. */
  suggestions?: SearchSuggestion[];
  /** Called when the user picks a suggestion (click / Enter). */
  onSuggestionSelect?: (s: SearchSuggestion) => void;
}

const VoiceSearchBar = ({
  value,
  onChange,
  placeholder = "Say a department or medicine name…",
  autoStart = false,
  onFinalTranscript,
  suggestions,
  onSuggestionSelect,
}: VoiceSearchBarProps) => {
  const lastFinalRef = useRef<string>("");
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const blurTimer = useRef<number | null>(null);
  const reactId = useId();
  const listboxId = `voice-search-suggestions-${reactId}`;
  const optionId = (i: number) => `${listboxId}-opt-${i}`;

  const { supported, listening, transcript, lastHeard, retryCountdown, start, stop, error } =
    useVoiceInput({
      onFinalResult: (text) => {
        lastFinalRef.current = text;
        onChange(text);
        onFinalTranscript?.(text);
      },
    });

  // Stream interim transcripts into the input as the user speaks
  useEffect(() => {
    if (listening && transcript) onChange(transcript);
  }, [listening, transcript, onChange]);

  useEffect(() => {
    if (autoStart && supported) start();
  }, [autoStart, supported, start]);

  // Reset highlighted suggestion when list changes
  useEffect(() => { setActiveIdx(0); }, [suggestions?.length, value]);

  const toggle = () => (listening ? stop() : start());

  const showSuggestions =
    !!suggestions && suggestions.length > 0 && (focused || listening) && value.trim().length > 0;

  const pickSuggestion = (s: SearchSuggestion) => {
    onChange(s.label);
    onSuggestionSelect?.(s);
    setFocused(false);
  };

  // Polite screen-reader announcement: result count + currently highlighted option.
  const liveMessage = useMemo(() => {
    if (!showSuggestions || !suggestions || suggestions.length === 0) return "";
    const count = suggestions.length;
    const active = suggestions[activeIdx];
    const countMsg = `${count} suggestion${count === 1 ? "" : "s"} available.`;
    if (!active) return countMsg;
    const strengthMsg = active.strength ? `, ${active.strength} match` : "";
    return `${countMsg} ${active.label}${strengthMsg}, option ${activeIdx + 1} of ${count}.`;
  }, [showSuggestions, suggestions, activeIdx]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || !suggestions) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const s = suggestions[activeIdx];
      if (s) { e.preventDefault(); pickSuggestion(s); }
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  const statusLabel = !supported
    ? "Voice unavailable in this browser — try Chrome or Edge"
    : error === "not-allowed"
    ? "Mic blocked — click 🔒 in address bar → allow microphone, then retry"
    : error === "no-microphone"
    ? "No microphone detected on this device"
    : error === "no-speech"
    ? "Didn't catch that — tap mic to try again"
    : error
    ? `Voice error: ${error} — tap mic to retry`
    : retryCountdown > 0
    ? `Didn't hear you — retrying in ${retryCountdown}s…`
    : listening
    ? transcript
      ? `● Heard: "${transcript}"`
      : "● Listening — speak now"
    : "Tap mic and speak";

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="absolute -inset-4 bg-gradient-aurora opacity-25 blur-3xl rounded-full pointer-events-none" />
      <div className="relative flex items-center gap-4 glass rounded-2xl px-5 py-4 shadow-card">
        <Search className="w-6 h-6 text-ink shrink-0" strokeWidth={2.4} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => {
            if (blurTimer.current) window.clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => {
            // Delay so click on a suggestion still registers
            blurTimer.current = window.setTimeout(() => setFocused(false), 150);
          }}
          placeholder={listening ? "Listening… speak now" : placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-activedescendant={
            showSuggestions && suggestions && suggestions[activeIdx]
              ? optionId(activeIdx)
              : undefined
          }
          className="flex-1 bg-transparent outline-none text-lg md:text-xl text-ink placeholder:text-muted-foreground font-medium rounded-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        />
        <Hand className="w-5 h-5 text-primary/40 hidden sm:block" />
        <button
          onClick={toggle}
          disabled={!supported}
          aria-label={listening ? "Stop listening" : "Start voice input"}
          aria-pressed={listening}
          className={[
            "relative w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            listening
              ? "bg-gradient-mint text-primary-foreground shadow-glow"
              : retryCountdown > 0
              ? "bg-accent text-accent-foreground"
              : "bg-ink text-ink-foreground hover:scale-105",
            !supported && "opacity-50 cursor-not-allowed",
          ].join(" ")}
        >
          {listening && (
            <>
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ring-pulse" />
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ring-pulse [animation-delay:0.6s]" />
            </>
          )}
          {retryCountdown > 0 ? (
            <span className="relative font-mono text-sm font-bold tabular-nums">
              {retryCountdown}
            </span>
          ) : listening ? (
            <Mic className="w-5 h-5 relative" />
          ) : (
            <MicOff className="w-5 h-5 relative" />
          )}
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-30 left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-glow overflow-hidden animate-fade-in max-h-80 overflow-y-auto"
        >
          {suggestions.map((s, i) => {
            const active = i === activeIdx;
            return (
              <li key={s.id} role="option" id={optionId(i)} aria-selected={active}>
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(s)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={[
                    "w-full text-left px-5 py-3 flex items-center gap-3 transition-colors border-b border-border last:border-b-0",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                    active
                      ? "bg-gradient-mint/15 ring-2 ring-inset ring-primary/60"
                      : "hover:bg-secondary/60",
                  ].join(" ")}
                >
                  <Search className={`w-4 h-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base text-ink truncate">{s.label}</p>
                    {s.hint && (
                      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground truncate">
                        {s.hint}
                      </p>
                    )}
                  </div>
                  {s.strength && (
                    <span
                      className={[
                        "shrink-0 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest",
                        STRENGTH_META[s.strength].classes,
                      ].join(" ")}
                      aria-label={`Match strength: ${STRENGTH_META[s.strength].label}`}
                    >
                      {STRENGTH_META[s.strength].label}
                    </span>
                  )}
                  {active && <CornerDownLeft className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Visually-hidden polite live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      <div className="flex items-center justify-between mt-3 px-2 gap-3">
        <span
          className={[
            "text-xs font-mono uppercase tracking-widest truncate",
            error
              ? "text-destructive"
              : retryCountdown > 0
              ? "text-accent-foreground"
              : "text-muted-foreground",
          ].join(" ")}
          aria-live="polite"
        >
          {statusLabel}
        </span>
        <span className="text-xs font-mono text-muted-foreground shrink-0">EN-US</span>
      </div>

      {lastHeard && (
        <div className="mt-2 px-2 flex items-center gap-2 animate-fade-in">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground shrink-0">
            Last attempt
          </span>
          <span className="text-xs font-medium text-ink truncate italic">
            "{lastHeard}"
          </span>
        </div>
      )}
    </div>
  );
};

export default VoiceSearchBar;
