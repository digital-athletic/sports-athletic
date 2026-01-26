import {
  countConsecutiveDays,
  DAYS_IN_WEEK,
  getAdjacentWeekday,
  getNextWeekday,
  getPreviousWeekday,
  MAX_CONSECUTIVE_DAYS_ADULT,
  MAX_CONSECUTIVE_DAYS_CHILD,
  validateDaySelection,
} from "./trainingDays";

describe("trainingDays utilities", () => {
  describe("getPreviousWeekday", () => {
    it("returns previous weekday for mid-week days", () => {
      expect(getPreviousWeekday(3)).toBe(2);
      expect(getPreviousWeekday(5)).toBe(4);
    });

    it("wraps around from Sunday (0) to Saturday (6)", () => {
      expect(getPreviousWeekday(0)).toBe(6);
    });

    it("handles first day of week (Monday as 1)", () => {
      expect(getPreviousWeekday(1)).toBe(0);
    });
  });

  describe("getNextWeekday", () => {
    it("returns next weekday for mid-week days", () => {
      expect(getNextWeekday(2)).toBe(3);
      expect(getNextWeekday(4)).toBe(5);
    });

    it("wraps around from Saturday (6) to Sunday (0)", () => {
      expect(getNextWeekday(6)).toBe(0);
    });

    it("handles last day before Saturday", () => {
      expect(getNextWeekday(5)).toBe(6);
    });
  });

  describe("getAdjacentWeekday", () => {
    it('returns previous weekday when direction is "before"', () => {
      expect(getAdjacentWeekday(3, "before")).toBe(2);
      expect(getAdjacentWeekday(0, "before")).toBe(6);
    });

    it('returns next weekday when direction is "after"', () => {
      expect(getAdjacentWeekday(3, "after")).toBe(4);
      expect(getAdjacentWeekday(6, "after")).toBe(0);
    });
  });

  describe("countConsecutiveDays", () => {
    it("returns 0 when no adjacent days are active", () => {
      const trainingDays = [
        { active: false },
        { active: false },
        { active: true },
        { active: false },
        { active: false },
        { active: false },
        { active: false },
      ];
      expect(countConsecutiveDays(trainingDays, 2, "before")).toBe(0);
      expect(countConsecutiveDays(trainingDays, 2, "after")).toBe(0);
    });

    it("counts consecutive active days before the given weekday", () => {
      const trainingDays = [
        { active: false },
        { active: true },
        { active: true },
        { active: true },
        { active: false },
        { active: false },
        { active: false },
      ];
      expect(countConsecutiveDays(trainingDays, 3, "before")).toBe(2);
    });

    it("counts consecutive active days after the given weekday", () => {
      const trainingDays = [
        { active: false },
        { active: false },
        { active: true },
        { active: true },
        { active: true },
        { active: false },
        { active: false },
      ];
      expect(countConsecutiveDays(trainingDays, 2, "after")).toBe(2);
    });

    it("handles wrapping around the week boundaries", () => {
      const trainingDays = [
        { active: true },
        { active: false },
        { active: false },
        { active: false },
        { active: false },
        { active: true },
        { active: true },
      ];
      expect(countConsecutiveDays(trainingDays, 0, "before")).toBe(2);
    });

    it("stops counting when encountering an inactive day", () => {
      const trainingDays = [
        { active: true },
        { active: true },
        { active: false },
        { active: true },
        { active: true },
        { active: true },
        { active: true },
      ];
      expect(countConsecutiveDays(trainingDays, 3, "before")).toBe(0);
      expect(countConsecutiveDays(trainingDays, 3, "after")).toBe(5);
    });

    it("counts all days when all are active", () => {
      const trainingDays = [
        { active: true },
        { active: true },
        { active: true },
        { active: true },
        { active: true },
        { active: true },
        { active: true },
      ];
      expect(countConsecutiveDays(trainingDays, 3, "before")).toBe(6);
      expect(countConsecutiveDays(trainingDays, 3, "after")).toBe(6);
    });
  });

  describe("validateDaySelection", () => {
    describe("for children", () => {
      it("allows selection when no consecutive days exist", () => {
        const trainingDays = [
          { active: false },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
        ];
        expect(validateDaySelection(trainingDays, 3, true)).toBe(true);
      });

      it("allows selection with one inactive day between selection", () => {
        const trainingDays = [
          { active: false },
          { active: false },
          { active: true },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
        ];
        expect(validateDaySelection(trainingDays, 5, true)).toBe(true);
      });

      it("rejects selection when it would create 2 consecutive days", () => {
        const trainingDays = [
          { active: false },
          { active: false },
          { active: true },
          { active: false },
          { active: true },
          { active: false },
          { active: false },
        ];
        expect(validateDaySelection(trainingDays, 3, true)).toBe(false);
      });

      it("rejects selection when already at max consecutive days", () => {
        const trainingDays = [
          { active: false },
          { active: true },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
        ];
        expect(validateDaySelection(trainingDays, 2, true)).toBe(false);
      });
    });

    describe("for adults", () => {
      it("allows selection when no consecutive days exist", () => {
        const trainingDays = [
          { active: false },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
        ];
        expect(validateDaySelection(trainingDays, 3, false)).toBe(true);
      });

      it("allows selection with up to 3 total consecutive days", () => {
        const trainingDays = [
          { active: false },
          { active: false },
          { active: true },
          { active: true },
          { active: false },
          { active: false },
          { active: false },
        ];
        expect(validateDaySelection(trainingDays, 4, false)).toBe(true);
      });

      it("rejects selection when it would create 4 consecutive days", () => {
        const trainingDays = [
          { active: false },
          { active: false },
          { active: true },
          { active: true },
          { active: false },
          { active: true },
          { active: false },
        ];
        expect(validateDaySelection(trainingDays, 4, false)).toBe(false);
      });

      it("allows exactly 3 consecutive days", () => {
        const trainingDays = [
          { active: false },
          { active: true },
          { active: true },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
        ];
        expect(validateDaySelection(trainingDays, 3, false)).toBe(true);
      });

      it("handles wrapping around week boundaries", () => {
        const trainingDays = [
          { active: true },
          { active: false },
          { active: false },
          { active: false },
          { active: false },
          { active: true },
          { active: true },
        ];
        expect(validateDaySelection(trainingDays, 0, false)).toBe(true);
      });

      it("rejects when wrapping creates too many consecutive days", () => {
        const trainingDays = [
          { active: true },
          { active: true },
          { active: false },
          { active: false },
          { active: false },
          { active: true },
          { active: true },
        ];
        expect(validateDaySelection(trainingDays, 0, false)).toBe(false);
      });
    });

    describe("constants validation", () => {
      it("respects MAX_CONSECUTIVE_DAYS_CHILD constant", () => {
        expect(MAX_CONSECUTIVE_DAYS_CHILD).toBe(1);
      });

      it("respects MAX_CONSECUTIVE_DAYS_ADULT constant", () => {
        expect(MAX_CONSECUTIVE_DAYS_ADULT).toBe(3);
      });

      it("respects DAYS_IN_WEEK constant", () => {
        expect(DAYS_IN_WEEK).toBe(7);
      });
    });
  });
});
