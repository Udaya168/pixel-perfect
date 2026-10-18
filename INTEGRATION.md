# Workplace Safety Sentinel — Backend Integration

The dashboard is a frontend only. Detection runs in the PipeGen v0.5.1 → TensorRT → DeepStream pipeline on the edge device. A Python FastAPI service must expose the **proposed** endpoints below; none are assumed to exist.

## Configuration
- `VITE_API_BASE_URL` — e.g. `https://edge-gw.example.com` (no trailing slash).
- `VITE_WS_URL` — optional; defaults to `${API}/ws` (http→ws).
- Never put MQTT/DB credentials in `VITE_*` variables. The backend bridges MQTT.
- Toggle Demo mode in Settings. Demo data lives only in `src/mocks/`.

## Endpoints (typed in `src/services/backend.ts`, schemas in `src/types/`)
| Method | Path | Response |
|---|---|---|
| GET | /api/health | `{status}` |
| GET | /api/system/status | `SystemStatus` |
| GET | /api/cameras | `Camera[]` (`stream_url` = annotated DeepStream output, MJPEG/HLS) |
| GET | /api/cameras/{id}/status | `Camera` |
| GET | /api/incidents | `Incident[]` |
| GET/PATCH | /api/incidents/{event_id} | `Incident` (PATCH body `{status}`; must not change `delivery_status`) |
| GET | /api/analytics/trends | `PerfSample[]` (`{t, fps, latency_ms, e2e_ms}`) |
| GET/POST | /api/zones | `Zone[]` / `Zone` |
| PUT/DELETE | /api/zones/{zone_id} | `Zone` / 204 — set `applied: true` only after the rule is live |
| GET | /api/ppe/capability | `PpeCapability` |
| GET | /api/evidence | `Evidence[]` |
| GET | /api/evidence/{id}/download | file |
| POST | /api/uploads | multipart `file` → `{upload_id, status}` |
| WS | /ws/detections/{camera_id} | `DetectionFrame` JSON messages |

`/api/analytics/summary` is reserved; the UI currently derives incident analytics from `/api/incidents`.

## Rules
- Zone check: bottom-centre of person bbox `((x1+x2)/2, y2)` normalized, inside polygon for `persistence_frames`, then `cooldown_s` per track.
- PPE incidents only when the model exposes and validates helmet/vest classes.
- Write a metadata adapter in the backend mapping real PipeGen/DeepStream output (NvDsObjectMeta) to `DetectionFrame` — do not assume formats match.
- Enable CORS for the dashboard origin with credentials if using cookie auth.
