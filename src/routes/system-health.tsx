import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kpi, Note, PageHeader, Panel, Pill, QueryState, stateTone } from "@/components/common";
import { useApiHealth, useCameras, useMode, useSystemStatus } from "@/hooks/use-data";
import { fmtNum, fmtTime } from "@/utils/format";
import { describeError } from "@/services/api-client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/system-health")({
  head: pageHead("System Health", "PipeGen, TensorRT, DeepStream, MQTT and backend diagnostics."),
  component: SystemHealth,
});

function explain(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("rtsp") || m.includes("camera")) return "A camera stream could not be opened. Check the camera's network, RTSP URL and credentials on the edge device.";
  if (m.includes("engine") || m.includes("tensorrt")) return "The TensorRT engine failed to load or build. Rebuild the engine for this GPU/TensorRT version via PipeGen.";
  if (m.includes("mqtt")) return "Alerts could not be published. Check the MQTT broker address and the backend bridge credentials.";
  if (m.includes("cuda") || m.includes("memory")) return "The GPU ran out of resources. Reduce batch size or the number of streams.";
  return "Review the component logs on the edge device for more context.";
}

function SystemHealth() {
  const { mode } = useMode();
  const sys = useSystemStatus();
  const health = useApiHealth();
  const cams = useCameras();
  const s = sys.data;
  const lastErr = s?.errors[0];
  const gpuMem = s?.gpu?.memory_total_mb != null ? `${fmtNum(s.gpu.memory_used_mb, "", 0)} / ${fmtNum(s.gpu.memory_total_mb, "MB", 0)}` : "—";

  return (
    <div className="space-y-4">
      <PageHeader
        title="System Health"
        subtitle={`Last successful update: ${fmtTime(s?.last_update)}`}
        actions={<Button size="sm" variant="outline" onClick={() => { sys.refetch(); health.refetch(); cams.refetch(); }}><RefreshCw className="h-4 w-4" /> Refresh</Button>}
      />
      {mode === "live" && (
        <Panel title="Backend API">
          {health.isSuccess ? <Pill tone="ok" dot>Reachable</Pill> : health.isLoading ? <Pill>Checking</Pill> : <div className="space-y-2"><Pill tone="crit" dot>Not connected</Pill><div className="text-sm text-muted-foreground">{describeError(health.error)}</div></div>}
        </Panel>
      )}
      <QueryState isLoading={sys.isLoading} error={sys.error} onRetry={() => sys.refetch()} />
      {s && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Current FPS" value={fmtNum(s.fps)} hint={s.fps == null ? "Not reported" : "Backend-reported"} />
            <Kpi label="Inference latency" value={fmtNum(s.inference_latency_ms, "ms")} hint={s.inference_latency_ms == null ? "Not reported" : undefined} />
            <Kpi label="E2E alert latency" value={fmtNum(s.e2e_alert_latency_ms, "ms")} hint={s.e2e_alert_latency_ms == null ? "Not reported" : undefined} />
            <Kpi label="GPU" value={<span className="text-base">{s.gpu?.name ?? "Not exposed"}</span>} hint={`Memory: ${gpuMem}`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Components">
              <ul className="divide-y">
                {s.components.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <div>{c.label} {c.version && <span className="font-mono text-xs text-muted-foreground">v{c.version}</span>}</div>
                      {c.detail && <div className="text-xs text-muted-foreground">{c.detail}</div>}
                    </div>
                    <Pill tone={stateTone(c.status)} dot>{c.status.replace("_", " ")}</Pill>
                  </li>
                ))}
              </ul>
            </Panel>
            <div className="space-y-4">
              <Panel title="Cameras">
                <ul className="space-y-2 text-sm">
                  {(cams.data ?? []).map((c) => <li key={c.camera_id} className="flex justify-between"><span className="font-mono text-xs">{c.camera_id} <span className="font-sans text-muted-foreground">{c.name}</span></span><Pill tone={stateTone(c.status)} dot>{c.status}</Pill></li>)}
                </ul>
                <QueryState isLoading={cams.isLoading} error={cams.error} empty={!!cams.data && !cams.data.length} />
              </Panel>
              <Panel title="MQTT last publish">
                {s.mqtt_last_publish ? (
                  <div className="text-sm"><Pill tone={s.mqtt_last_publish.result === "success" ? "ok" : "crit"}>{s.mqtt_last_publish.result}</Pill> <span className="font-mono text-xs text-muted-foreground">{fmtTime(s.mqtt_last_publish.at)}</span>{s.mqtt_last_publish.message && <div className="mt-1 text-xs text-muted-foreground">{s.mqtt_last_publish.message}</div>}</div>
                ) : <div className="text-sm text-muted-foreground">No publish result reported.</div>}
              </Panel>
              <Panel title="Diagnostics">
                {lastErr ? (
                  <div className="space-y-2 text-sm">
                    <div className="font-mono text-xs text-critical">[{lastErr.component}] {lastErr.message}</div>
                    <p>{explain(lastErr.message)}</p>
                  </div>
                ) : <Note>No runtime errors reported.</Note>}
                {s.errors.length > 1 && (
                  <ul className="mt-3 max-h-48 space-y-1 overflow-auto font-mono text-[11px] text-muted-foreground">
                    {s.errors.slice(1).map((e, k) => <li key={k}>{fmtTime(e.timestamp)} [{e.component}] {e.message}</li>)}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
