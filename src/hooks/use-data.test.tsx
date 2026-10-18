import { renderHook, cleanup, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { demo } from "@/mocks/demo-data";
import { DataModeProvider, useCameras } from "./use-data";

afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

const wrapper = ({ children }: { children: ReactNode }) => (
  <DataModeProvider>{children}</DataModeProvider>
);

describe("Fast demo navigation", () => {
  it("reuses camera data on returning to a page without re-fetching", async () => {
    localStorage.setItem("wss-mode", "demo");
    const list = vi.spyOn(demo, "listCameras");

    const first = renderHook(() => useCameras(), { wrapper });
    // Wait for async fetch to complete
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(first.result.current.data?.[0]?.camera_id).toBe("CAM-01");
    expect(list).toHaveBeenCalledTimes(1);

    first.unmount();

    // Second mount — data served from in-memory cache, no re-fetch
    const second = renderHook(() => useCameras(), { wrapper });
    expect(second.result.current.data?.[0]?.camera_id).toBe("CAM-01");
    expect(second.result.current.isLoading).toBe(false);
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("returns isolated sample data without an artificial waiting timer", async () => {
    const timers = vi.spyOn(globalThis, "setTimeout");
    const cameras = await demo.listCameras();
    expect(timers).not.toHaveBeenCalled();
    const camera = cameras[0];
    expect(camera).toBeDefined();
    if (camera) camera.name = "Changed copy";
    expect((await demo.listCameras())[0]?.name).toBe("Press line A");
  });
});