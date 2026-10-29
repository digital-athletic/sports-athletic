import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import TrainingGenerator from "@/features/training/generators/TrainingGenerator";
import type { TrainingType } from "@/features/training/models/Training";
import { PICKS_BLOCK_HANDLER } from "@/features/training/workoutGenerator/blockHandlers/picks/picksHandler";
import { generateShortWorkoutFromTemplate } from "@/features/training/workoutGenerator/shortWorkoutGeneration";
import type * as ShortWorkoutGeneration from "@/features/training/workoutGenerator/shortWorkoutGeneration";
import { generateStrengthTest } from "@/features/training/workoutGenerator/strengthTestGeneration";
import type * as StrengthTestGeneration from "@/features/training/workoutGenerator/strengthTestGeneration";
import { generateTrainingDayFromStoredDay } from "@/features/training/workoutGenerator/trainingDayGeneration";
import type * as TrainingDayGeneration from "@/features/training/workoutGenerator/trainingDayGeneration";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import type { UserType } from "@/schemas/user.schema";
import {
  buildPlanUser,
  generateKneePreventionBranches,
  generatePlanWorkoutForWeekday,
  generateWarmUpOnlyPlanUser,
  importTrees,
} from "@test/factories/planWorkout";
import {
  generateStoredProgress,
  generateStoredExerciseData,
} from "@test/factories/storedExerciseData";
import {
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateWorkout } from "./workoutGeneratorRouter";

jest.mock("@/features/training/generators/TrainingGenerator", () => {
  const actual = jest.requireActual<{ default: typeof TrainingGenerator }>(
    "@/features/training/generators/TrainingGenerator",
  );
  return {
    __esModule: true,
    default: jest.fn(() => new actual.default()),
  };
});

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

jest.mock("@/features/training/workoutGenerator/strengthTestGeneration", () => {
  const actual = jest.requireActual<typeof StrengthTestGeneration>(
    "@/features/training/workoutGenerator/strengthTestGeneration",
  );
  return {
    ...actual,
    generateStrengthTest: jest.fn(actual.generateStrengthTest),
  };
});

jest.mock("@/features/training/workoutGenerator/shortWorkoutGeneration", () => {
  const actual = jest.requireActual<typeof ShortWorkoutGeneration>(
    "@/features/training/workoutGenerator/shortWorkoutGeneration",
  );
  return {
    ...actual,
    generateShortWorkoutFromTemplate: jest.fn(
      actual.generateShortWorkoutFromTemplate,
    ),
  };
});

/**
 * Generates a workout of the type for the warm up only plan user at home with
 * no equipment, all catalog trees and no earlier progress.
 *
 * generateWorkoutOf("MOB")
 * → [{ branchId: "2", exerciseId: "21", skill: "MOB", ... }, ...]
 */
const generateWorkoutOf = (type: TrainingType) =>
  generateWorkout({
    type,
    user: generateWarmUpOnlyPlanUser(),
    place: "HOME",
    exercises: loadExercises(),
    skillTrees: getAllSkillTrees(),
    weekday: 1,
    equipment: [],
    givenSection: undefined,
    daysSinceLastWorkout: 0,
    userExerciseData: { exerciseData: {}, branchData: {} },
  });

