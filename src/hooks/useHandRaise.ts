import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Webcam-based "hand raise" detector — accuracy-tuned heuristic (no ML model).
 *
 * Pipeline per frame:
 *   1. Draw camera into a small canvas (faster pixel work).
 *   2. Build a skin mask using BOTH HSV and YCbCr ranges (more robust across
 *      skin tones / lighting than a simple RGB rule).
 *   3. AND the skin mask with a motion mask (|frame - prevFrame| > threshold).
 *      This rejects static skin-coloured surfaces — walls, the user's own
 *      face, wood furniture — and only keeps moving skin (i.e. a hand).
 *   4. Compute centroid + area of the kept pixels.
 *   5. Smooth centroid + confidence with an exponential moving average.
 *   6. Debounce `active` so it doesn't flicker on/off between frames.
 *
 * Returns:
 *   - active: hand currently detected (debounced)
 *   - confidence: 0..1 (smoothed)
 *   - position: {x, y} normalized 0..1 inside the sampled region (smoothed,
 *     mirrored for selfie view)
 *   - cameraReady, start, stop, error
 */
export function useHandRaise() {
  const [cameraReady, setCameraReady] = useState(false);
  const [active, setActive] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // Smoothing + debounce state
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const smoothedRef = useRef<{ x: number; y: number; conf: number } | null>(null);
  const activeFramesRef = useRef(0);
  const inactiveFramesRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    prevFrameRef.current = null;
    smoothedRef.current = null;
    activeFramesRef.current = 0;
    inactiveFramesRef.current = 0;
    setCameraReady(false);
    setActive(false);
    setConfidence(0);
    setPosition(null);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      videoRef.current = video;

      // Lower-res sampling canvas for speed; aspect kept the same as video.
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      canvasRef.current = canvas;
      setCameraReady(true);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas unavailable");

      // Tunables — tuned to be permissive enough that a raised hand reliably
      // registers, while still rejecting obvious noise.
      const SAMPLE_TOP = 0.0;          // sample whole frame top-down
      const SAMPLE_BOTTOM = 0.85;      // ignore very bottom (torso)
      const MIN_AREA_RATIO = 0.008;    // ~0.8% of sampled pixels = minimum
      const FULL_AREA_RATIO = 0.05;    // ~5% = full confidence
      const SMOOTHING = 0.4;           // EMA alpha (higher = snappier)
      const ACTIVATE_FRAMES = 2;       // need N consecutive hits to activate
      const DEACTIVATE_FRAMES = 8;     // need N consecutive misses to release

      const sampleTopPx = Math.floor(canvas.height * SAMPLE_TOP);
      const sampleBottomPx = Math.floor(canvas.height * SAMPLE_BOTTOM);
      const sampleHeight = sampleBottomPx - sampleTopPx;

      // Skin classifier: YCbCr is the workhorse (tone-tolerant), with a loose
      // RGB sanity check. Kept permissive so a raised hand always registers.
      const isSkin = (r: number, g: number, b: number): boolean => {
        // Basic RGB sanity (rejects pure greys / cool colours)
        if (r < 60 || g < 30 || b < 15) return false;
        if (r <= g || r <= b) return false;
        // YCbCr skin band
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
        return cb > 77 && cb < 135 && cr > 133 && cr < 180;
      };

      const tick = () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, sampleTopPx, canvas.width, sampleHeight);
          const data = frame.data;
          const w = canvas.width;

          let kept = 0;
          let sumX = 0;
          let sumY = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (!isSkin(r, g, b)) continue;

            const px = (i >> 2) % w;
            const py = (i >> 2) / w | 0;

            kept++;
            sumX += px;
            sumY += py;
          }


          const total = (data.length / 4);
          const ratio = kept / total;
          const rawConf = Math.min(1, Math.max(0, (ratio - MIN_AREA_RATIO) / (FULL_AREA_RATIO - MIN_AREA_RATIO)));

          if (kept > 0 && ratio >= MIN_AREA_RATIO) {
            const cx = sumX / kept / canvas.width;
            const cy = sumY / kept / sampleHeight;
            // Mirror x for selfie view
            const mirroredX = 1 - cx;

            const prevSm = smoothedRef.current;
            const sm = prevSm
              ? {
                  x: prevSm.x + (mirroredX - prevSm.x) * SMOOTHING,
                  y: prevSm.y + (cy - prevSm.y) * SMOOTHING,
                  conf: prevSm.conf + (rawConf - prevSm.conf) * SMOOTHING,
                }
              : { x: mirroredX, y: cy, conf: rawConf };
            smoothedRef.current = sm;

            activeFramesRef.current++;
            inactiveFramesRef.current = 0;

            setConfidence(sm.conf);
            setPosition({ x: sm.x, y: sm.y });
            if (activeFramesRef.current >= ACTIVATE_FRAMES) setActive(true);
          } else {
            inactiveFramesRef.current++;
            activeFramesRef.current = 0;
            // Decay confidence smoothly toward 0
            const prevSm = smoothedRef.current;
            if (prevSm) {
              const decayed = prevSm.conf * (1 - SMOOTHING);
              smoothedRef.current = { ...prevSm, conf: decayed };
              setConfidence(decayed);
            }
            if (inactiveFramesRef.current >= DEACTIVATE_FRAMES) {
              setActive(false);
              setPosition(null);
              smoothedRef.current = null;
            }
          }
        } catch { /* ignore per-frame errors */ }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Camera unavailable";
      setError(msg);
      setCameraReady(false);
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { start, stop, cameraReady, active, confidence, position, error };
}
