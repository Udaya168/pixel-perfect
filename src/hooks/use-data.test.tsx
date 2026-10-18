import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { demo } from '@/mocks/demo-data';
import { DataModeProvider, useCameras } from './use-data';

afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('Fast demo navigation', () => {
  it('reuses camera data on returning to a page, but refreshes after invalidation', async () => {
    localStorage.setItem('wss-mode', 'demo');
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const list = vi.spyOn(demo, 'listCameras');
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}><DataModeProvider>{children}</DataModeProvider></QueryClientProvider>;
    const first = renderHook(() => useCameras(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(list).toHaveBeenCalledTimes(1);
    first.unmount();
    const second = renderHook(() => useCameras(), { wrapper });
    expect(second.result.current.data?.[0]?.camera_id).toBe('CAM-01');
    expect(second.result.current.isFetching).toBe(false);
    expect(list).toHaveBeenCalledTimes(1);
    await act(async () => { await queryClient.invalidateQueries({ queryKey: ['cameras', 'demo'] }); });
    expect(list).toHaveBeenCalledTimes(2);
    queryClient.clear();
  });

  it('returns isolated sample data without an artificial waiting timer', async () => {
    const timers = vi.spyOn(globalThis, 'setTimeout');
    const cameras = await demo.listCameras();
    expect(timers).not.toHaveBeenCalled();
    cameras[0].name = 'Changed copy';
    expect((await demo.listCameras())[0]?.name).toBe('Press line A');
  });
});