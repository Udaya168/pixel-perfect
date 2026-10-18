import type { Incident } from "@/types/incident";

export type Range = "1h" | "24h" | "7d" | "custom";
export const RANGE_MS: Record<Exclude<Range, "custom">, number> = { "1h": 3600e3, "24h": 86400e3, "7d": 7 * 86400e3 };

export function inRange(list: Incident[], from: number, to: number) {
  return list.filter((i) => {
    const t = Date.parse(i.timestamp);
    return t >= from && t <= to;
  });
}

export function countBy(list: Incident[], key: (i: Incident) => string | null) {
  const m = new Map<string, number>();
  for (const i of list) {
    const k = key(i) ?? "n/a";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function timeBuckets(list: Incident[], from: number, to: number, bucketMs: number) {
  const n = Math.max(1, Math.ceil((to - from) / bucketMs));
  const out = Array.from({ length: n }, (_, k) => ({ t: from + k * bucketMs, count: 0 }));
  for (const i of list) {
    const idx = Math.floor((Date.parse(i.timestamp) - from) / bucketMs);
    if (idx >= 0 && idx < n) out[idx].count++;
  }
  return out.map((b) => ({
    label: bucketMs >= 86400e3 ? new Date(b.t).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : new Date(b.t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
    count: b.count,
  }));
}

export function hourOfDay(list: Incident[]) {
  const out = Array.from({ length: 24 }, (_, h) => ({ label: String(h).padStart(2, "0"), count: 0 }));
  for (const i of list) out[new Date(i.timestamp).getHours()].count++;
  return out;
}
