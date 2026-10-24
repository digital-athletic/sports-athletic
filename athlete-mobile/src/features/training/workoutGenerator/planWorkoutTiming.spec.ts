import { readPlanWorkoutTiming } from "./planWorkoutTiming";

describe("planWorkoutTiming: readPlanWorkoutTiming", () => {
  // Rests: within a superset, between sets, after an exercise.
  it.each([
    ["CARDIO_1_SHORT", 10, "none", [50, 10, 50]],
    ["CARDIO_1_LAKTAT", 4, "none", [240, 10, 240]],
    ["CARDIO_2", 8, "none", [60, 10, 60]],
    ["CARDIO_3", 6, "none", [60, 10, 60]],
    ["CARDIO_4", 1, "none", [10, 10, 10]],
    ["WU", 1, "muscles", [10, 10, 30]],
    ["WUSKSA", 1, "muscles", [30, 30, 30]],
    ["WUSPEZIAL", 1, "muscles", [10, 10, 10]],
    ["MOB", 1, "muscles", [10, 10, 10]],
    ["MAX_STRENGTH", 4, "none", [10, 10, 180]],
    ["SWR2KG", 2, "muscles", [30, 90, 60]],
    ["SK", 2, "muscles", [60, 180, 60]],
    ["SA", 2, "muscles", [75, 180, 75]],
    ["BAS", 2, "muscles", [30, 60, 60]],
    ["PREVKNEE", 2, "muscles", [30, 60, 60]],
    ["GKS", 2, "none", [45, 90, 60]],
    ["GKSKG", 2, "none", [45, 90, 60]],
    ["SAS", 2, "none", [10, 10, 10]],
    ["PLYO", 2, "muscles", [60, 180, 60]],
    ["SASKG", 2, "muscles", [10, 10, 10]],
  ] as const)(
    "gives %s %i sets, superset %s and rests %j",
    (skill, sets, superset, [withinSuperset, betweenSets, afterExercise]) => {
      expect(readPlanWorkoutTiming(skill)).toEqual({
        sets,
        superset,
        rest: { withinSuperset, betweenSets, afterExercise },
      });
    },
  );

  it("reads no inherited key as a skill", () => {
    expect(readPlanWorkoutTiming("constructor")).toEqual({
      sets: 2,
      superset: "muscles",
      rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
    });
  });
});
