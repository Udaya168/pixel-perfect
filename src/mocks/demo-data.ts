/**
 * DEMO MODE ONLY. Deterministic sample records — never mixed with backend data.
 * No performance measurements are fabricated here: FPS/latency/GPU stay null.
 */
import type { Incident } from "@/types/incident";
import type { Camera, Evidence, PpeCapability, SystemStatus, Zone } from "@/types/domain";
import { EVIDENCE_CATEGORIES } from "@/types/domain";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const demoCameras: Camera[] = [
  { camera_id: "CAM-01", name: "Press line A", source_type: "rtsp", status: "online", stream_url: null, stream_format: "unknown", fps: null, inference_latency_ms: null, detection_count: 3, workers_detected: 3, last_seen: null },
  { camera_id: "CAM-02", name: "Loading bay", source_type: "rtsp", status: "online", stream_url: null, stream_format: "unknown", fps: null, inference_latency_ms: null, detection_count: 1, workers_detected: 1, last_seen: null },
  { camera_id: "CAM-03", name: "CNC floor", source_type: "file", status: "online", stream_url: null, stream_format: "unknown", fps: null, inference_latency_ms: null, detection_count: 2, workers_detected: 2, last_seen: null },
  { camera_id: "CAM-04", name: "Warehouse aisle", source_type: "rtsp", status: "offline", stream_url: null, stream_format: "unknown", fps: null, inference_latency_ms: null, detection_count: null, workers_detected: null, last_seen: null },
];

let demoZones: Zone[] = [
  { zone_id: "ZONE-CNC-1", name: "CNC machine envelope", camera_id: "CAM-03", points: [[0.02, 0.06], [0.56, 0.02], [0.58, 0.5], [0.36, 0.62], [0.04, 0.56]], enabled: true, persistence_frames: 5, cooldown_s: 30, applied: false, updated_at: null },
  { zone_id: "ZONE-FORK-1", name: "Forklift parking", camera_id: "CAM-03", points: [[0.46, 0.62], [0.94, 0.56], [0.98, 0.96], [0.5, 0.98]], enabled: true, persistence_frames: 5, cooldown_s: 60, applied: false, updated_at: null },
];

function buildIncidents(): Incident[] {
  const r = rng(42);
  const now = Date.now();
  const anchor = now - (now % 3600000);
  const zonesByCam: Record<string, string> = { "CAM-01": "ZONE-PRESS-1", "CAM-02": "ZONE-DOCK-1", "CAM-03": "ZONE-CNC-1", "CAM-04": "ZONE-AISLE-2" };
  const out: Incident[] = [];
  for (let i = 0; i < 64; i++) {
    const cam = demoCameras[Math.floor(r() * 4)]!.camera_id;
    const ts = new Date(anchor - Math.floor(r() * 7 * 24 * 3600000)).toISOString();
    const roll = r();
    const status = i < 6 ? "open" : roll < 0.15 ? "open" : roll < 0.4 ? "acknowledged" : "resolved";
    const d = r();
    const delivery = d < 0.75 ? "delivered" : d < 0.9 ? "pending" : "failed";
    const sev = (["medium", "high", "critical"] as const)[Math.floor(r() * 3)];
    const history: { from: string | null; to: string; at: string; by: string }[] = [{ from: null, to: "open", at: ts, by: "event-processor" }];
    if (status !== "open") history.push({ from: "open", to: "acknowledged", at: new Date(Date.parse(ts) + 120000).toISOString(), by: "demo-operator" });
    if (status === "resolved") history.push({ from: "acknowledged", to: "resolved", at: new Date(Date.parse(ts) + 900000).toISOString(), by: "demo-operator" });
    out.push({
      event_id: `DEMO-${String(1000 + i)}`,
      timestamp: ts,
      camera_id: cam,
      event_type: "restricted_zone_entry",
      track_id: 100 + Math.floor(r() * 400),
      zone_id: zonesByCam[cam] ?? null,
      confidence: Math.round((0.55 + r() * 0.4) * 100) / 100,
      status,
      delivery_status: delivery,
      severity: sev,
      description: "Sample record: person bottom-centre point inside restricted polygon.",
      history,
    });
  }
  return out.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

let demoIncidents: Incident[] | null = null;
const getIncidents = () => (demoIncidents ??= buildIncidents());

const delay = <T,>(v: T) => Promise.resolve(structuredClone(v));

export const demo = {
  listIncidents: () => delay(getIncidents()),
  getIncident: (id: string) => delay(getIncidents().find((i) => i.event_id === id) ?? null),
  updateIncidentStatus: (id: string, status: string) => {
    const list = getIncidents();
    const inc = list.find((i) => i.event_id === id);
    if (inc && inc.status !== status) {
      inc.history = [...(inc.history ?? []), { from: inc.status, to: status, at: new Date().toISOString(), by: "demo-operator" }];
      inc.status = status; // delivery_status deliberately untouched
    }
    return delay(inc);
  },
  listCameras: () => delay(demoCameras),
  listZones: () => delay(demoZones),
  saveZone: (z: Zone) => {
    const saved = { ...z, applied: false, updated_at: new Date().toISOString() };
    demoZones = [...demoZones.filter((x) => x.zone_id !== z.zone_id), saved];
    return delay(saved);
  },
  deleteZone: (id: string) => {
    demoZones = demoZones.filter((z) => z.zone_id !== id);
    return delay(undefined);
  },
  systemStatus: (): Promise<SystemStatus> =>
    delay({
      components: [
        { id: "api", label: "Backend API", status: "not_connected", detail: "Demo mode — no backend connected", version: null },
        { id: "pipegen", label: "PipeGen", status: "unknown", detail: "Not verified in demo mode", version: null },
        { id: "pipeline", label: "Pipeline run", status: "unknown", detail: "Not verified in demo mode", version: null },
        { id: "tensorrt", label: "TensorRT engine", status: "unknown", detail: "Not verified in demo mode", version: null },
        { id: "deepstream", label: "DeepStream runtime", status: "unknown", detail: "Not verified in demo mode", version: null },
        { id: "event_processor", label: "Event processor", status: "unknown", detail: "Not verified in demo mode", version: null },
        { id: "mqtt", label: "MQTT broker", status: "unknown", detail: "Not verified in demo mode", version: null },
        { id: "json_log", label: "JSON incident log", status: "unknown", detail: "Not verified in demo mode", version: null },
      ],
      gpu: null,
      fps: null,
      inference_latency_ms: null,
      e2e_alert_latency_ms: null,
      mqtt_last_publish: null,
      last_update: null,
      errors: [],
    }),
  ppeCapability: (): Promise<PpeCapability> =>
    delay({
      model_name: null,
      classes: ["person"],
      helmet: { class_available: false, validated: false },
      vest: { class_available: false, validated: false },
      association: { implemented: false, validated: false },
    }),
  listEvidence: (): Promise<Evidence[]> =>
    delay(
      EVIDENCE_CATEGORIES.map((c, i) => ({
        evidence_id: `pending-${i}`,
        category: c,
        title: "Not yet provided by backend",
        filename: null,
        size_bytes: null,
        created_at: null,
        downloadable: false,
      })),
    ),
};
