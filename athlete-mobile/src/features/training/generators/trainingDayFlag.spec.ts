import { generateTrainingDayFromStoredDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
import type * as TrainingDayGeneration from "@/features/training/workoutGenerator/trainingDayGeneration";
import { setUpAiwlGeneratorFlag } from "../../../../test/factories/aiwlGeneratorFlag";
import {
  buildPlanUser,
  importTrees,
  noExerciseData,
  realExercises,
} from "../../../../test/factories/planWorkout";
import { catchThrownValue } from "../../../../test/factories/thrownValue";
import TrainingGenerator from "./TrainingGenerator";

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

const generateDay = (user: ReturnType<typeof buildPlanUser>) =>
  new TrainingGenerator().generatePlanWorkout(
    "PLAN",
    user,
    "HALL",
    realExercises,
    importTrees("WU", "CARDIO_4", "CARDIO_5"),
    1,
    [],
    undefined,
    0,
    noExerciseData,
  );

const warmUpOnlyUser = () =>
  buildPlanUser({ weekday: 1, skills: {}, lengths: {} });

describe("generatePlanWorkout: AIWL generator flag", () => {
  beforeEach(() => {
    jest.mocked(generateTrainingDayFromStoredDay).mockClear();
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("flag off", () => {
    setUpAiwlGeneratorFlag(false);

    it("runs the old generator", () => {
      const result = generateDay(warmUpOnlyUser());

      expect(generateTrainingDayFromStoredDay).not.toHaveBeenCalled();
      expect(result.map((entry) => entry.skill)).toContain("WU");
    });
  });

  describe("flag on", () => {
    setUpAiwlGeneratorFlag(true);

    it("hands the stored day and the lengths to the new generator", () => {
      const result = generateDay(warmUpOnlyUser());

      expect(generateTrainingDayFromStoredDay).toHaveBeenCalledTimes(1);
      const [training] = jest.mocked(generateTrainingDayFromStoredDay).mock
        .calls[0];
      expect(Object.keys(training.skills)).toEqual(["WU"]);
      expect(training.skills.WU?.[0]?.branchId).toBe("410");
      expect(training.lengths).toEqual({ WU: 5 });
      expect(result.map((entry) => entry.skill)).toContain("WU");
    });

    it("reads Math.random when a draw runs, not when the input is built", () => {
      generateDay(warmUpOnlyUser());
      const [, input] = jest.mocked(generateTrainingDayFromStoredDay).mock
        .calls[0];
      jest.spyOn(Math, "random").mockReturnValue(0.75);

      expect(input.random()).toBe(0.75);
    });

    it("throws the anamnesis error of main for an athlete without workout data", () => {
      const user = { ...warmUpOnlyUser(), workoutData: undefined };

      expect(catchThrownValue(() => generateDay(user))).toEqual({
        type: "NO_ANAMNESIS",
        subtype: "MISSING_WORKOUT_DATA",
        params: [],
      });
      expect(generateTrainingDayFromStoredDay).not.toHaveBeenCalled();
    });
  });

  describe.each([false, true])("flag %s", (flagEnabled) => {
    setUpAiwlGeneratorFlag(flagEnabled);

    it("rejects a stored skill entry that fails the schema before any generator runs", () => {
      const user = buildPlanUser({
        weekday: 1,
        skills: { SWR1: ["not a list"] },
        lengths: { SWR1: 10 },
      });

      expect(catchThrownValue(() => generateDay(user))).toBeDefined();
      expect(generateTrainingDayFromStoredDay).not.toHaveBeenCalled();
    });
  });
});
