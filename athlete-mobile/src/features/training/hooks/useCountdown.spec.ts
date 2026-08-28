import { act, renderHook } from "@testing-library/react-native";
import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("Initial State", () => {
    it("initializes countdown as duration", () => {
      const { result } = renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 10,
          exerciseId: "1",
          isActive: false,
        }),
      );

      expect(result.current).toBe(10);
    });
  });

  describe("Countdown Behavior", () => {
    it("starts countdown when isActive is true", () => {
      const { result } = renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 5,
          exerciseId: "1",
          isActive: true,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(4);
    });

    it("decrements countdown on each tick", () => {
      const { result } = renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 5,
          exerciseId: "1",
          isActive: true,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(4);

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(3);
    });

    it("resets countdown on completion", () => {
      const { result } = renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 2,
          exerciseId: "1",
          isActive: true,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(1);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBeUndefined();

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBeUndefined();
    });
  });

  describe("Inactive State", () => {
    it("does not start countdown if isActive is initially falsy", () => {
      const { result } = renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 5,
          exerciseId: "1",
          isActive: false,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe(5);
    });

    it("pauses countdown when isActive is falsy", () => {
      const { result, rerender } = renderHook(
        ({ isActive }: { isActive: boolean }) =>
          useCountdown({
            autoAdvance: false,
            duration: 5,
            exerciseId: "1",
            isActive,
            timeoutMs: 100,
          }),
        { initialProps: { isActive: true } },
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(4);

      rerender({ isActive: false });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(4);
    });

    it("resumes countdown following a pause", () => {
      const { result, rerender } = renderHook(
        ({ isActive }: { isActive: boolean }) =>
          useCountdown({
            autoAdvance: false,
            duration: 5,
            exerciseId: "1",
            isActive,
            timeoutMs: 100,
          }),
        { initialProps: { isActive: true } },
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current).toBe(4);

      rerender({ isActive: false });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(4);

      rerender({ isActive: true });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(3);
    });
  });

  describe("Suspended app", () => {
    // iOS and Android suspend a backgrounded app, so no timer runs while time
    // passes. Moving the clock without running timers reproduces that.
    it("accounts for time that passed while no tick fired", () => {
      const { result } = renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 10,
          exerciseId: "1",
          isActive: true,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.setSystemTime(Date.now() + 500);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // 600ms of real time have passed, which is six units of 100ms.
      expect(result.current).toBe(4);
    });

    it("stays where it was when the app was suspended while paused", () => {
      const { result, rerender } = renderHook(
        ({ isActive }: { isActive: boolean }) =>
          useCountdown({
            autoAdvance: false,
            duration: 10,
            exerciseId: "1",
            isActive,
            timeoutMs: 100,
          }),
        { initialProps: { isActive: true } },
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current).toBe(8);

      rerender({ isActive: false });

      act(() => {
        jest.setSystemTime(Date.now() + 5000);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(8);
    });
  });

  describe("Callbacks", () => {
    it("fires 'complete' event when countdown reaches 0", () => {
      const onEvent = jest.fn();

      renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 2,
          exerciseId: "1",
          isActive: true,
          onEvent,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(onEvent).toHaveBeenCalledWith("complete");
    });

    it("fires 'advance' event when countdown reaches 0 and autoAdvance is truthy", () => {
      const onEvent = jest.fn();

      renderHook(() =>
        useCountdown({
          autoAdvance: true,
          duration: 2,
          exerciseId: "1",
          isActive: true,
          onEvent,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(onEvent).toHaveBeenCalledTimes(2);
      expect(onEvent).toHaveBeenCalledWith("complete");
      expect(onEvent).toHaveBeenCalledWith("advance");
    });

    it("does not fire 'advance' event when autoAdvance is falsy", () => {
      const onEvent = jest.fn();

      renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 2,
          exerciseId: "1",
          isActive: true,
          onEvent,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onEvent).toHaveBeenCalledTimes(1);
      expect(onEvent).toHaveBeenCalledWith("complete");
    });
  });

  describe("Duration Changes", () => {
    it("resets countdown when exerciseId changes", () => {
      const { result, rerender } = renderHook(
        ({ exerciseId, duration }: { exerciseId: string; duration: number }) =>
          useCountdown({
            autoAdvance: false,
            duration,
            exerciseId,
            isActive: true,
            timeoutMs: 100,
          }),
        { initialProps: { exerciseId: "1", duration: 10 } },
      );

      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current).toBe(8);

      rerender({ exerciseId: "2", duration: 10 });

      expect(result.current).toBe(10);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe(9);
    });
  });

  describe("Cleanup", () => {
    it("clears interval on unmount", () => {
      const { unmount } = renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 10,
          exerciseId: "1",
          isActive: true,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      unmount();

      // Should not throw
      act(() => {
        jest.advanceTimersByTime(100);
      });
    });
  });
});
