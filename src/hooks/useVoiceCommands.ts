import { useCallback, useEffect, useRef, useState } from "react";

// Minimal Web Speech API types
type SpeechRecognitionResult = { transcript: string };
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechRecognitionResult> & { isFinal: boolean }>;
};
interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseVoiceCommandsOptions {
  /** Map of phrase -> handler. Phrases matched as whole words, case-insensitive. */
  commands: Record<string, () => void>;
  /** Whether listening should be active. */
  enabled?: boolean;
  lang?: string;
  /** Cooldown in ms between firing the same command twice. */
  cooldownMs?: number;
}

/**
 * Continuous, restart-on-end speech recognition that fires whenever any of
 * the registered command phrases appear in the transcript. Used for hands-free
 * "next / back / confirm / <option>" navigation.
 */
export function useVoiceCommands({
  commands,
  enabled = true,
  lang = "en-US",
  cooldownMs = 1200,
}: UseVoiceCommandsOptions) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");

  const recRef = useRef<ISpeechRecognition | null>(null);
  const enabledRef = useRef(enabled);
  const commandsRef = useRef(commands);
  const lastFireRef = useRef<Record<string, number>>({});

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { commandsRef.current = commands; }, [commands]);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { setSupported(false); return; }
    setSupported(true);

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      // Look at the most recent results for snappy matching
      let combined = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        combined += " " + e.results[i][0].transcript;
      }
      const text = combined.trim().toLowerCase();
      if (!text) return;
      setLastHeard(text);
      const now = performance.now();
      for (const phrase of Object.keys(commandsRef.current)) {
        const p = phrase.toLowerCase();
        // Word-boundary match
        const re = new RegExp(`(^|\\s)${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$|[.,!?])`, "i");
        if (re.test(text)) {
          const last = lastFireRef.current[p] || 0;
          if (now - last < cooldownMs) continue;
          lastFireRef.current[p] = now;
          try { commandsRef.current[phrase](); } catch { /* noop */ }
        }
      }
    };

    rec.onerror = (e) => {
      // 'no-speech' / 'aborted' are normal — just let onend restart
      if (e?.error === "not-allowed") {
        enabledRef.current = false;
      }
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      // Auto-restart while still enabled
      if (enabledRef.current) {
        try { rec.start(); setListening(true); } catch { /* already running */ }
      }
    };

    recRef.current = rec;
    return () => {
      enabledRef.current = false;
      try { rec.abort(); } catch { /* noop */ }
      recRef.current = null;
    };
  }, [lang, cooldownMs]);

  // Start/stop based on `enabled`
  useEffect(() => {
    const rec = recRef.current;
    if (!rec || !supported) return;
    if (enabled) {
      try { rec.start(); setListening(true); } catch { /* already running */ }
    } else {
      try { rec.stop(); } catch { /* noop */ }
    }
  }, [enabled, supported]);

  const restart = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    try { rec.abort(); } catch { /* noop */ }
    if (enabledRef.current) {
      try { rec.start(); setListening(true); } catch { /* noop */ }
    }
  }, []);

  return { supported, listening, lastHeard, restart };
}
