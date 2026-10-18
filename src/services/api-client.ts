import type { z } from "zod";
import { config } from "@/config";

export class ApiError extends Error {
  constructor(
    message: string,
    public kind: "not_configured" | "network" | "http" | "invalid_payload",
    public status?: number,
  ) {
    super(message);
  }
}

export async function apiRequest<S extends z.ZodTypeAny>(
  path: string,
  schema: S | null,
  init?: RequestInit,
): Promise<z.infer<S>> {
  if (!config.apiBaseUrl) {
    throw new ApiError("Backend URL not configured (set VITE_API_BASE_URL).", "not_configured");
  }
  let res: Response;
  try {
    res = await fetch(config.apiBaseUrl + path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      credentials: "include",
    });
  } catch {
    throw new ApiError(`Cannot reach backend at ${config.apiBaseUrl}`, "network");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(`HTTP ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`, "http", res.status);
  }
  if (res.status === 204 || !schema) return undefined as z.infer<S>;
  const json = await res.json().catch(() => {
    throw new ApiError("Response was not valid JSON", "invalid_payload");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new ApiError(`Payload failed validation: ${parsed.error.issues[0]?.message}`, "invalid_payload");
  }
  return parsed.data;
}

export function apiUrl(path: string) {
  return config.apiBaseUrl ? config.apiBaseUrl + path : null;
}

export function describeError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Unknown error";
}
