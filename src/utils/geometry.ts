export type Pt = [number, number];

function segIntersect(a: Pt, b: Pt, c: Pt, d: Pt) {
  const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

/** Returns an error message, or null when the polygon is valid. */
export function validatePolygon(points: Pt[]): string | null {
  if (points.length < 3) return "A zone needs at least 3 vertices.";
  if (points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1))
    return "All coordinates must be normalized between 0 and 1.";
  const n = points.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      if (segIntersect(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n]))
        return "Polygon edges must not cross each other.";
    }
  }
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  if (Math.abs(area / 2) < 0.0005) return "Polygon area is too small.";
  return null;
}

/** Same rule as the backend: bottom-centre point of the person bbox inside polygon. */
export function pointInPolygon([x, y]: Pt, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
