import { act, renderHook } from "@testing-library/react-native";
import { useStopwatch } from "./useStopwatch";

describe("useStopwatch", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("Initial State", () => {
    it("initializes elapsed as zero", async () => {
      const { result } = await renderHook(() =>
        useStopwatch({ exerciseId: "1", isActive: false }),
      );

      expect(result.current).toBe(0);
    });
  });

  describe("Stopwatch Behavior", () => {
    it("increments elapsed on each tick while active", async () => {
      const { result } = await renderHook(() =>
        useStopwatch({ exerciseId: "1", isActive: true, timeoutMs: 100 }),
      );

      await act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(1);

      await act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(2);
    });
  });

  describe("Inactive State", () => {
    it("does not count if isActive is initially falsy", async () => {
      const { result } = await renderHook(() =>
        useStopwatch({ exerciseId: "1", isActive: false, timeoutMs: 100 }),
      );

      await act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(0);
    });

    it("pauses elapsed when isActive is falsy", async () => {
      const { result, rerender } = await renderHook(
        ({ isActive }: { isActive: boolean }) =>
          useStopwatch({ exerciseId: "1", isActive, timeoutMs: 100 }),
        { initialProps: { isActive: true } },
      );

      await act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(1);

      await rerender({ isActive: false });

      await act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(1);
    });

    it("resumes counting following a pause", async () => {
      const { result, rerender } = await renderHook(
        ({ isActive }: { isActive: boolean }) =>
          useStopwatch({ exerciseId: "1", isActive, timeoutMs: 100 }),
        { initialProps: { isActive: true } },
      );

      await act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(1);

      await rerender({ isActive: false });

      await act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(1);

      await rerender({ isActive: true });

      await act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(2);
    });
  });

  describe("Suspended app", () => {
    // iOS and Android suspend a backgrounded app, so no timer runs while time
    // passes. Moving the clock without running timers reproduces that.
    it("accounts for time that passed while no tick fired", async () => {
      const { result } = await renderHook(() =>
        useStopwatch({ exerciseId: "1", isActive: true, timeoutMs: 100 }),
      );

      await act(() => {
        jest.setSystemTime(Date.now() + 500);
      });

      await act(() => {
        jest.advanceTimersByTime(100);
      });

      // 600ms of real time have passed, which is six units of 100ms.
      expect(result.current).toBe(6);
    });
  });

  describe("Exercise Changes", () => {
    it("resets elapsed when exerciseId changes", async () => {
      const { result, rerender } = await renderHook(
        ({ exerciseId }: { exerciseId: string }) =>
          useStopwatch({ exerciseId, isActive: true, timeoutMs: 100 }),
        { initialProps: { exerciseId: "1" } },
      );

      await act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current).toBe(2);

      await rerender({ exerciseId: "2" });

      expect(result.current).toBe(0);

      await act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(1);
    });
  });

  describe("Resume", () => {
    it("starts from initialElapsedMs and counts on from there", async () => {
      const { result } = await renderHook(() =>
        useStopwatch({
          exerciseId: "1",
          isActive: true,
          initialElapsedMs: 1200,
          timeoutMs: 100,
        }),
      );

      expect(result.current).toBe(12);

      await act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(13);
    });

    it("reports the running time without pauses each time it stops", async () => {
      const onStop = jest.fn();
      const { rerender } = await renderHook(
        ({ isActive }: { isActive: boolean }) =>
          useStopwatch({
            exerciseId: "1",
            isActive,
            initialElapsedMs: 1000,
            onStop,
            timeoutMs: 100,
          }),
        { initialProps: { isActive: true } },
      );

      await act(() => {
        jest.advanceTimersByTime(300);
      });
      await rerender({ isActive: false });
      expect(onStop).toHaveBeenLastCalledWith(1300);

      await act(() => {
        jest.advanceTimersByTime(5000);
      });
      await rerender({ isActive: true });
      await act(() => {
        jest.advanceTimersByTime(200);
      });
      await rerender({ isActive: false });
      expect(onStop).toHaveBeenLastCalledWith(1500);
    });

    it("reports the running time when it unmounts while running", async () => {
      const onStop = jest.fn();
      const { unmount } = await renderHook(() =>
        useStopwatch({
          exerciseId: "1",
          isActive: true,
          onStop,
          timeoutMs: 100,
        }),
      );
      await act(() => {
        jest.advanceTimersByTime(1200);
      });

      await unmount();

      expect(onStop).toHaveBeenCalledTimes(1);
      expect(onStop).toHaveBeenCalledWith(1200);
    });

    it("does not report again when it unmounts after it stopped", async () => {
      const onStop = jest.fn();
      const { rerender, unmount } = await renderHook(
        ({ isActive }: { isActive: boolean }) =>
          useStopwatch({ exerciseId: "1", isActive, onStop, timeoutMs: 100 }),
        { initialProps: { isActive: true } },
      );
      await act(() => {
        jest.advanceTimersByTime(500);
      });
      await rerender({ isActive: false });

      await unmount();

      expect(onStop).toHaveBeenCalledTimes(1);
      expect(onStop).toHaveBeenCalledWith(500);
    });

    it("does not report before it ever ran", async () => {
      const onStop = jest.fn();
      await renderHook(() =>
        useStopwatch({ exerciseId: "1", isActive: false, onStop }),
      );

      expect(onStop).not.toHaveBeenCalled();
    });
  });

  describe("Cleanup", () => {
    it("clears interval on unmount", async () => {
      const { unmount } = await renderHook(() =>
        useStopwatch({ exerciseId: "1", isActive: true, timeoutMs: 100 }),
      );

      await act(() => {
        jest.advanceTimersByTime(100);
      });

      await unmount();

      // Should not throw
      await act(() => {
        jest.advanceTimersByTime(100);
      });
    });
  });
});
