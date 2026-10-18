import { z } from "zod";

export const EVENT_TYPES = [
  "restricted_zone_entry",
  "validated_missing_helmet",
  "validated_missing_vest",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const INCIDENT_STATUSES = ["open", "acknowledged", "resolved"] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];

/** Alert delivery (MQTT) status — independent from incident status. */
export type DeliveryStatus = "delivered" | "pending" | "failed" | "not_configured";

export const statusTransitionSchema = z.object({
  from: z.string().nullable(),
  to: z.string(),
  at: z.string(),
  by: z.string().nullable().optional(),
});

export const incidentSchema = z.object({
  event_id: z.string(),
  timestamp: z.string(),
  camera_id: z.string(),
  event_type: z.string(),
  track_id: z.number().nullable().default(null),
  zone_id: z.string().nullable().default(null),
  confidence: z.number().min(0).max(1).nullable().default(null),
  status: z.string(),
  delivery_status: z.string().nullable().default(null),
  severity: z.enum(SEVERITIES).optional(),
  description: z.string().optional(),
  history: z.array(statusTransitionSchema).optional(),
});

export type Incident = z.infer<typeof incidentSchema>;
export type StatusTransition = z.infer<typeof statusTransitionSchema>;

export const EVENT_LABELS: Record<string, string> = {
  restricted_zone_entry: "Restricted zone entry",
  validated_missing_helmet: "Missing helmet (validated)",
  validated_missing_vest: "Missing vest (validated)",
};
