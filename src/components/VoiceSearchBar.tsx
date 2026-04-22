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

  const { supported, listening, transcript, start, stop } = useVoiceInput({
    onFinalResult: (text) => {
      lastFinalRef.current = text;
      onChange(text);
      onFinalTranscript?.(text);
    },
  });

  // Stream interim transcripts into the input
  useEffect(() => {
    if (listening && transcript) onChange(transcript);
  }, [listening, transcript, onChange]);

  useEffect(() => {
    if (autoStart && supported) start();
  }, [autoStart, supported, start]);

  const toggle = () => (listening ? stop() : start());

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className="absolute -inset-4 bg-gradient-aurora opacity-25 blur-3xl rounded-full pointer-events-none" />
      <div className="relative flex items-center gap-4 glass rounded-2xl px-5 py-4 shadow-card">
        <Search className="w-6 h-6 text-ink shrink-0" strokeWidth={2.4} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-lg md:text-xl text-ink placeholder:text-muted-foreground font-medium"
        />
        <Hand className="w-5 h-5 text-primary/40 hidden sm:block" />
        <button
          onClick={toggle}
          disabled={!supported}
          aria-label={listening ? "Stop listening" : "Start voice input"}
          className={[
            "relative w-12 h-12 rounded-full flex items-center justify-center transition-all shrink-0",
            listening
              ? "bg-gradient-mint text-primary-foreground shadow-glow"
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
          {listening ? <Mic className="w-5 h-5 relative" /> : <MicOff className="w-5 h-5 relative" />}
        </button>
      </div>
      <div className="flex items-center justify-between mt-3 px-2">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {!supported
            ? "Voice unavailable in this browser"
            : listening
            ? "● Listening — speak now"
            : "Tap mic or say a query"}
        </span>
        <span className="text-xs font-mono text-muted-foreground">EN-US</span>
      </div>
    </div>
  );
};

export default VoiceSearchBar;
