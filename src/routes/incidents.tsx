
import { useMemo, useState } from "react";
import { ArrowDownUp, Download, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Note, PageHeader, Panel, Pill, QueryState, stateTone } from "@/components/common";
import { useIncidents, useMode, usePpe, useUpdateIncident } from "@/hooks/use-data";
import { EVENT_LABELS, EVENT_TYPES, INCIDENT_STATUSES, SEVERITIES, type Incident } from "@/types/incident";
import { downloadJson, fmtPct, fmtTime } from "@/utils/format";
import { describeError } from "@/services/api-client";
import { pageHead } from "@/lib/seo";


const sel = "h-9 rounded-md border bg-background px-2 text-sm";
const PAGE = 15;

export function Incidents() {
  const { mode } = useMode();
  const q = useIncidents();
  const ppe = usePpe();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sev, setSev] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [asc, setAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const ppeOk = !!ppe.data && (ppe.data.helmet.validated || ppe.data.vest.validated);
  const types = EVENT_TYPES.filter((t) => t === "restricted_zone_entry" || ppeOk);

  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const f = from ? Date.parse(from) : -Infinity;
    const t = to ? Date.parse(to) + 86400e3 : Infinity;
    return (q.data ?? [])
      .filter((i) => !s || i.event_id.toLowerCase().includes(s) || i.camera_id.toLowerCase().includes(s))
      .filter((i) => !type || i.event_type === type)
      .filter((i) => !status || i.status === status)
      .filter((i) => !sev || i.severity === sev)
      .filter((i) => {
        const ts = Date.parse(i.timestamp);
        return ts >= f && ts < t;
      })
      .sort((a, b) => (asc ? 1 : -1) * a.timestamp.localeCompare(b.timestamp));
  }, [q.data, search, type, status, sev, from, to, asc]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const visible = rows.slice(cur * PAGE, cur * PAGE + PAGE);
  const selected = (q.data ?? []).find((i) => i.event_id === openId) ?? null;
  const reset = (fn: (v: string) => void) => (e: { target: { value: string } }) => { fn(e.target.value); setPage(0); };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Incident Centre"
        subtitle={mode === "demo" ? "Sample records (DEMO-*). Not real events." : "Incidents received from the event processor."}
        actions={
          <Button variant="outline" size="sm" disabled={!rows.length} onClick={() => downloadJson(rows, `incidents-${mode}-${Date.now()}.json`)}>
            <Download className="h-4 w-4" /> Export JSON ({rows.length})
          </Button>
        }
      />
      <Panel>
        <div className="flex flex-wrap gap-2">
          <Input className="h-9 w-full sm:w-56" placeholder="Search event or camera ID" value={search} onChange={reset(setSearch)} aria-label="Search" />
          <select className={sel} value={type} onChange={reset(setType)} aria-label="Event type">
            <option value="">All types</option>
            {types.map((t) => <option key={t} value={t}>{EVENT_LABELS[t]}</option>)}
          </select>
          <select className={sel} value={status} onChange={reset(setStatus)} aria-label="Status">
            <option value="">All statuses</option>
            {INCIDENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={sel} value={sev} onChange={reset(setSev)} aria-label="Severity">
            <option value="">All severities</option>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Input type="date" className="h-9 w-auto" value={from} onChange={reset(setFrom)} aria-label="From date" />
          <Input type="date" className="h-9 w-auto" value={to} onChange={reset(setTo)} aria-label="To date" />
        </div>
        {!ppeOk && <div className="mt-3"><Note>PPE event types are hidden: the deployed model has not validated helmet/vest detection.</Note></div>}
      </Panel>

      <Panel className="overflow-hidden [&>div]:p-0">
        <QueryState isLoading={q.isLoading} error={q.error} onRetry={() => q.refetch()} empty={!!q.data && !rows.length} emptyText="No incidents match these filters." />
        {visible.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event ID</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => setAsc(!asc)}>Timestamp <ArrowDownUp className="h-3 w-3" /></button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Camera</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Conf.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((i) => (
                  <TableRow key={i.event_id} className="cursor-pointer" onClick={() => setOpenId(i.event_id)}>
                    <TableCell className="font-mono text-xs">{i.event_id}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs">{fmtTime(i.timestamp)}</TableCell>
                    <TableCell className="whitespace-nowrap">{EVENT_LABELS[i.event_type] ?? i.event_type}</TableCell>
                    <TableCell className="font-mono text-xs">{i.camera_id}</TableCell>
                    <TableCell className="font-mono text-xs">{i.track_id ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{i.zone_id ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{fmtPct(i.confidence)}</TableCell>
                    <TableCell><Pill tone={stateTone(i.status)}>{i.status}</Pill></TableCell>
                    <TableCell><Pill tone={stateTone(i.delivery_status)}>{i.delivery_status ?? "unknown"}</Pill></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {rows.length > PAGE && (
          <div className="flex items-center justify-between border-t px-4 py-2 text-sm">
            <span className="text-muted-foreground">Page {cur + 1} of {pages} · {rows.length} records</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Panel>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && <IncidentDetail inc={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function IncidentDetail({ inc }: { inc: Incident }) {
  const m = useUpdateIncident();
  const act = (status: string) => {
    m.mutate({ id: inc.event_id, status });
    toast.success(`Incident ${status}`);
  };
  const fields: [string, string][] = [
    ["Timestamp", fmtTime(inc.timestamp)],
    ["Event type", EVENT_LABELS[inc.event_type] ?? inc.event_type],
    ["Camera", inc.camera_id],
    ["Track ID", inc.track_id?.toString() ?? "—"],
    ["Zone", inc.zone_id ?? "—"],
    ["Confidence", fmtPct(inc.confidence)],
    ["Severity", inc.severity ?? "—"],
  ];
  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-mono">{inc.event_id}</SheetTitle>
        <SheetDescription>{inc.description ?? "No description provided."}</SheetDescription>
      </SheetHeader>
      <div className="mt-4 flex gap-2">
        <Pill tone={stateTone(inc.status)}>Status: {inc.status}</Pill>
        <Pill tone={stateTone(inc.delivery_status)}>MQTT: {inc.delivery_status ?? "unknown"}</Pill>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {fields.map(([k, v]) => (
          <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-mono text-xs">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-5 flex gap-2">
        <Button size="sm" variant="outline" disabled={inc.status !== "open" || m.isLoading} onClick={() => act("acknowledged")}>
          <Check className="h-4 w-4" /> Acknowledge
        </Button>
        <Button size="sm" disabled={inc.status === "resolved" || m.isLoading} onClick={() => act("resolved")}>
          <CheckCheck className="h-4 w-4" /> Resolve
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Changing status does not alter alert delivery status.</p>
      <h3 className="panel-title mt-6 mb-2">History</h3>
      <ol className="space-y-2 text-sm">
        {(inc.history ?? []).map((h, k) => (
          <li key={k} className="border-l-2 pl-3">
            <div>{h.from ? `${h.from} → ${h.to}` : `Created as ${h.to}`}</div>
            <div className="font-mono text-[11px] text-muted-foreground">{fmtTime(h.at)} {h.by ? `· ${h.by}` : ""}</div>
          </li>
        ))}
        {!inc.history?.length && <li className="text-muted-foreground">No history provided.</li>}
      </ol>
    </>
  );
}
