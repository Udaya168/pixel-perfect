import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Note, PageHeader, Panel, QueryState } from "@/components/common";
import { useCameras, useIncidents, useMode, usePerfTrends } from "@/hooks/use-data";
import { countBy, hourOfDay, inRange, RANGE_MS, timeBuckets, type Range } from "@/utils/analytics";
import { axis, chartTooltip } from "@/lib/chart";
import { EVENT_LABELS } from "@/types/incident";
import { pageHead } from "@/lib/seo";


export function Analytics() {
  const { mode } = useMode();
  const inc = useIncidents();
  const cams = useCameras();
  const perf = usePerfTrends();
  const [range, setRange] = useState<Range>("7d");
  const [cf, setCf] = useState("");
  const [ct, setCt] = useState("");
  const [datesReady, setDatesReady] = useState(false);
  useEffect(() => setDatesReady(true), []);
  const now = Date.now();
  const to = range === "custom" && ct ? Date.parse(ct) + 86400e3 : now;
  const from = range === "custom" ? (cf ? Date.parse(cf) : now - RANGE_MS["7d"]) : now - RANGE_MS[range];
  const list = inRange(inc.data ?? [], from, to);
  const span = to - from;
  const bucket = span <= 3600e3 ? 300e3 : span <= 86400e3 ? 3600e3 : 86400e3;
  const ackVsOpen = [
    { name: "Resolved", count: list.filter((i) => i.status === "resolved").length, fill: "var(--success)" },
    { name: "Acknowledged", count: list.filter((i) => i.status === "acknowledged").length, fill: "var(--warning)" },
    { name: "Unresolved (open)", count: list.filter((i) => i.status === "open").length, fill: "var(--critical)" },
  ];
  const camList = cams.data ?? [];
  const uptime = camList.length ? camList.filter((c) => c.status === "online").length / camList.length : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Safety Analytics"
        subtitle={`n = ${list.length} incidents${datesReady ? ` · ${new Date(from).toLocaleString()} → ${new Date(to).toLocaleString()}` : ""}${mode === "demo" ? " · SAMPLE DATA" : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {(["1h", "24h", "7d", "custom"] as Range[]).map((r) => (
              <Button key={r} size="sm" variant={range === r ? "default" : "outline"} onClick={() => setRange(r)}>{r === "custom" ? "Custom" : `Last ${r}`}</Button>
            ))}
            {range === "custom" && (<><Input type="date" className="h-8 w-auto" value={cf} onChange={(e) => setCf(e.target.value)} aria-label="From" /><Input type="date" className="h-8 w-auto" value={ct} onChange={(e) => setCt(e.target.value)} aria-label="To" /></>)}
          </div>
        }
      />
      <QueryState isLoading={inc.isLoading} error={inc.error} onRetry={() => inc.refetch()} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={`Incidents over time (per ${bucket >= 86400e3 ? "day" : bucket >= 3600e3 ? "hour" : "5 min"})`}>
          <Chart><LineChart data={timeBuckets(list, from, to, bucket)}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" {...axis} /><YAxis allowDecimals={false} {...axis} width={28} /><Tooltip {...chartTooltip} /><Line dataKey="count" name="Incidents" stroke="var(--primary)" strokeWidth={2} dot={false} /></LineChart></Chart>
        </Panel>
        <Panel title="Hour-of-day distribution">
          <Chart><BarChart data={hourOfDay(list)}><XAxis dataKey="label" {...axis} /><YAxis allowDecimals={false} {...axis} width={28} /><Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="count" name="Incidents" fill="var(--chart-2)" radius={[3, 3, 0, 0]} /></BarChart></Chart>
        </Panel>
        {[
          { t: "By event type", d: countBy(list, (i) => EVENT_LABELS[i.event_type] ?? i.event_type) },
          { t: "By camera", d: countBy(list, (i) => i.camera_id) },
          { t: "By hazard zone", d: countBy(list, (i) => i.zone_id) },
        ].map((c) => (
          <Panel key={c.t} title={c.t}>
            <Chart><BarChart data={c.d} layout="vertical"><XAxis type="number" allowDecimals={false} {...axis} /><YAxis type="category" dataKey="name" {...axis} width={150} /><Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)" }} /><Bar dataKey="count" name="Incidents" fill="var(--primary)" radius={[0, 3, 3, 0]} /></BarChart></Chart>
          </Panel>
        ))}
        <Panel title="Acknowledged vs unresolved">
          <Chart><PieChart><Pie data={ackVsOpen} dataKey="count" nameKey="name" innerRadius={50} outerRadius={80} stroke="var(--panel)">{ackVsOpen.map((a) => <Cell key={a.name} fill={a.fill} />)}</Pie><Tooltip {...chartTooltip} /><Legend wrapperStyle={{ fontSize: 12 }} /></PieChart></Chart>
        </Panel>
        <Panel title="Camera availability (current snapshot)">
          <div className="font-mono text-3xl">{uptime == null ? "—" : `${Math.round(uptime * 100)}%`}</div>
          <div className="mt-1 text-xs text-muted-foreground">{camList.filter((c) => c.status === "online").length} of {camList.length} cameras online now. Historical uptime requires backend time series.</div>
        </Panel>
        <Panel title="FPS & end-to-end latency trend">
          {perf.data && perf.data.length > 0 ? (
            <Chart><LineChart data={perf.data.map((p) => ({ ...p, label: new Date(p.t).toLocaleTimeString() }))}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" {...axis} /><YAxis {...axis} width={36} /><Tooltip {...chartTooltip} /><Legend wrapperStyle={{ fontSize: 12 }} /><Line dataKey="fps" name="FPS" stroke="var(--primary)" dot={false} /><Line dataKey="e2e_ms" name="E2E latency (ms)" stroke="var(--chart-2)" dot={false} /></LineChart></Chart>
          ) : (
            <>
              <QueryState isLoading={perf.isLoading} error={perf.error} onRetry={() => perf.refetch()} />
              {!perf.error && !perf.isLoading && <Note>No performance measurements supplied by the backend. Nothing is estimated or assumed.</Note>}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Chart({ children }: { children: React.ReactElement }) {
  return <div className="h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div>;
}
