import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Maximize, Play, RefreshCw, Square, Upload, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note, PageHeader, Panel, Pill, QueryState, stateTone } from "@/components/common";
import { ZoneOverlay } from "@/components/ZoneOverlay";
import { useCameras, useIncidents, useMode, useZones } from "@/hooks/use-data";
import { useDetectionStream } from "@/hooks/use-detection-stream";
import { backend } from "@/services/backend";
import { describeError } from "@/services/api-client";
import { EVENT_LABELS } from "@/types/incident";
import { fmtNum, fmtTime } from "@/utils/format";
import camPress from "@/assets/cam-press.jpg";
import camLoading from "@/assets/cam-loading.jpg";
import camCnc from "@/assets/cam-cnc.jpg";
import camAisle from "@/assets/cam-aisle.jpg";
import sampleFrame from "@/assets/sample-frame.jpg";

const CAMERA_FRAMES: Record<string, string> = {
  "CAM-01": camPress,
  "CAM-02": camLoading,
  "CAM-03": camCnc,
  "CAM-04": camAisle,
};
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/monitoring")({
  head: pageHead("Live Monitoring", "Annotated camera streams with detections and restricted-zone overlays."),
  component: Monitoring,
});

function Monitoring() {
  const { mode } = useMode();
  const cams = useCameras();
  const zones = useZones();
  const inc = useIncidents();
  const [camId, setCamId] = useState<string | null>(null);
  const [running, setRunning] = useState(true);
  const [mediaError, setMediaError] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const live = mode === "live";
  const stream = useDetectionStream(camId, live && running);

  useEffect(() => {
    if (!camId && cams.data?.length) setCamId(cams.data[0]!.camera_id);
  }, [cams.data, camId]);
  useEffect(() => setMediaError(false), [camId]);

  const cam = cams.data?.find((c) => c.camera_id === camId) ?? null;
  const camZones = (zones.data ?? []).filter((z) => z.camera_id === camId);
  const camIncidents = (inc.data ?? []).filter((i) => i.camera_id === camId).slice(0, 8);
  const fps = stream.frame?.fps ?? cam?.fps ?? null;
  const lat = stream.frame?.inference_latency_ms ?? cam?.inference_latency_ms ?? null;

  let connection: { label: string; tone: "ok" | "warn" | "crit" | "muted" } = { label: "Not connected", tone: "crit" };
  if (!live) connection = { label: "Demo mode — no live inference", tone: "warn" };
  else if (!running) connection = { label: "Stopped", tone: "muted" };
  else if (cam?.status === "offline" || cam?.status === "error") connection = { label: `Camera ${cam.status}`, tone: "crit" };
  else if (mediaError) connection = { label: "Pipeline stream failure", tone: "crit" };
  else if (stream.state === "open") connection = { label: "Live", tone: "ok" };
  else if (stream.state === "connecting") connection = { label: "Connecting…", tone: "warn" };

  const showStream = live && running && cam?.stream_url && !mediaError && cam.status !== "offline";

  return (
    <div className="space-y-4">
      <PageHeader title="Live Monitoring" subtitle="Annotated output from the DeepStream pipeline. The browser performs no detection." />
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <Panel
          title={cam ? `${cam.camera_id} · ${cam.name}` : "No camera selected"}
          action={<Pill tone={connection.tone} dot>{connection.label}</Pill>}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select className="h-9 rounded-md border bg-background px-2 text-sm" value={camId ?? ""} onChange={(e) => setCamId(e.target.value)} aria-label="Camera">
              {(cams.data ?? []).map((c) => (
                <option key={c.camera_id} value={c.camera_id}>{c.camera_id} — {c.name} ({c.source_type})</option>
              ))}
            </select>
            <Button size="sm" variant="outline" disabled={!live || running} onClick={() => setRunning(true)}><Play className="h-4 w-4" /> Start</Button>
            <Button size="sm" variant="outline" disabled={!live || !running} onClick={() => setRunning(false)}><Square className="h-4 w-4" /> Stop</Button>
            <Button size="sm" variant="outline" disabled={!live} onClick={() => { setMediaError(false); stream.reconnect(); }}><RefreshCw className="h-4 w-4" /> Reconnect</Button>
            <Button size="sm" variant="outline" onClick={() => stageRef.current?.requestFullscreen?.()}><Maximize className="h-4 w-4" /> Fullscreen</Button>
          </div>

          <div ref={stageRef} className="relative aspect-video w-full overflow-hidden rounded-md border bg-background">
            {showStream ? (
              cam!.stream_format === "mjpeg" || cam!.stream_format === "unknown" ? (
                <img src={cam!.stream_url!} alt={`Annotated stream ${cam!.camera_id}`} className="h-full w-full object-contain" onError={() => setMediaError(true)} />
              ) : (
                <video src={cam!.stream_url!} autoPlay muted playsInline className="h-full w-full object-contain" onError={() => setMediaError(true)} />
              )
            ) : !live ? (
              <>
                <img src={sampleFrame} alt="Sample reference frame" width={1280} height={720} className="h-full w-full object-cover opacity-70" />
                <div className="absolute left-3 top-3"><Pill tone="warn">Sample preview — not a live feed</Pill></div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <VideoOff className="h-8 w-8" />
                <div className="font-medium text-foreground">NOT CONNECTED</div>
                <div>{!cam ? "No cameras returned by backend." : !cam.stream_url ? "Backend reported no annotated stream URL for this camera." : connection.label}</div>
              </div>
            )}
            <ZoneOverlay zones={camZones} frame={live ? stream.frame : null} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="FPS" value={fmtNum(fps)} />
            <Stat label="Inference latency" value={fmtNum(lat, "ms")} />
            <Stat label="Detections" value={live ? (stream.frame?.detections.length ?? cam?.detection_count ?? "—") : "—"} />
            <Stat label="Detection socket" value={live ? stream.state.replace("_", " ") : "demo"} />
          </div>
          {!live && <div className="mt-3"><Note>Demo mode shows no FPS, latency or detections — those only come from the real pipeline.</Note></div>}
          <QueryState isLoading={cams.isLoading} error={cams.error} onRetry={() => cams.refetch()} />
        </Panel>

        <div className="space-y-4">
          <Panel title="Camera incidents">
            <QueryState isLoading={inc.isLoading} error={inc.error} empty={!!inc.data && !camIncidents.length} emptyText="No incidents for this camera." />
            <ul className="space-y-2">
              {camIncidents.map((i) => (
                <li key={i.event_id} className="rounded border bg-background/50 p-2 text-sm">
                  <div className="flex justify-between gap-2"><span>{EVENT_LABELS[i.event_type] ?? i.event_type}</span><Pill tone={stateTone(i.status)}>{i.status}</Pill></div>
                  <div className="font-mono text-[11px] text-muted-foreground">{i.event_id} · track {i.track_id ?? "—"} · {fmtTime(i.timestamp)}</div>
                </li>
              ))}
            </ul>
          </Panel>
          <UploadPanel live={live} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border bg-background/50 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-mono">{value}</div>
    </div>
  );
}

function UploadPanel({ live }: { live: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("No file selected");
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pick = (f: File | null) => {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
    setStatus(f ? "Preview only — not analyzed" : "No file selected");
  };
  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      const r = await backend.uploadVideo(file);
      setStatus(`Backend status: ${r.status} (upload ${r.upload_id})`);
    } catch (e) {
      setStatus(`Upload failed: ${describeError(e)}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel title="Test clip upload">
      <input type="file" accept="video/*" className="block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-foreground" onChange={(e) => pick(e.target.files?.[0] ?? null)} aria-label="Choose video" />
      {preview && <video src={preview} controls muted className="mt-3 w-full rounded border" />}
      <div className="mt-3 text-xs text-muted-foreground">{status}</div>
      <Button size="sm" className="mt-3 w-full" disabled={!file || !live || busy} onClick={upload}>
        <Upload className="h-4 w-4" /> Send to pipeline
      </Button>
      {!live && <p className="mt-2 text-xs text-muted-foreground">Requires a connected backend. Analysis is only claimed once the backend confirms processing.</p>}
    </Panel>
  );
}
