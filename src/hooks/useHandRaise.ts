import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight webcam-based "hand raise" detector.
 *
 * No ML model — uses a simple heuristic: it samples the upper-third of the camera
 * frame and looks for a large patch of skin-tone pixels. When the patch (size +
 * brightness) exceeds a threshold, we consider a hand to be raised.
 *
 * Returns:
 *  - active: hand currently detected
 *  - confidence: 0..1
 *  - position: {x, y} normalized 0..1 (where in the upper region the patch is)
 *  - start/stop, cameraReady, error
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

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setActive(false);
    setConfidence(0);
    setPosition(null);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      videoRef.current = video;

      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      canvasRef.current = canvas;
      setCameraReady(true);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas unavailable");

      const tick = () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Sample upper half (where a raised hand would be)
          const sampleH = Math.floor(canvas.height * 0.6);
          const data = ctx.getImageData(0, 0, canvas.width, sampleH).data;

          let skinCount = 0;
          let sumX = 0;
          let sumY = 0;
          const total = data.length / 4;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            // Loose skin-tone heuristic (works for many tones in good light)
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const isSkin =
              r > 80 && g > 40 && b > 20 &&
              max - min > 15 &&
              Math.abs(r - g) > 10 &&
              r > g && r > b;
            if (isSkin) {
              skinCount++;
              const px = (i / 4) % canvas.width;
              const py = Math.floor((i / 4) / canvas.width);
              sumX += px;
              sumY += py;
            }
          }

          const ratio = skinCount / total;
          const conf = Math.min(1, ratio / 0.12); // 12% of upper region = full confidence
          setConfidence(conf);
          const isActive = ratio > 0.04;
          setActive(isActive);
          if (isActive && skinCount > 0) {
            // Mirror x because the camera is selfie-mode
            setPosition({
              x: 1 - sumX / skinCount / canvas.width,
              y: sumY / skinCount / sampleH,
            });
          } else {
            setPosition(null);
          }
        } catch { /* ignore frame errors */ }
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
