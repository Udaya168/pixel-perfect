/**
 * Typed wrappers for the PROPOSED Python FastAPI contract (see INTEGRATION.md).
 * None of these endpoints are assumed to exist until the backend implements them.
 */
import { z } from "zod";
import { apiRequest } from "./api-client";
import { incidentSchema, type Incident } from "@/types/incident";
import {
  cameraSchema,
  evidenceSchema,
  perfSampleSchema,
  ppeCapabilitySchema,
  systemStatusSchema,
  zoneSchema,
  type Zone,
} from "@/types/domain";

const json = (body: unknown) => JSON.stringify(body);

export const backend = {
  health: () => apiRequest("/api/health", z.object({ status: z.string() }).passthrough()),
  systemStatus: () => apiRequest("/api/system/status", systemStatusSchema),
  listCameras: () => apiRequest("/api/cameras", z.array(cameraSchema)),
  cameraStatus: (id: string) => apiRequest(`/api/cameras/${encodeURIComponent(id)}/status`, cameraSchema),
  listIncidents: () => apiRequest("/api/incidents", z.array(incidentSchema)),
  getIncident: (id: string) => apiRequest(`/api/incidents/${encodeURIComponent(id)}`, incidentSchema),
  updateIncidentStatus: (id: string, status: string): Promise<Incident> =>
    apiRequest(`/api/incidents/${encodeURIComponent(id)}`, incidentSchema, { method: "PATCH", body: json({ status }) }),
  analyticsTrends: () => apiRequest("/api/analytics/trends", z.array(perfSampleSchema)),
  listZones: () => apiRequest("/api/zones", z.array(zoneSchema)),
  createZone: (zone: Zone) => apiRequest("/api/zones", zoneSchema, { method: "POST", body: json(zone) }),
  updateZone: (zone: Zone) =>
    apiRequest(`/api/zones/${encodeURIComponent(zone.zone_id)}`, zoneSchema, { method: "PUT", body: json(zone) }),
  deleteZone: (id: string) => apiRequest(`/api/zones/${encodeURIComponent(id)}`, null, { method: "DELETE" }),
  ppeCapability: () => apiRequest("/api/ppe/capability", ppeCapabilitySchema),
  listEvidence: () => apiRequest("/api/evidence", z.array(evidenceSchema)),
  evidenceDownloadPath: (id: string) => `/api/evidence/${encodeURIComponent(id)}/download`,
  uploadVideo: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiRequest("/api/uploads", z.object({ upload_id: z.string(), status: z.string() }), {
      method: "POST",
      body: fd,
      headers: {},
    });
  },
};
