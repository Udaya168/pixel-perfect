import {
  createContext, useCallback, useContext, useEffect, useMemo,
  useRef, useState, type ReactNode,
} from "react";
import { backend } from "@/services/backend";
import { demo } from "@/mocks/demo-data";
import { config } from "@/config";
import type { Zone } from "@/types/domain";

// ---------------------------------------------------------------------------
// Mode context
// ---------------------------------------------------------------------------
type Mode = "demo" | "live";
const ModeCtx = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({
  mode: "demo",
  setMode: () => {},
});
const KEY = "wss-mode";

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("demo");
  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Mode | null;
    if (saved === "demo" || saved === "live") setModeState(saved);
    else setModeState(config.apiBaseUrl ? "live" : "demo");
  }, []);
  const setMode = useCallback((m: Mode) => {
    localStorage.setItem(KEY, m);
    setModeState(m);
  }, []);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return <ModeCtx.Provider value={value}>{children}</ModeCtx.Provider>;
}

export const useMode = () => useContext(ModeCtx);

// ---------------------------------------------------------------------------
// Generic async fetch hook (replaces useQuery)
// ---------------------------------------------------------------------------
type AsyncState<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
};

// Simple in-memory cache keyed by cache key
const cache = new Map<string, { data: unknown; ts: number }>();

function useAsync<T>(
  cacheKey: string,
  fn: () => Promise<T>,
  poll: boolean,
  pollMs: number,
  staleMs: number,
): AsyncState<T> {
  const [state, setState] = useState<{ data: T | undefined; isLoading: boolean; error: unknown }>(() => {
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < staleMs) {
      return { data: hit.data as T, isLoading: false, error: null };
    }
    return { data: undefined, isLoading: true, error: null };
  });

  const fnRef = useRef(fn);
  fnRef.current = fn;
  const counterRef = useRef(0);

  const run = useCallback(() => {
    const id = ++counterRef.current;
    // Check cache first
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.ts < staleMs) {
      setState({ data: hit.data as T, isLoading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    fnRef.current()
      .then((data) => {
        if (id !== counterRef.current) return;
        cache.set(cacheKey, { data, ts: Date.now() });
        setState({ data, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (id !== counterRef.current) return;
        setState((s) => ({ ...s, isLoading: false, error }));
      });
  }, [cacheKey, staleMs]);

  // Initial fetch
  useEffect(() => {
    run();
  }, [run]);

  // Polling
  useEffect(() => {
    if (!poll || pollMs <= 0) return;
    const id = setInterval(run, pollMs);
    return () => clearInterval(id);
  }, [poll, pollMs, run]);

  return { ...state, refetch: run };
}

// ---------------------------------------------------------------------------
// Mutation hook (replaces useMutation)
// ---------------------------------------------------------------------------
type MutationState<TData> = {
  isLoading: boolean;
  error: unknown;
  data: TData | undefined;
};

function useMutate<TInput, TData>(
  mutFn: (input: TInput) => Promise<TData>,
  onSuccess?: () => void,
): MutationState<TData> & { mutate: (input: TInput) => void } {
  const [state, setState] = useState<MutationState<TData>>({
    isLoading: false,
    error: null,
    data: undefined,
  });

  const mutate = useCallback(
    (input: TInput) => {
      setState({ isLoading: true, error: null, data: undefined });
      mutFn(input)
        .then((data) => {
          setState({ isLoading: false, error: null, data });
          onSuccess?.();
        })
        .catch((error: unknown) => {
          setState({ isLoading: false, error, data: undefined });
        });
    },
    [mutFn, onSuccess],
  );

  return { ...state, mutate };
}

// ---------------------------------------------------------------------------
// Cache invalidation helper
// ---------------------------------------------------------------------------
function invalidate(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function clearAllCache() {
  cache.clear();
}

// ---------------------------------------------------------------------------
// Data hooks
// ---------------------------------------------------------------------------
function useSourced<T>(key: string, demoFn: () => Promise<T>, liveFn: () => Promise<T>, poll = true) {
  const { mode } = useMode();
  const cacheKey = `${key}:${mode}`;
  const staleMs = mode === "demo" ? Infinity : config.pollIntervalMs;
  const pollMs = poll && mode === "live" ? config.pollIntervalMs : 0;
  return useAsync<T>(cacheKey, mode === "demo" ? demoFn : liveFn, poll && mode === "live", pollMs, staleMs);
}

export const useIncidents = () => useSourced("incidents", demo.listIncidents, backend.listIncidents);
export const useCameras = () => useSourced("cameras", demo.listCameras, backend.listCameras);
export const useZones = () => useSourced("zones", demo.listZones, backend.listZones, false);
export const useSystemStatus = () => useSourced("system", demo.systemStatus, backend.systemStatus);
export const usePpe = () => useSourced("ppe", demo.ppeCapability, backend.ppeCapability, false);
export const useEvidence = () => useSourced("evidence", demo.listEvidence, backend.listEvidence, false);
export const usePerfTrends = () =>
  useSourced("perf", () => Promise.resolve([]), backend.analyticsTrends);

export function useApiHealth() {
  const { mode } = useMode();
  return useAsync<unknown>(
    `health:${mode}`,
    backend.health,
    mode === "live",
    config.pollIntervalMs,
    config.pollIntervalMs,
  );
}

export function useUpdateIncident() {
  const { mode } = useMode();
  const fn = useCallback(
    ({ id, status }: { id: string; status: string }) =>
      mode === "demo" ? demo.updateIncidentStatus(id, status) : backend.updateIncidentStatus(id, status),
    [mode],
  );
  return useMutate(fn, () => invalidate("incidents"));
}

export function useSaveZone() {
  const { mode } = useMode();
  const fn = useCallback(
    ({ zone, isNew }: { zone: Zone; isNew: boolean }) =>
      mode === "demo" ? demo.saveZone(zone) : isNew ? backend.createZone(zone) : backend.updateZone(zone),
    [mode],
  );
  return useMutate(fn, () => invalidate("zones"));
}

export function useDeleteZone() {
  const { mode } = useMode();
  const fn = useCallback(
    (id: string) => (mode === "demo" ? demo.deleteZone(id) : backend.deleteZone(id)),
    [mode],
  );
  return useMutate(fn, () => invalidate("zones"));
}
