/**
 * Environment-based configuration. Only public, non-secret values belong here.
 * MQTT broker credentials, DB passwords etc. stay on the Python backend.
 */
const env = import.meta.env;

export const config = {
  apiBaseUrl: (env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || null,
  /** WebSocket for live detection metadata + incident events. Defaults to `${api}/ws` convention. */
  wsUrl: (env.VITE_WS_URL as string | undefined) || null,
  pollIntervalMs: 5000,
};

export function resolveWsUrl(path: string): string | null {
  if (config.wsUrl) return config.wsUrl.replace(/\/$/, "") + path;
  if (!config.apiBaseUrl) return null;
  return config.apiBaseUrl.replace(/^http/, "ws") + "/ws" + path;
}
