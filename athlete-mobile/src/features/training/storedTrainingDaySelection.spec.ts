import {
  generateTwoSectionPlanUser,
  generateWarmUpOnlyPlanUser,
} from "@test/factories/planWorkout";
import {
  createAiwlPlan,
  createAiwlTraining,
} from "@/features/training/utils/testFixtures";
import { isAiwlTrainingDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
import { selectStoredTrainingDay } from "./storedTrainingDaySelection";

/** Selects the day of an old plan; fails the test for an AIWL training. */
const selectOldTrainingDay = (
  ...args: Parameters<typeof selectStoredTrainingDay>
) => {
  const day = selectStoredTrainingDay(...args);
  if (isAiwlTrainingDay(day)) throw new Error("Expected an old training day");
  return day;
};

describe("selectStoredTrainingDay: section", () => {
  it("selects the section that started last before today", () => {
    const day = selectOldTrainingDay(
      generateTwoSectionPlanUser(),
      1,
      undefined,
      0,
    );

    expect(day.lengths).toEqual({ WU: 7 });
  });

  it("selects the given section", () => {
    const day = selectOldTrainingDay(generateTwoSectionPlanUser(), 1, 1, 14);

    expect(day.lengths).toEqual({ WU: 7 });
  });

  it("reads a given section 0 as no section", () => {
    const day = selectOldTrainingDay(generateTwoSectionPlanUser(), 1, 0, 0);

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
      const day = selectOldTrainingDay(
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
  afterEach(jest.restoreAllMocks);

  it("returns the skills and lengths of the weekday's training", () => {
    const day = selectOldTrainingDay(
      generateWarmUpOnlyPlanUser(),
      1,
      undefined,
      0,
    );

    expect(day.skills.WU?.[0]?.branchId).toBe("410");
    expect(day.lengths).toEqual({ WU: 5 });
  });

  it("falls back to the first training for a weekday without training", () => {
    const day = selectOldTrainingDay(
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

  it("returns the workout of a training day stored as an AIWL workout", () => {
    const training = createAiwlTraining();
    const user = {
      ...generateWarmUpOnlyPlanUser(),
      trainingPlan: createAiwlPlan([training]),
    };

    expect(selectStoredTrainingDay(user, 1, undefined, 0)).toEqual(
      training.workout,
    );
  });

  it("returns a copy, so a change to the day leaves the plan unchanged", () => {
    const training = createAiwlTraining();
    const user = {
      ...generateWarmUpOnlyPlanUser(),
      trainingPlan: createAiwlPlan([training]),
    };

    expect(selectStoredTrainingDay(user, 1, undefined, 0)).not.toBe(
      training.workout,
    );
  });

  it("rejects a stored AIWL workout that fails the schema", () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const training = createAiwlTraining();
    const user = {
      ...generateWarmUpOnlyPlanUser(),
      trainingPlan: createAiwlPlan([
        { ...training, workout: { ...training.workout, blocks: [] } },
      ]),
    };

    expect(() => selectStoredTrainingDay(user, 1, undefined, 0)).toThrow(
      "Invalid data structure for currTraining.workout",
    );
  });
});
