import { Hand, Mic, MicOff, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface VoiceSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoStart?: boolean;
  /** Notified on final transcript so caller can also navigate / act. */
  onFinalTranscript?: (text: string) => void;
}

const VoiceSearchBar = ({
  value,
  onChange,
  placeholder = "Say a department or medicine name…",
  autoStart = false,
  onFinalTranscript,
}: VoiceSearchBarProps) => {
  const lastFinalRef = useRef<string>("");

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

  const toggle = () => (listening ? stop() : start());

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
          placeholder={listening ? "Listening… speak now" : placeholder}
          className="flex-1 bg-transparent outline-none text-lg md:text-xl text-ink placeholder:text-muted-foreground font-medium"
        />
        <Hand className="w-5 h-5 text-primary/40 hidden sm:block" />
        <button
          onClick={toggle}
          disabled={!supported}
          aria-label={listening ? "Stop listening" : "Start voice input"}
          aria-pressed={listening}
          className={[
            "relative w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0",
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
