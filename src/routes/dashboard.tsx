import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Kpi, Note, Panel, Pill, QueryState, PageHeader, stateTone } from "@/components/common";
import { useCameras, useIncidents, useMode, usePpe, useSystemStatus } from "@/hooks/use-data";
import { countBy, inRange, RANGE_MS, timeBuckets } from "@/utils/analytics";
import { fmtNum, fmtTime } from "@/utils/format";
import { EVENT_LABELS } from "@/types/incident";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/dashboard")({
  head: pageHead("Overview", "Live safety KPIs, incident trends, camera and pipeline status."),
  component: Dashboard,
});

export const chartTooltip = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 },
  labelStyle: { color: "var(--muted-foreground)" },
};
export const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

function Dashboard() {
  const { mode } = useMode();
  const inc = useIncidents();
  const cams = useCameras();
  const sys = useSystemStatus();
  const ppe = usePpe();
  const now = Date.now();
  const all = inc.data ?? [];
  const last24 = inRange(all, now - RANGE_MS["24h"], now);
  const active = all.filter((i) => i.status === "open");
  const camList = cams.data ?? [];
  const online = camList.filter((c) => c.status === "online").length;
  const workers = camList.some((c) => c.workers_detected != null)
    ? camList.reduce((s, c) => s + (c.workers_detected ?? 0), 0)
    : null;
  const ppeValidated = ppe.data && (ppe.data.helmet.validated || ppe.data.vest.validated);
  const ppeCount = last24.filter((i) => i.event_type.startsWith("validated_missing")).length;
  const mqtt = sys.data?.components.find((c) => c.id === "mqtt");

  return (
    <div className="space-y-5">
      <PageHeader title="Overview" subtitle={mode === "demo" ? "Showing deterministic sample records — not real events." : "Derived from records received from the backend."} />

      {inc.error && <Panel><QueryState isLoading={false} error={inc.error} onRetry={() => inc.refetch()} /></Panel>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Incidents · 24h" value={inc.data ? last24.length : "—"} hint={`Historical total: ${inc.data ? all.length : "—"}`} />
        <Kpi label="Active / unack." value={inc.data ? active.length : "—"} tone={active.length ? "crit" : undefined} hint="Current" />
        <Kpi label="Cameras online" value={cams.data ? `${online}/${camList.length}` : "—"} hint="Current" tone={cams.data && online < camList.length ? "warn" : undefined} />
        <Kpi label="Workers detected" value={workers ?? "—"} hint={mode === "demo" ? "Sample value" : "Current, all cameras"} />
        <Kpi label="Zone entries · 24h" value={inc.data ? last24.filter((i) => i.event_type === "restricted_zone_entry").length : "—"} />
        <Kpi label="PPE violations · 24h" value={ppeValidated ? ppeCount : "N/A"} hint={ppeValidated ? "Validated only" : "Not validated"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Incident trend · last 7 days" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={timeBuckets(inRange(all, now - RANGE_MS["7d"], now), now - RANGE_MS["7d"], now, 86400e3)}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" {...axis} />
                <YAxis allowDecimals={false} {...axis} width={28} />
                <Tooltip {...chartTooltip} />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} name="Incidents" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Recent incidents" action={<Link to="/incidents" className="text-xs text-primary hover:underline">View all</Link>}>
          <QueryState isLoading={inc.isLoading} error={null} empty={!!inc.data && !all.length} />
          <ol className="space-y-2.5">
            {all.slice(0, 6).map((i) => (
              <li key={i.event_id} className="flex items-start justify-between gap-2 border-l-2 border-border pl-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate">{EVENT_LABELS[i.event_type] ?? i.event_type}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{i.camera_id} · {fmtTime(i.timestamp)}</div>
                </div>
                <Pill tone={stateTone(i.status)}>{i.status}</Pill>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[{ t: "Incidents by camera", d: countBy(all, (i) => i.camera_id) }, { t: "Incidents by hazard zone", d: countBy(all, (i) => i.zone_id) }].map((c) => (
          <Panel key={c.t} title={`${c.t} · all received`}>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={c.d} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" allowDecimals={false} {...axis} />
                  <YAxis type="category" dataKey="name" {...axis} width={100} />
                  <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[0, 3, 3, 0]} name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Camera connections">
          <QueryState isLoading={cams.isLoading} error={cams.error} onRetry={() => cams.refetch()} empty={!!cams.data && !camList.length} />
          <ul className="space-y-2">
            {camList.map((c) => (
              <li key={c.camera_id} className="flex items-center justify-between text-sm">
                <span><span className="font-mono text-xs text-muted-foreground">{c.camera_id}</span> {c.name}</span>
                <Pill tone={stateTone(c.status)} dot>{c.status}</Pill>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Inference performance">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-muted-foreground">FPS</dt><dd className="font-mono text-lg">{fmtNum(sys.data?.fps)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Inference latency</dt><dd className="font-mono text-lg">{fmtNum(sys.data?.inference_latency_ms, "ms")}</dd></div>
            <div className="col-span-2"><dt className="text-xs text-muted-foreground">MQTT delivery</dt><dd className="mt-1"><Pill tone={stateTone(mqtt?.status)} dot>{mqtt?.status?.replace("_", " ") ?? "unknown"}</Pill></dd></div>
          </dl>
          {sys.data?.fps == null && <div className="mt-3"><Note>No measurement reported by the backend.</Note></div>}
        </Panel>
        <Panel title="Pipeline components" action={<Link to="/system-health" className="text-xs text-primary hover:underline">Details</Link>}>
          <ul className="space-y-2">
            {(sys.data?.components ?? []).filter((c) => ["pipegen", "tensorrt", "deepstream", "event_processor"].includes(c.id)).map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                {c.label}
                <Pill tone={stateTone(c.status)} dot>{c.status.replace("_", " ")}</Pill>
              </li>
            ))}
          </ul>
          <QueryState isLoading={sys.isLoading} error={sys.error} onRetry={() => sys.refetch()} />
        </Panel>
      </div>
    </div>
  );
}
