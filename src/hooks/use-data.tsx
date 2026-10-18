import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backend } from "@/services/backend";
import { demo } from "@/mocks/demo-data";
import { config } from "@/config";
import type { Zone } from "@/types/domain";

type Mode = "demo" | "live";
const ModeCtx = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({ mode: "demo", setMode: () => {} });
const KEY = "wss-mode";

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("demo");
  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Mode | null;
    if (saved === "demo" || saved === "live") setModeState(saved);
    else setModeState(config.apiBaseUrl ? "live" : "demo");
  }, []);
  const setMode = (m: Mode) => {
    localStorage.setItem(KEY, m);
    setModeState(m);
  };
  return <ModeCtx.Provider value={{ mode, setMode }}>{children}</ModeCtx.Provider>;
}

export const useMode = () => useContext(ModeCtx);

function useSourced<T>(key: string, demoFn: () => Promise<T>, liveFn: () => Promise<T>, poll = true) {
  const { mode } = useMode();
  return useQuery({
    queryKey: [key, mode],
    queryFn: mode === "demo" ? demoFn : liveFn,
    refetchInterval: poll && mode === "live" ? config.pollIntervalMs : false,
    retry: 1,
  });
}

export const useIncidents = () => useSourced("incidents", demo.listIncidents, backend.listIncidents);
export const useCameras = () => useSourced("cameras", demo.listCameras, backend.listCameras);
export const useZones = () => useSourced("zones", demo.listZones, backend.listZones, false);
export const useSystemStatus = () => useSourced("system", demo.systemStatus, backend.systemStatus);
export const usePpe = () => useSourced("ppe", demo.ppeCapability, backend.ppeCapability, false);
export const useEvidence = () => useSourced("evidence", demo.listEvidence, backend.listEvidence, false);
export const usePerfTrends = () => useSourced("perf", () => Promise.resolve([]), backend.analyticsTrends);
export function useApiHealth() {
  const { mode } = useMode();
  return useQuery({
    queryKey: ["health", mode],
    queryFn: backend.health,
    enabled: mode === "live",
    refetchInterval: config.pollIntervalMs,
    retry: 0,
  });
}

export function useUpdateIncident() {
  const { mode } = useMode();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      mode === "demo" ? demo.updateIncidentStatus(id, status) : backend.updateIncidentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useSaveZone() {
  const { mode } = useMode();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zone, isNew }: { zone: Zone; isNew: boolean }) =>
      mode === "demo" ? demo.saveZone(zone) : isNew ? backend.createZone(zone) : backend.updateZone(zone),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zones"] }),
  });
}

export function useDeleteZone() {
  const { mode } = useMode();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => (mode === "demo" ? demo.deleteZone(id) : backend.deleteZone(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zones"] }),
  });
}
