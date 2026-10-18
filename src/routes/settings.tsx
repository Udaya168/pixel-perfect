import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Note, PageHeader, Panel, Pill } from "@/components/common";
import { useApiHealth, useMode } from "@/hooks/use-data";
import { config, resolveWsUrl } from "@/config";
import { describeError } from "@/services/api-client";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/settings")({
  head: pageHead("Settings", "Data source, backend connection and integration configuration."),
  component: Settings,
});

const endpoints = [
  "GET /api/health", "GET /api/system/status", "GET /api/cameras", "GET /api/cameras/{camera_id}/status",
  "GET /api/incidents", "GET /api/incidents/{event_id}", "PATCH /api/incidents/{event_id}",
  "GET /api/analytics/summary", "GET /api/analytics/trends", "GET /api/zones", "POST /api/zones",
  "PUT /api/zones/{zone_id}", "DELETE /api/zones/{zone_id}", "GET /api/ppe/capability",
  "GET /api/evidence", "GET /api/evidence/{evidence_id}/download", "POST /api/uploads",
  "WS  /ws/detections/{camera_id}",
];

function Settings() {
  const { mode, setMode } = useMode();
  const health = useApiHealth();
  const qc = useQueryClient();
  return (
    <div className="space-y-4">
      <PageHeader title="System Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Data source">
          <div className="flex items-center gap-3">
            <Switch id="demo" checked={mode === "demo"} onCheckedChange={(v) => { setMode(v ? "demo" : "live"); qc.clear(); }} />
            <Label htmlFor="demo">Demo mode (deterministic sample data)</Label>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Demo records are never mixed with backend records. Turn off to use the real backend.</p>
        </Panel>
        <Panel title="Backend connection">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-xs text-muted-foreground">VITE_API_BASE_URL</dt><dd className="font-mono text-xs break-all">{config.apiBaseUrl ?? "not set"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Detection WebSocket</dt><dd className="font-mono text-xs break-all">{resolveWsUrl("/detections/{camera_id}") ?? "not set"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Status</dt><dd>
              {mode === "demo" ? <Pill>Not used in demo mode</Pill> : health.isSuccess ? <Pill tone="ok" dot>Reachable</Pill> : health.isLoading ? <Pill>Checking</Pill> : <Pill tone="crit" dot>{describeError(health.error)}</Pill>}
            </dd></div>
          </dl>
          <Button size="sm" variant="outline" className="mt-3" disabled={mode === "demo"} onClick={() => health.refetch()}>Test connection</Button>
        </Panel>
      </div>
      <Panel title="Proposed backend contract (requires implementation)">
        <ul className="grid gap-1 font-mono text-xs sm:grid-cols-2">{endpoints.map((e) => <li key={e}>{e}</li>)}</ul>
        <div className="mt-3"><Note>MQTT is bridged by the Python backend — broker credentials never reach the browser. See INTEGRATION.md in the project for payload shapes.</Note></div>
      </Panel>
    </div>
  );
}
