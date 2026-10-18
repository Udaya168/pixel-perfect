import { createFileRoute } from "@tanstack/react-router";
import { Kpi, Note, PageHeader, Panel, Pill, QueryState, stateTone } from "@/components/common";
import { useIncidents, usePpe } from "@/hooks/use-data";
import { countBy } from "@/utils/analytics";
import { EVENT_LABELS } from "@/types/incident";
import { fmtTime } from "@/utils/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/ppe")({
  head: pageHead("PPE Monitoring", "Helmet and high-visibility vest detection status and validated incidents."),
  component: Ppe,
});

function cap(available: boolean, validated: boolean) {
  if (!available) return { label: "Feature unavailable", tone: "muted" as const };
  if (!validated) return { label: "Not validated", tone: "warn" as const };
  return { label: "Validated", tone: "ok" as const };
}

function Ppe() {
  const ppe = usePpe();
  const inc = useIncidents();
  const p = ppe.data;
  const validated = !!p && (p.helmet.validated || p.vest.validated);
  const ppeInc = validated ? (inc.data ?? []).filter((i) => i.event_type.startsWith("validated_missing")) : [];

  return (
    <div className="space-y-4">
      <PageHeader title="PPE Monitoring" subtitle="Only validated helmet/vest detections are reported. A person detection alone never implies missing PPE." />
      <QueryState isLoading={ppe.isLoading} error={ppe.error} onRetry={() => ppe.refetch()} />
      {p && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { l: "Helmet detection", s: cap(p.helmet.class_available, p.helmet.validated) },
              { l: "Hi-vis vest detection", s: cap(p.vest.class_available, p.vest.validated) },
              { l: "Worker ↔ PPE association", s: cap(p.association.implemented, p.association.validated) },
            ].map((x) => <Kpi key={x.l} label={x.l} value={<Pill tone={x.s.tone}>{x.s.label}</Pill>} />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Model classes">
              <div className="text-sm">Model: <span className="font-mono">{p.model_name ?? "Not reported"}</span></div>
              <div className="mt-3 flex flex-wrap gap-2">{p.classes.map((c) => <Pill key={c} tone="info">{c}</Pill>)}</div>
              {!validated && <div className="mt-3"><Note>The deployed model does not expose validated PPE classes. PPE incidents are disabled until the backend reports validation evidence.</Note></div>}
            </Panel>
            <Panel title="Camera-wise PPE incidents">
              {validated ? (
                <ul className="space-y-1 text-sm">{countBy(ppeInc, (i) => i.camera_id).map((c) => <li key={c.name} className="flex justify-between"><span className="font-mono">{c.name}</span><span>{c.count}</span></li>)}</ul>
              ) : <div className="text-sm text-muted-foreground">Not available — not validated.</div>}
            </Panel>
          </div>
          <Panel title="PPE incident history">
            {validated ? (
              <>
                <QueryState isLoading={inc.isLoading} error={inc.error} empty={!ppeInc.length} emptyText="No validated PPE incidents received." />
                <ul className="space-y-2 text-sm">
                  {ppeInc.slice(0, 20).map((i) => (
                    <li key={i.event_id} className="flex justify-between gap-2"><span>{EVENT_LABELS[i.event_type]} · <span className="font-mono text-xs">{i.camera_id}</span></span><span className="flex gap-2"><span className="font-mono text-xs text-muted-foreground">{fmtTime(i.timestamp)}</span><Pill tone={stateTone(i.status)}>{i.status}</Pill></span></li>
                  ))}
                </ul>
              </>
            ) : <div className="text-sm text-muted-foreground">FEATURE UNAVAILABLE</div>}
          </Panel>
        </>
      )}
    </div>
  );
}
