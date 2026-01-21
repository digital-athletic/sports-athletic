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

  describe("Callbacks", () => {
    it("calls onComplete when countdown reaches 0", () => {
      const onComplete = jest.fn();

      renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 2,
          exerciseId: "1",
          isActive: true,
          onComplete,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("calls onAutoAdvance when countdown reaches 0 and autoAdvance is truthy", () => {
      const onAutoAdvance = jest.fn();
      const onComplete = jest.fn();

      renderHook(() =>
        useCountdown({
          autoAdvance: true,
          duration: 2,
          exerciseId: "1",
          isActive: true,
          onAutoAdvance,
          onComplete,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(100);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onAutoAdvance).toHaveBeenCalledTimes(1);
    });

    it("does not call onAutoAdvance when autoAdvance is falsy", () => {
      const onAutoAdvance = jest.fn();

      renderHook(() =>
        useCountdown({
          autoAdvance: false,
          duration: 2,
          exerciseId: "1",
          isActive: true,
          onAutoAdvance,
          timeoutMs: 100,
        }),
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(onAutoAdvance).not.toHaveBeenCalled();
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
