
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Plus, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Note, PageHeader, Panel, Pill, QueryState } from "@/components/common";
import { useCameras, useDeleteZone, useMode, useSaveZone, useZones } from "@/hooks/use-data";
import { validatePolygon, type Pt } from "@/utils/geometry";
import { describeError } from "@/services/api-client";
import type { Zone } from "@/types/domain";
import { fmtTime } from "@/utils/format";
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


const blank = (camera_id: string): Zone => ({
  zone_id: "", name: "", camera_id, points: [], enabled: true, persistence_frames: 5, cooldown_s: 30, applied: false, updated_at: null,
});

export function Zones() {
  const { mode } = useMode();
  const cams = useCameras();
  const zones = useZones();
  const save = useSaveZone();
  const del = useDeleteZone();
  const [camId, setCamId] = useState("");
  const [draft, setDraft] = useState<Zone | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => { if (!camId && cams.data?.length) setCamId(cams.data[0]!.camera_id); }, [cams.data, camId]);
  const cam = cams.data?.find((c) => c.camera_id === camId);
  const camZones = (zones.data ?? []).filter((z) => z.camera_id === camId);
  const error = draft ? validateDraft(draft, zones.data ?? [], isNew) : null;

  const toNorm = (e: PointerEvent): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    const c = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
    return [c((e.clientX - r.left) / r.width), c((e.clientY - r.top) / r.height)];
  };
  const setPts = (points: Pt[]) => draft && setDraft({ ...draft, points });

  const onSave = () => {
    if (!draft || error) return;
    save.mutate({ zone: draft, isNew });
    toast.success("Zone saved");
    setIsNew(false);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Hazard Zone Configuration" subtitle="Click to add vertices, drag to move, right-click a vertex to delete." />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Panel
          title={cam ? `${cam.camera_id} · reference frame` : "Camera"}
          action={
            <select className="h-8 rounded-md border bg-background px-2 text-sm" value={camId} onChange={(e) => { setCamId(e.target.value); setDraft(null); }} aria-label="Camera">
              {(cams.data ?? []).map((c) => <option key={c.camera_id} value={c.camera_id}>{c.camera_id} — {c.name}</option>)}
            </select>
          }
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-background select-none">
            {mode === "demo" ? (
              <img src={CAMERA_FRAMES[camId] ?? sampleFrame} alt="Sample reference frame" width={1280} height={720} loading="lazy" className="h-full w-full object-cover" />
            ) : cam?.stream_url ? (
              <img src={cam.stream_url} alt="Camera reference" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No reference frame available from backend</div>
            )}
            <svg
              ref={svgRef}
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              style={{ cursor: draft ? "crosshair" : "default" }}
              onPointerDown={(e) => { if (draft && e.button === 0 && drag === null && e.target === svgRef.current) setPts([...draft.points, toNorm(e)]); }}
              onPointerMove={(e) => { if (draft && drag !== null) setPts(draft.points.map((p, k) => (k === drag ? toNorm(e) : p))); }}
              onPointerUp={() => setDrag(null)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {camZones.filter((z) => z.zone_id !== draft?.zone_id || isNew).map((z) => (
                <polygon key={z.zone_id} points={z.points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(" ")} fill="var(--critical)" fillOpacity={0.12} stroke="var(--critical)" strokeWidth={2} vectorEffect="non-scaling-stroke" className="cursor-pointer" onPointerDown={(e) => { e.stopPropagation(); setDraft(structuredClone(z)); setIsNew(false); }} />
              ))}
              {draft && (
                <>
                  <polygon points={draft.points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(" ")} fill="var(--primary)" fillOpacity={0.2} stroke="var(--primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" />
                  {draft.points.map(([x, y], k) => (
                    <ellipse key={k} cx={x * 1000} cy={y * 1000} rx={9} ry={14} fill="var(--background)" stroke="var(--primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" className="cursor-move"
                      onPointerDown={(e) => { e.stopPropagation(); if (e.button === 2) setPts(draft.points.filter((_, i) => i !== k)); else { (e.target as Element).setPointerCapture?.(e.pointerId); setDrag(k); } }}
                    />
                  ))}
                </>
              )}
            </svg>
          </div>
          <div className="mt-3"><Note>Backend rule: an incident triggers when the <b>bottom-centre point</b> of a person bounding box lies inside the polygon for the configured persistence frames. Coordinates are saved normalized (0–1) to frame size. Dashed outlines are not yet confirmed active by the backend.</Note></div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Zones" action={<Button size="sm" variant="outline" disabled={!camId} onClick={() => { setDraft(blank(camId)); setIsNew(true); }}><Plus className="h-4 w-4" /> New</Button>}>
            <QueryState isLoading={zones.isLoading} error={zones.error} onRetry={() => zones.refetch()} empty={!!zones.data && !camZones.length} emptyText="No zones for this camera." />
            <ul className="space-y-2">
              {camZones.map((z) => (
                <li key={z.zone_id}>
                  <button className={`w-full rounded border p-2 text-left text-sm ${draft?.zone_id === z.zone_id && !isNew ? "border-primary" : ""}`} onClick={() => { setDraft(structuredClone(z)); setIsNew(false); }}>
                    <div className="flex justify-between gap-2"><span>{z.name}</span><Pill tone={z.applied ? "ok" : "warn"}>{z.applied ? "applied" : "not applied"}</Pill></div>
                    <div className="font-mono text-[11px] text-muted-foreground">{z.zone_id} · {z.points.length} pts · saved {fmtTime(z.updated_at)}</div>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {draft && (
            <Panel title={isNew ? "New zone" : "Edit zone"}>
              <div className="space-y-3">
                <div><Label htmlFor="zid">Zone ID</Label><Input id="zid" value={draft.zone_id} disabled={!isNew} onChange={(e) => setDraft({ ...draft, zone_id: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} placeholder="ZONE-01" /></div>
                <div><Label htmlFor="zname">Name</Label><Input id="zname" value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label htmlFor="pf">Persistence (frames)</Label><Input id="pf" type="number" min={1} value={draft.persistence_frames} onChange={(e) => setDraft({ ...draft, persistence_frames: Number(e.target.value) })} /></div>
                  <div><Label htmlFor="cd">Cooldown (s)</Label><Input id="cd" type="number" min={0} value={draft.cooldown_s} onChange={(e) => setDraft({ ...draft, cooldown_s: Number(e.target.value) })} /></div>
                </div>
                <div className="flex items-center gap-2"><Switch id="en" checked={draft.enabled} onCheckedChange={(v) => setDraft({ ...draft, enabled: v })} /><Label htmlFor="en">Enabled</Label></div>
                <pre className="max-h-28 overflow-auto rounded border bg-background p-2 font-mono text-[11px] text-muted-foreground">{JSON.stringify(draft.points)}</pre>
                {error && <p className="text-xs text-critical">{error}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={!!error || save.isLoading} onClick={onSave}><Save className="h-4 w-4" /> Save</Button>
                  <Button size="sm" variant="outline" disabled={!draft.points.length} onClick={() => setPts(draft.points.slice(0, -1))}><Undo2 className="h-4 w-4" /> Undo point</Button>
                  {!isNew && (
                    <Button size="sm" variant="outline" disabled={del.isLoading} onClick={() => { del.mutate(draft.zone_id); toast.success("Zone deleted"); setDraft(null); }}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  )}
                </div>
                {mode === "demo" && <p className="text-xs text-muted-foreground">Demo mode: saved in this browser session only, never applied to a pipeline.</p>}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function validateDraft(z: Zone, existing: Zone[], isNew: boolean): string | null {
  if (!/^[A-Z0-9_-]{2,40}$/.test(z.zone_id)) return "Zone ID: 2–40 chars, A–Z, 0–9, - or _.";
  if (isNew && existing.some((e) => e.zone_id === z.zone_id)) return "Zone ID already exists.";
  if (!z.name.trim()) return "Zone name is required.";
  if (!Number.isInteger(z.persistence_frames) || z.persistence_frames < 1) return "Persistence must be a whole number ≥ 1.";
  if (!(z.cooldown_s >= 0)) return "Cooldown must be ≥ 0.";
  return validatePolygon(z.points);
}
