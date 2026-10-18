
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Note, PageHeader, Panel, Pill } from "@/components/common";
import { clearAllCache, useApiHealth, useMode } from "@/hooks/use-data";
import { config, resolveWsUrl } from "@/config";
import { describeError } from "@/services/api-client";
import { pageHead } from "@/lib/seo";
import { Cable, Database, Braces, ArrowUpRight, RotateCw } from "lucide-react";



const endpoints = [
  "GET /api/health", "GET /api/system/status", "GET /api/cameras", "GET /api/cameras/{camera_id}/status",
  "GET /api/incidents", "GET /api/incidents/{event_id}", "PATCH /api/incidents/{event_id}",
  "GET /api/analytics/summary", "GET /api/analytics/trends", "GET /api/zones", "POST /api/zones",
  "PUT /api/zones/{zone_id}", "DELETE /api/zones/{zone_id}", "GET /api/ppe/capability",
  "GET /api/evidence", "GET /api/evidence/{evidence_id}/download", "POST /api/uploads",
  "WS  /ws/detections/{camera_id}",
];

export function Settings() {
  const { mode, setMode } = useMode();
  const health = useApiHealth();
  const qc = { clear: clearAllCache };
  return (
    <div className="space-y-7">
      <PageHeader title="System Settings" />
      <div className="grid gap-8 xl:grid-cols-2">
        <Panel title={<span className="flex items-center gap-2.5"><Database className="h-4 w-4 text-primary" />Data source</span>} action={<Pill tone={mode === "demo" ? "warn" : "info"}>{mode === "demo" ? "Demo" : "Live"}</Pill>}>
          <div className="flex items-center justify-between gap-4 py-3">
            <Label htmlFor="demo" className="text-sm font-medium">Demo mode</Label>
            <Switch id="demo" checked={mode === "demo"} onCheckedChange={(v) => { setMode(v ? "demo" : "live"); qc.clear(); }} />
          </div>
          <div className="mt-4 flex items-center gap-3 border-l-2 border-warning bg-warning/5 px-4 py-3 text-sm">
            <div><div className="font-medium">{mode === "demo" ? "Sample data selected" : "Live data selected"}</div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Demo records are never mixed with backend records.</p></div>
          </div>
        </Panel>
        <Panel title={<span className="flex items-center gap-2.5"><Cable className="h-4 w-4 text-primary" />Backend connection</span>}>
          <dl className="divide-y divide-border text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2 py-3"><dt className="text-xs text-muted-foreground">API base URL</dt><dd className="max-w-full break-all font-mono text-xs">{config.apiBaseUrl ?? "Not configured"}</dd></div>
            <div className="flex flex-wrap items-start justify-between gap-2 py-3"><dt className="text-xs text-muted-foreground">Detection WebSocket</dt><dd className="max-w-full break-all font-mono text-xs">{resolveWsUrl("/detections/{camera_id}") ?? "Not configured"}</dd></div>
            <div className="flex flex-wrap items-start justify-between gap-2 py-3"><dt className="text-xs text-muted-foreground">Status</dt><dd className="min-w-0 max-w-full">
              {mode === "demo" ? <Pill>Not used in demo mode</Pill> : health.data != null ? <Pill tone="ok" dot>Reachable</Pill> : health.isLoading ? <Pill>Checking</Pill> : <Pill tone="crit" dot>{describeError(health.error)}</Pill>}
            </dd></div>
          </dl>
          <Button size="sm" variant="outline" className="mt-4" disabled={mode === "demo"} onClick={() => health.refetch()}><RotateCw className="h-3.5 w-3.5" />Test connection</Button>
        </Panel>
      </div>
      <Panel title={<span className="flex items-center gap-2.5"><Braces className="h-4 w-4 text-primary" />Integration contract</span>} action={<Pill>Proposed · not implemented</Pill>}>
        <ul className="grid gap-x-8 sm:grid-cols-2">{endpoints.map((e) => { const [method, ...path] = e.trim().split(/\s+/); return <li key={e} className="flex min-w-0 items-center gap-3 border-b border-border/60 py-3"><span className="w-12 shrink-0 font-mono text-[10px] font-semibold text-primary">{method}</span><code className="min-w-0 flex-1 break-all text-xs text-muted-foreground">{path.join(" ")}</code><ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground/50" /></li>; })}</ul>
        <div className="mt-3"><Note>MQTT is bridged by the Python backend — broker credentials never reach the browser. See INTEGRATION.md in the project for payload shapes.</Note></div>
      </Panel>
    </div>
  );
}
