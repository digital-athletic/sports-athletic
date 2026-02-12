import { act, renderHook } from "@testing-library/react-native";
import { useTrainingScheduleStore } from "./trainingScheduleStore";

describe("trainingScheduleStore", () => {
  beforeEach(() => {
    const { result } = renderHook(() => useTrainingScheduleStore());
    act(() => {
      result.current.resetTrainingSchedule();
    });
  });

  describe("initial state", () => {
    it("has 7 training days", () => {
      const { result } = renderHook(() => useTrainingScheduleStore());
      expect(result.current.trainingDays).toHaveLength(7);
    });

    it("all days are inactive by default", () => {
      const { result } = renderHook(() => useTrainingScheduleStore());
      const activeDays = result.current.trainingDays.filter((d) => d.active);
      expect(activeDays).toHaveLength(0);
    });
  });

  describe("toggleDay", () => {
    it("activates an inactive day", () => {
      const { result } = renderHook(() => useTrainingScheduleStore());

      act(() => {
        result.current.toggleDay(0); // Monday
      });

      expect(result.current.trainingDays[0].active).toBe(true);
    });

    it("deactivates an active day", () => {
      const { result } = renderHook(() => useTrainingScheduleStore());

      act(() => {
        result.current.toggleDay(0);
        result.current.toggleDay(0);
      });

      expect(result.current.trainingDays[0].active).toBe(false);
    });
  });

  describe("setDayPlace", () => {
    it("updates place for a weekday", () => {
      const { result } = renderHook(() => useTrainingScheduleStore());

      act(() => {
        result.current.setDayPlace(1, "HOME");
      });

      expect(result.current.trainingDays[1].place).toBe("HOME");
    });
  });

  describe("setDayDuration", () => {
    it("updates duration for a weekday", () => {
      const { result } = renderHook(() => useTrainingScheduleStore());

      act(() => {
        result.current.setDayDuration(2, 60);
      });

      expect(result.current.trainingDays[2].duration).toBe(60);
    });
  });

  describe("getActiveTrainingDays", () => {
    it("returns only active days", () => {
      const { result } = renderHook(() => useTrainingScheduleStore());

      act(() => {
        result.current.toggleDay(0);
        result.current.toggleDay(2);
      });

      expect(result.current.getActiveTrainingDays()).toHaveLength(2);
    });
  });

  describe("getTotalActiveHours", () => {
    it("calculates total hours from active days", () => {
      const { result } = renderHook(() => useTrainingScheduleStore());

      act(() => {
        result.current.toggleDay(0);
        result.current.setDayDuration(0, 60); // 1 hour
        result.current.toggleDay(1);
        result.current.setDayDuration(1, 30); // 0.5 hours
      });

      expect(result.current.getTotalActiveHours()).toBe(1.5);
    });
  });
});
