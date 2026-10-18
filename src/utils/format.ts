export const fmtTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" }) : "—";

export const fmtNum = (v: number | null | undefined, unit = "", digits = 1) =>
  v == null ? "—" : `${v.toFixed(digits)}${unit ? ` ${unit}` : ""}`;

export const fmtPct = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
