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
  /** Seconds to wait before auto-retrying after a 'no-speech' error. 0 disables. */
  noSpeechRetrySeconds?: number;
  /** Max consecutive no-speech retries before giving up. */
  maxNoSpeechRetries?: number;
}

export function useVoiceInput({
  onFinalResult,
  lang = "en-US",
  noSpeechRetrySeconds = 3,
  maxNoSpeechRetries = 2,
}: UseVoiceInputOptions = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  /** Last finalized utterance — kept visible across retries. */
  const [lastHeard, setLastHeard] = useState("");
  const [error, setError] = useState<string | null>(null);
  /** Seconds remaining until auto-retry after 'no-speech'. 0 = idle. */
  const [retryCountdown, setRetryCountdown] = useState(0);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const onFinalRef = useRef(onFinalResult);
  const noSpeechCountRef = useRef(0);
  const retryTimerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => { onFinalRef.current = onFinalResult; }, [onFinalResult]);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setRetryCountdown(0);
  }, []);

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
      const combined = (final + " " + interim).trim();
      if (combined) setTranscript(combined);
      if (final) {
        const trimmed = final.trim();
        setLastHeard(trimmed);
        // Reset no-speech retry counter on success
        noSpeechCountRef.current = 0;
        onFinalRef.current?.(trimmed);
      }
    };

    rec.onerror = (e: unknown) => {
      const err = (e as { error?: string })?.error;
      console.warn("[voice] recognition error:", err, e);
      if (err === "no-speech") {
        // Schedule a retry with countdown — handled in onend.
        // Mark via the counter so onend knows to retry.
      } else if (err && err !== "aborted") {
        setError(err);
        noSpeechCountRef.current = 0;
      }
      // Listening flag will be flipped in onend.
    };

    rec.onend = () => {
      console.info("[voice] recognition ended");
      setListening(false);

      // If the last error was no-speech AND user hasn't cancelled,
      // schedule an automatic retry with a visible countdown.
      const shouldRetry =
        !cancelledRef.current &&
        noSpeechCountRef.current < maxNoSpeechRetries &&
        noSpeechRetrySeconds > 0;

      if (shouldRetry) {
        // Heuristic: if no transcript was produced this round, treat as no-speech.
        // (Browsers fire 'no-speech' via onerror first; we just need to know nothing was heard.)
        // We rely on the counter being incremented from the scheduling block below.
      }
    };

    recognitionRef.current = rec;
    return () => {
      try { rec.abort(); } catch { /* noop */ }
      recognitionRef.current = null;
    };
  }, [lang, maxNoSpeechRetries, noSpeechRetrySeconds]);

  // Internal: low-level start (assumes mic permission already granted)
  const startRecognizer = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      setTranscript("");
      setError(null);
      cancelledRef.current = false;
      rec.start();
      setListening(true);
      console.info("[voice] recognition started");
    } catch (err) {
      console.error("[voice] start() threw:", err);
      setError("start-failed");
    }
  }, []);

  // Wire up no-speech retry scheduling. We hook into onerror/onend via a
  // small effect so we can reference startRecognizer + clearRetryTimer.
  useEffect(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    const prevError = rec.onerror;
    const prevEnd = rec.onend;

    rec.onerror = (e: unknown) => {
      prevError?.(e);
      const err = (e as { error?: string })?.error;
      if (err === "no-speech" && !cancelledRef.current) {
        noSpeechCountRef.current += 1;
        if (noSpeechCountRef.current <= maxNoSpeechRetries && noSpeechRetrySeconds > 0) {
          // Begin countdown — onend will fire shortly after this.
          setRetryCountdown(noSpeechRetrySeconds);
        } else {
          setError("no-speech");
          noSpeechCountRef.current = 0;
        }
      }
    };

    rec.onend = () => {
      prevEnd?.();
      // If a countdown is pending, run it then auto-restart.
      if (retryCountdown > 0 || (noSpeechCountRef.current > 0 && !cancelledRef.current && noSpeechCountRef.current <= maxNoSpeechRetries)) {
        // start visible countdown if not already running
        if (retryTimerRef.current === null) {
          let remaining = noSpeechRetrySeconds;
          setRetryCountdown(remaining);
          retryTimerRef.current = window.setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
              clearRetryTimer();
              if (!cancelledRef.current) startRecognizer();
            } else {
              setRetryCountdown(remaining);
            }
          }, 1000);
        }
      }
    };

    return () => {
      rec.onerror = prevError;
      rec.onend = prevEnd;
    };
  }, [supported, maxNoSpeechRetries, noSpeechRetrySeconds, retryCountdown, startRecognizer, clearRetryTimer]);

  const start = useCallback(async () => {
    const rec = recognitionRef.current;
    if (!rec || listening) return;
    clearRetryTimer();
    cancelledRef.current = false;

    // Prime the mic so sandboxed iframes surface a real permission prompt
    // instead of failing silently.
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

    noSpeechCountRef.current = 0;
    startRecognizer();
  }, [listening, startRecognizer, clearRetryTimer]);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    clearRetryTimer();
    noSpeechCountRef.current = 0;
    const rec = recognitionRef.current;
    if (!rec) return;
    try { rec.stop(); } catch { /* noop */ }
    setListening(false);
  }, [clearRetryTimer]);

  return {
    supported,
    listening,
    transcript,
    lastHeard,
    error,
    retryCountdown,
    start,
    stop,
    setTranscript,
  };
}
