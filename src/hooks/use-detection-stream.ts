import { useEffect, useRef, useState } from "react";
import { resolveWsUrl } from "@/config";
import { detectionFrameSchema, type DetectionFrame } from "@/types/domain";

export type StreamState = "idle" | "connecting" | "open" | "closed" | "error" | "not_configured";

/** Live detection metadata over WebSocket: `${WS}/detections/{camera_id}` */
export function useDetectionStream(cameraId: string | null, enabled: boolean) {
  const [frame, setFrame] = useState<DetectionFrame | null>(null);
  const [state, setState] = useState<StreamState>("idle");
  const [nonce, setNonce] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled || !cameraId) {
      setState("idle");
      return;
    }
    const url = resolveWsUrl(`/detections/${encodeURIComponent(cameraId)}`);
    if (!url) {
      setState("not_configured");
      return;
    }
    setState("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setState("open");
    ws.onerror = () => setState("error");
    ws.onclose = () => setState((s) => (s === "error" ? s : "closed"));
    ws.onmessage = (ev) => {
      try {
        const parsed = detectionFrameSchema.safeParse(JSON.parse(ev.data));
        if (parsed.success) setFrame(parsed.data);
      } catch {
        /* ignore malformed frame */
      }
    };
    return () => ws.close();
  }, [cameraId, enabled, nonce]);

  return { frame, state, reconnect: () => setNonce((n) => n + 1) };
}