describe("generateWorkout: routing", () => {
  beforeEach(() => {
    jest.mocked(TrainingGenerator).mockClear();
    jest.mocked(generateTrainingDayFromStoredDay).mockClear();
    jest.mocked(generateShortWorkoutFromTemplate).mockClear();
    jest.mocked(generateStrengthTest).mockClear();
  });

  afterEach(jest.restoreAllMocks);

  describe.each([false, true])("flag %s", (flagEnabled) => {
    setUpAiwlGeneratorFlag(flagEnabled);

    it("runs a short workout on the AIWL generator", () => {
      generateWorkoutOf("MOB");

      expect(generateShortWorkoutFromTemplate).toHaveBeenCalledTimes(1);
      expect(TrainingGenerator).not.toHaveBeenCalled();
    });
  });

  describe("flag off", () => {
    setUpAiwlGeneratorFlag(false);

    it("runs the strength test on the old generator", () => {
      const setList = generateWorkoutOf("TEST_WORKOUT");

      expect(setList.length).toBeGreaterThan(0);
      expect(TrainingGenerator).toHaveBeenCalledTimes(1);
      expect(generateStrengthTest).not.toHaveBeenCalled();
      expect(generateShortWorkoutFromTemplate).not.toHaveBeenCalled();
    });

    it("runs a plan training day on the old generator", () => {
      const result = generatePlanWorkoutForWeekday(
        generateWarmUpOnlyPlanUser(),
      );

      expect(TrainingGenerator).toHaveBeenCalledTimes(1);
      expect(generateTrainingDayFromStoredDay).not.toHaveBeenCalled();
      expect(result.map((entry) => entry.skill)).toContain("WU");
    });
  });

  describe("flag on", () => {
    setUpAiwlGeneratorFlag(true);

    it("runs the strength test on the AIWL generator", () => {
      const setList = generateWorkoutOf("TEST_WORKOUT");

      expect(setList.length).toBeGreaterThan(0);
      expect(generateStrengthTest).toHaveBeenCalledTimes(1);
      expect(TrainingGenerator).not.toHaveBeenCalled();
      expect(generateShortWorkoutFromTemplate).not.toHaveBeenCalled();
    });

    it("hands the stored day and the lengths to the AIWL generator", () => {
      const result = generatePlanWorkoutForWeekday(
        generateWarmUpOnlyPlanUser(),
      );

      expect(TrainingGenerator).not.toHaveBeenCalled();
      expect(generateTrainingDayFromStoredDay).toHaveBeenCalledTimes(1);
      const [training] = jest.mocked(generateTrainingDayFromStoredDay).mock
        .calls[0];
      expect(Object.keys(training.skills)).toEqual(["WU"]);
      expect(training.skills.WU?.[0]?.branchId).toBe("410");
      expect(training.lengths).toEqual({ WU: 5 });
      expect(result.map((entry) => entry.skill)).toContain("WU");
    });

    it("reads Math.random when a draw runs, not when the input is built", () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      generatePlanWorkoutForWeekday(generateWarmUpOnlyPlanUser());
      const [, input] = jest.mocked(generateTrainingDayFromStoredDay).mock
        .calls[0];
      jest.spyOn(Math, "random").mockReturnValue(0.75);

      expect(input.random()).toBe(0.75);
    });

    it("throws the anamnesis error for an athlete without workout data", () => {
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

  describe.each([false, true])("plan training day, flag %s", (flagEnabled) => {
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

describe("generateWorkout: progress per skill", () => {
  setUpAiwlGeneratorFlag(true);

  afterEach(jest.restoreAllMocks);

  it("continues a plan day under the resolved prevention skill from its record", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    // The plan stores the day under PREVKNEE, as the placeholder PREV resolves.
    const user: UserType = {
      ...buildPlanUser({
        weekday: 1,
        skills: { PREVKNEE: generateKneePreventionBranches("PREV", 1) },
        lengths: { PREVKNEE: 10 },
      }),
      workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: ["KNEE_LEFT"] } },
    };
    const skillTrees = importTrees("WU", "PREV", "PREVKG");
    const withoutRecords = generatePlanWorkoutForWeekday(user, { skillTrees });
    const exerciseId = withoutRecords.find(
      (entry) => entry.skill === "PREVKNEE",
    )?.exerciseId;

    // The exercise starts at 40 seconds; PREVKNEE holds it at 45 seconds.
    const setList = generatePlanWorkoutForWeekday(user, {
      skillTrees,
      storedProgress: generateStoredProgress(
        generateStoredExerciseData({
          exerciseId,
          skill: "PREVKNEE",
          duration: 45,
        }),
      ),
    });

    const entry = setList.find(
      (candidate) =>
        candidate.skill === "PREVKNEE" && candidate.exerciseId === exerciseId,
    );
    expect(entry?.duration).toBe(45);
  });
});

describe("generateWorkout: short workouts", () => {
  afterEach(jest.restoreAllMocks);
  afterEach(() => useCustomWorkoutsStore.getState().clearCustomWorkouts());

  it("draws the block of the MOB template through the picks block handler", () => {
    const handleBlock = jest.spyOn(PICKS_BLOCK_HANDLER, "handleBlock");

    const setList = generateWorkoutOf("MOB");

    expect(handleBlock).toHaveBeenCalledTimes(1);
    expect(setList.length).toBeGreaterThan(0);
    expect(setList.every((entry) => entry.skill === "MOB")).toBe(true);
  });

  it("draws through Math.random when it runs", () => {
    const random = jest.spyOn(Math, "random").mockReturnValue(0);

    generateWorkoutOf("MOB");

    expect(random).toHaveBeenCalled();
  });

  it("throws NO_EXERCISES with the type for a type without a template", () => {
    expect(
      catchThrownValue(() => generateWorkoutOf("NO_SUCH_TYPE")),
    ).toStrictEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["NO_SUCH_TYPE"],
    });
  });

  it("generates a custom workout of the store", () => {
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(
        generateTemplate(
          [generatePicksBlock("WU", { picks: [{ tags: [], count: 2 }] })],
          { id: "own", name: { en: "Own" } },
        ),
        null,
      );

    const setList = generateWorkoutOf(id);

    expect(setList.length).toBeGreaterThan(0);
    expect(setList.every((entry) => entry.skill === "WU")).toBe(true);
  });

  it("throws the pain error with no regions for a custom workout without blocks", () => {
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(
        generateTemplate([], { id: "empty", name: { en: "Empty" } }),
        null,
      );

    expect(catchThrownValue(() => generateWorkoutOf(id))).toStrictEqual({
      type: "NO_EXERCISES",
      subtype: "PAIN",
      params: [],
    });
  });
});
