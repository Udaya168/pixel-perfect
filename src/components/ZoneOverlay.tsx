import type { Zone, DetectionFrame } from "@/types/domain";

/** SVG overlay in normalized viewBox 0..1000 (zones) + detection boxes scaled from frame px. */
export function ZoneOverlay({ zones, frame, selectedId }: { zones: Zone[]; frame?: DetectionFrame | null; selectedId?: string | null }) {
  return (
    <svg viewBox="0 0 1000 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
      {zones.map((z) => (
        <g key={z.zone_id}>
          <polygon
            points={z.points.map(([x, y]) => `${x * 1000},${y * 1000}`).join(" ")}
            fill="var(--critical)"
            fillOpacity={z.zone_id === selectedId ? 0.28 : 0.15}
            stroke="var(--critical)"
            strokeWidth={z.zone_id === selectedId ? 3 : 2}
            vectorEffect="non-scaling-stroke"
            strokeDasharray={z.applied ? undefined : "6 4"}
          />
        </g>
      ))}
      {frame?.detections.map((d, k) => {
        const [x1, y1, x2, y2] = d.bbox;
        const sx = 1000 / frame.width;
        const sy = 1000 / frame.height;
        return (
          <g key={k}>
            <rect x={x1 * sx} y={y1 * sy} width={(x2 - x1) * sx} height={(y2 - y1) * sy} fill="none" stroke="var(--primary)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <text x={x1 * sx + 4} y={y1 * sy - 6} fill="var(--primary)" fontSize={22} fontFamily="IBM Plex Mono">
              {d.class_label} {Math.round(d.confidence * 100)}%{d.track_id != null ? ` #${d.track_id}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
