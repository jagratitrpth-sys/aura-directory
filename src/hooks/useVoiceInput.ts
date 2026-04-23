import { useCallback, useEffect, useRef, useState } from "react";

// Minimal types for Web Speech API (not in lib.dom.d.ts)
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
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface UseVoiceInputOptions {
  onFinalResult?: (text: string) => void;
  lang?: string;
}

export function useVoiceInput({ onFinalResult, lang = "en-US" }: UseVoiceInputOptions = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const onFinalRef = useRef(onFinalResult);

  // Keep the callback ref fresh without rebuilding the recognizer
  useEffect(() => { onFinalRef.current = onFinalResult; }, [onFinalResult]);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0].transcript;
        if (res.isFinal) final += text;
        else interim += text;
      }
      // Always reflect the latest heard text (interim or final) so the
      // user sees what is being typed in real time.
      const combined = (final + " " + interim).trim();
      if (combined) setTranscript(combined);
      if (final && onFinalRef.current) onFinalRef.current(final.trim());
    };
    rec.onerror = (e: unknown) => {
      const err = (e as { error?: string })?.error;
      console.warn("[voice] recognition error:", err, e);
      if (err && err !== "no-speech" && err !== "aborted") {
        setError(err);
      }
      setListening(false);
    };
    rec.onend = () => {
      console.info("[voice] recognition ended");
      setListening(false);
    };

    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch { /* noop */ }
      recognitionRef.current = null;
    };
  }, [lang]);

  const start = useCallback(async () => {
    const rec = recognitionRef.current;
    if (!rec || listening) return;

    // Prime the mic — forces the browser to show a permission prompt
    // (or surface a real error) instead of failing silently. Critical in
    // sandboxed iframes like the Lovable preview, where Web Speech API
    // otherwise reports nothing when the mic is blocked.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      const name = (err as { name?: string })?.name || "MicError";
      console.error("[voice] mic permission failed:", name, err);
      setError(
        name === "NotAllowedError"
          ? "not-allowed"
          : name === "NotFoundError"
          ? "no-microphone"
          : name,
      );
      return;
    }

    try {
      setTranscript("");
      setError(null);
      rec.start();
      setListening(true);
      console.info("[voice] recognition started");
    } catch (err) {
      console.error("[voice] start() threw:", err);
      setError("start-failed");
    }
  }, [listening]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try { rec.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  return { supported, listening, transcript, start, stop, setTranscript, error };
}
