import { describe, expect, it } from "vitest";
import { pointInPolygon, validatePolygon } from "./geometry";

describe("zone polygon rules", () => {
  it("rejects polygons with fewer than 3 vertices", () => {
    expect(validatePolygon([[0, 0], [1, 1]])).not.toBeNull();
  });
  it("rejects coordinates outside 0..1", () => {
    expect(validatePolygon([[0, 0], [1.2, 0], [0.5, 0.5]])).not.toBeNull();
  });
  it("rejects self-intersecting polygons", () => {
    expect(validatePolygon([[0, 0], [1, 1], [1, 0], [0, 1]])).not.toBeNull();
  });
  it("accepts a valid square", () => {
    expect(validatePolygon([[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]])).toBeNull();
  });
  it("bottom-centre point inside test", () => {
    const sq: [number, number][] = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]];
    expect(pointInPolygon([0.5, 0.5], sq)).toBe(true);
    expect(pointInPolygon([0.95, 0.5], sq)).toBe(false);
  });
});
