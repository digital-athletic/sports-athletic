import { generateTrainingDayFromStoredDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
import type * as TrainingDayGeneration from "@/features/training/workoutGenerator/trainingDayGeneration";
import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import {
  buildPlanUser,
  generatePlanWorkoutForWeekday,
  generateWarmUpOnlyPlanUser,
} from "@test/factories/planWorkout";
import { catchThrownValue } from "@test/factories/thrownValue";

jest.mock("@/features/training/workoutGenerator/trainingDayGeneration", () => {
  const actual = jest.requireActual<typeof TrainingDayGeneration>(
    "@/features/training/workoutGenerator/trainingDayGeneration",
  );
  return {
    ...actual,
    generateTrainingDayFromStoredDay: jest.fn(
      actual.generateTrainingDayFromStoredDay,
    ),
  };
});

describe("generatePlanWorkout: AIWL generator flag", () => {
  beforeEach(() => {
    jest.mocked(generateTrainingDayFromStoredDay).mockClear();
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(jest.restoreAllMocks);

  describe("flag off", () => {
    setUpAiwlGeneratorFlag(false);

    it("runs the old generator", () => {
      const result = generatePlanWorkoutForWeekday(
        generateWarmUpOnlyPlanUser(),
      );

      expect(generateTrainingDayFromStoredDay).not.toHaveBeenCalled();
      expect(result.map((entry) => entry.skill)).toContain("WU");
    });
  });

  describe("flag on", () => {
    setUpAiwlGeneratorFlag(true);

    it("hands the stored day and the lengths to the new generator", () => {
      const result = generatePlanWorkoutForWeekday(
        generateWarmUpOnlyPlanUser(),
      );

      expect(generateTrainingDayFromStoredDay).toHaveBeenCalledTimes(1);
      const [training] = jest.mocked(generateTrainingDayFromStoredDay).mock
        .calls[0];
      expect(Object.keys(training.skills)).toEqual(["WU"]);
      expect(training.skills.WU?.[0]?.branchId).toBe("410");
      expect(training.lengths).toEqual({ WU: 5 });
      expect(result.map((entry) => entry.skill)).toContain("WU");
    });

    it("reads Math.random when a draw runs, not when the input is built", () => {
      generatePlanWorkoutForWeekday(generateWarmUpOnlyPlanUser());
      const [, input] = jest.mocked(generateTrainingDayFromStoredDay).mock
        .calls[0];
      jest.spyOn(Math, "random").mockReturnValue(0.75);

      expect(input.random()).toBe(0.75);
    });

    it("throws the anamnesis error of main for an athlete without workout data", () => {
      const user = { ...generateWarmUpOnlyPlanUser(), workoutData: undefined };

      expect(
        catchThrownValue(() => generatePlanWorkoutForWeekday(user)),
      ).toEqual({
        type: "NO_ANAMNESIS",
        subtype: "MISSING_WORKOUT_DATA",
        params: [],
      });
      expect(generateTrainingDayFromStoredDay).not.toHaveBeenCalled();
    });
  });

  describe.each([false, true])("flag %s", (flagEnabled) => {
    setUpAiwlGeneratorFlag(flagEnabled);

    beforeEach(() => {
      jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it.each([
      ["an entry that fails the schema", ["not a list"]],
      ["a value that is not a list", "x"],
    ])(
      "rejects a stored skill with %s before any generator runs",
      (_label, skillValue) => {
        const user = buildPlanUser({
          weekday: 1,
          skills: { SWR1: skillValue },
          lengths: { SWR1: 10 },
        });

        expect(
          catchThrownValue(() => generatePlanWorkoutForWeekday(user)),
        ).toEqual(new Error("Invalid data structure for currTraining.skills"));
        expect(generateTrainingDayFromStoredDay).not.toHaveBeenCalled();
      },
    );
  });
});
