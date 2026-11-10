import {
  generateTwoSectionPlanUser,
  generateWarmUpOnlyPlanUser,
} from "@test/factories/planWorkout";
import { selectStoredTrainingDay } from "./storedTrainingDaySelection";

describe("selectStoredTrainingDay: section", () => {
  it("selects the section that started last before today", () => {
    const day = selectStoredTrainingDay(
      generateTwoSectionPlanUser(),
      1,
      undefined,
      0,
    );

    expect(day.lengths).toEqual({ WU: 7 });
  });

  it("selects the given section", () => {
    const day = selectStoredTrainingDay(generateTwoSectionPlanUser(), 1, 1, 14);

    expect(day.lengths).toEqual({ WU: 7 });
  });

  it("reads a given section 0 as no section", () => {
    const day = selectStoredTrainingDay(generateTwoSectionPlanUser(), 1, 0, 0);

    expect(day.lengths).toEqual({ WU: 7 });
  });

  it.each([
    [7, { WU: 7 }],
    [14, { WU: 5 }],
    [21, { WU: 5 }],
    [22, { WU: 7 }],
  ])(
    "after %i days without training selects lengths %j",
    (daysSinceLastWorkout, lengths) => {
      const day = selectStoredTrainingDay(
        generateTwoSectionPlanUser(),
        1,
        undefined,
        daysSinceLastWorkout,
      );

      expect(day.lengths).toEqual(lengths);
    },
  );
});

describe("selectStoredTrainingDay: training", () => {
  it("returns the skills and lengths of the weekday's training", () => {
    const day = selectStoredTrainingDay(
      generateWarmUpOnlyPlanUser(),
      1,
      undefined,
      0,
    );

    expect(day.skills.WU?.[0]?.branchId).toBe("410");
    expect(day.lengths).toEqual({ WU: 5 });
  });

  it("falls back to the first training for a weekday without training", () => {
    const day = selectStoredTrainingDay(
      generateWarmUpOnlyPlanUser(),
      3,
      undefined,
      0,
    );

    expect(day.lengths).toEqual({ WU: 5 });
  });

  it("throws the anamnesis error for an athlete without workout data", () => {
    const user = { ...generateWarmUpOnlyPlanUser(), workoutData: undefined };

    expect(() => selectStoredTrainingDay(user, 1, undefined, 0)).toThrow();
  });
});
