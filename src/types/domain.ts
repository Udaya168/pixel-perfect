import { z } from "zod";

/* ---------- Detection metadata (normalized contract) ---------- */
export const detectionSchema = z.object({
  class_label: z.string(),
  confidence: z.number(),
  /** Pixel coords in source frame: [x1, y1, x2, y2] */
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  track_id: z.number().nullable().optional(),
});
export const detectionFrameSchema = z.object({
  frame_timestamp: z.string(),
  camera_id: z.string(),
  width: z.number(),
  height: z.number(),
  detections: z.array(detectionSchema),
  fps: z.number().nullable().optional(),
  inference_latency_ms: z.number().nullable().optional(),
});
export type Detection = z.infer<typeof detectionSchema>;
export type DetectionFrame = z.infer<typeof detectionFrameSchema>;

/* ---------- Cameras ---------- */
export const cameraSchema = z.object({
  camera_id: z.string(),
  name: z.string(),
  source_type: z.enum(["rtsp", "file", "usb", "unknown"]).default("unknown"),
  status: z.enum(["online", "offline", "error", "unknown"]).default("unknown"),
  /** Annotated stream produced by the DeepStream pipeline (MJPEG/HLS/WebRTC gateway) */
  stream_url: z.string().nullable().default(null),
  stream_format: z.enum(["mjpeg", "hls", "mp4", "unknown"]).default("unknown"),
  fps: z.number().nullable().default(null),
  inference_latency_ms: z.number().nullable().default(null),
  detection_count: z.number().nullable().default(null),
  workers_detected: z.number().nullable().default(null),
  last_seen: z.string().nullable().default(null),
});
export type Camera = z.infer<typeof cameraSchema>;

/* ---------- Zones ---------- */
export const zoneSchema = z.object({
  zone_id: z.string(),
  name: z.string(),
  camera_id: z.string(),
  /** Normalized [x, y] coordinates in 0..1 relative to frame size */
  points: z.array(z.tuple([z.number(), z.number()])),
  enabled: z.boolean().default(true),
  persistence_frames: z.number().int().min(1).default(5),
  cooldown_s: z.number().min(0).default(30),
  /** True only when the backend confirms the rule is active in the pipeline */
  applied: z.boolean().default(false),
  updated_at: z.string().nullable().default(null),
});
export type Zone = z.infer<typeof zoneSchema>;

/* ---------- System health ---------- */
export type ComponentState = "ok" | "degraded" | "down" | "unknown" | "not_connected";
export const componentHealthSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["ok", "degraded", "down", "unknown", "not_connected"]),
  detail: z.string().nullable().default(null),
  version: z.string().nullable().default(null),
});
export const systemStatusSchema = z.object({
  components: z.array(componentHealthSchema),
  gpu: z
    .object({ name: z.string(), memory_total_mb: z.number().nullable(), memory_used_mb: z.number().nullable() })
    .nullable()
    .default(null),
  fps: z.number().nullable().default(null),
  inference_latency_ms: z.number().nullable().default(null),
  e2e_alert_latency_ms: z.number().nullable().default(null),
  mqtt_last_publish: z
    .object({ at: z.string(), result: z.enum(["success", "failure"]), message: z.string().nullable() })
    .nullable()
    .default(null),
  last_update: z.string().nullable().default(null),
  errors: z
    .array(z.object({ timestamp: z.string(), component: z.string(), message: z.string(), code: z.string().nullable().optional() }))
    .default([]),
});
export type ComponentHealth = z.infer<typeof componentHealthSchema>;
export type SystemStatus = z.infer<typeof systemStatusSchema>;

/* ---------- PPE capability ---------- */
export const ppeCapabilitySchema = z.object({
  model_name: z.string().nullable(),
  classes: z.array(z.string()),
  helmet: z.object({ class_available: z.boolean(), validated: z.boolean() }),
  vest: z.object({ class_available: z.boolean(), validated: z.boolean() }),
  association: z.object({ implemented: z.boolean(), validated: z.boolean() }),
});
export type PpeCapability = z.infer<typeof ppeCapabilitySchema>;

/* ---------- Evidence ---------- */
export const EVIDENCE_CATEGORIES = [
  "PipeGen requirement stage",
  "Pipeline IR graph",
  "Model & class list",
  "TensorRT engine build",
  "PipeGen speed report",
  "Runtime logs",
  "Test video results",
  "JSON incident records",
  "MQTT receiver verification",
  "Performance measurements",
  "Tests & known limitations",
] as const;
export const evidenceSchema = z.object({
  evidence_id: z.string(),
  category: z.string(),
  title: z.string(),
  filename: z.string().nullable(),
  size_bytes: z.number().nullable(),
  created_at: z.string().nullable(),
  downloadable: z.boolean(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

/* ---------- Performance trend ---------- */
export const perfSampleSchema = z.object({
  t: z.string(),
  fps: z.number().nullable(),
  latency_ms: z.number().nullable(),
  e2e_ms: z.number().nullable().optional(),
});
export type PerfSample = z.infer<typeof perfSampleSchema>;
