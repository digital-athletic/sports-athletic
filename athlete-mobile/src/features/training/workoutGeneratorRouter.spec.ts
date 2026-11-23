import { loadExercises } from "@/data/loadExercises";
import { loadStrengthTestTemplate } from "@/data/loadStrengthTestTemplate";
import { loadTemplate } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { TrainingType } from "@/features/training/models/Training";
import {
  createAiwlPlan,
  createAiwlTraining,
} from "@/features/training/utils/testFixtures";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import * as picksHandler from "@/features/training/workoutGenerator/blockHandlers/picks/picksHandler";
import { generateSetListFromWorkout } from "@/features/training/workoutGenerator/workoutGeneration";
import type * as WorkoutGeneration from "@/features/training/workoutGenerator/workoutGeneration";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
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
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateAthlete } from "@test/factories/athlete";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { lookupTemplate } from "@/features/customWorkouts/lookupTemplate";
import {
  generateSetList,
  selectWorkout,
  SHORT_WORKOUT_FILTERS,
  STRENGTH_TEST_FILTERS,
  type WorkoutGenerationRequest,
} from "./workoutGeneratorRouter";

// The spy keeps the real entry point, so each route still generates its set list.
jest.mock("@/features/training/workoutGenerator/workoutGeneration", () => {
  const actual = jest.requireActual<typeof WorkoutGeneration>(
    "@/features/training/workoutGenerator/workoutGeneration",
  );
  return {
    ...actual,
    generateSetListFromWorkout: jest.fn(actual.generateSetListFromWorkout),
  };
});

/**
 * Builds the request of the warm up only plan user at home with no equipment,
 * all catalog trees and no earlier progress. The overrides replace any field.
 *
 * generateHomeRequest("MOB") → { type: "MOB", place: "HOME", equipment: [], weekday: 1, ... }
 */
const generateHomeRequest = (
  type: TrainingType,
  overrides: Partial<WorkoutGenerationRequest> = {},
): WorkoutGenerationRequest => ({
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
  ...overrides,
});

/**
 * Generates a workout of the type for the request of generateHomeRequest.
 *
 * generateWorkoutOf("MOB")
 * → [{ branchId: "2", exerciseId: "21", skill: "MOB", ... }, ...]
 */
const generateWorkoutOf = (type: TrainingType) => {
  const request = generateHomeRequest(type);
  return generateSetList(selectWorkout(request), request, {
    random: () => Math.random(),
  }).setList;
};

describe("generateSetList: routing", () => {
  beforeEach(() => {
    jest.mocked(generateSetListFromWorkout).mockClear();
  });

  afterEach(jest.restoreAllMocks);

  it("generates a short workout from its template with the catalog lookup, the request's skill trees and the soreness filter off", () => {
    const setList = generateWorkoutOf("MOB");

    expect(setList.length).toBeGreaterThan(0);
    expect(generateSetListFromWorkout).toHaveBeenCalledTimes(1);
    const [workout, lookUpBranch, , options] = jest.mocked(
      generateSetListFromWorkout,
    ).mock.calls[0];
    expect(workout).toEqual(loadTemplate("MOB"));
    expect(lookUpBranch).toBe(lookUpStoredBranchInCatalog);
    expect(options).toEqual({
      skillTrees: getAllSkillTrees(),
      filters: { soreness: false },
    });
  });

  describe("AIWL routes", () => {
    it("generates the bundled strength test with the catalog lookup and the pain and equipment filters off", () => {
      const setList = generateWorkoutOf("TEST_WORKOUT");

      expect(setList.length).toBeGreaterThan(0);
      expect(generateSetListFromWorkout).toHaveBeenCalledTimes(1);
      const [workout, lookUpBranch, , options] = jest.mocked(
        generateSetListFromWorkout,
      ).mock.calls[0];
      expect(workout).toEqual(loadStrengthTestTemplate());
      expect(lookUpBranch).toBe(lookUpStoredBranchInCatalog);
      expect(options).toEqual({
        skillTrees: getAllSkillTrees(),
        filters: { pain: false, equipment: false },
      });
    });

    it("generates the stored day workout of a legacy plan with the lookup of its saved copies and every filter on", () => {
      const result = generatePlanWorkoutForWeekday(
        generateWarmUpOnlyPlanUser(),
      );

      expect(generateSetListFromWorkout).toHaveBeenCalledTimes(1);
      const [workout, lookUpBranch, , options] = jest.mocked(
        generateSetListFromWorkout,
      ).mock.calls[0];
      expect(options).toStrictEqual({
        skillTrees: expect.any(Object),
        filters: {},
      });
      expect(workout).toEqual({
        id: "TRAINING_DAY",
        blocks: [
          { kind: "branches", skill: "WU", branches: ["410"], duration: 300 },
        ],
      });
      expect(lookUpBranch).not.toBe(lookUpStoredBranchInCatalog);
      expect(result.map((entry) => entry.skill)).toContain("WU");
    });

    it("generates a training day stored as an AIWL workout with the catalog lookup", () => {
      const training = createAiwlTraining();
      const user = {
        ...generateWarmUpOnlyPlanUser(),
        trainingPlan: createAiwlPlan([training]),
      };

      const result = generatePlanWorkoutForWeekday(user);

      const [workout, lookUpBranch] = jest.mocked(generateSetListFromWorkout)
        .mock.calls[0];
      expect(workout).toEqual(training.workout);
      expect(lookUpBranch).toBe(lookUpStoredBranchInCatalog);
      expect(result.map((entry) => entry.branchId)).toContain("410");
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
      expect(generateSetListFromWorkout).not.toHaveBeenCalled();
    });
  });

  describe("plan training day", () => {
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
        expect(generateSetListFromWorkout).not.toHaveBeenCalled();
      },
    );
  });
});

describe("generateSetList: random source", () => {
  afterEach(jest.restoreAllMocks);

  it("draws from the random source the caller passes and never from Math.random", () => {
    const mathRandom = jest.spyOn(Math, "random");
    const random = jest.fn(generateSeededRandom(7));
    const request = generateHomeRequest("MOB");

    generateSetList(selectWorkout(request), request, { random });

    expect(random).toHaveBeenCalled();
    expect(mathRandom).not.toHaveBeenCalled();
  });

  it("returns the same set list for two runs with the same seed", () => {
    const request = generateHomeRequest("MOB");

    const first = generateSetList(selectWorkout(request), request, {
      random: generateSeededRandom(7),
    });
    const second = generateSetList(selectWorkout(request), request, {
      random: generateSeededRandom(7),
    });

    expect(second.setList).toEqual(first.setList);
  });
});

describe("generateSetList: progress per skill", () => {
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

describe("generateSetList: short workouts", () => {
  afterEach(jest.restoreAllMocks);
  afterEach(() => useCustomWorkoutsStore.getState().clearCustomWorkouts());
  afterEach(() => jest.useRealTimers());

  it("draws the block of the MOB template through the picks block handler", () => {
    const handlePicksBlock = jest.spyOn(picksHandler, "handlePicksBlock");

    const setList = generateWorkoutOf("MOB");

    expect(handlePicksBlock).toHaveBeenCalledTimes(1);
    expect(setList.length).toBeGreaterThan(0);
    expect(setList.every((entry) => entry.skill === "MOB")).toBe(true);
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

  it("throws the pain error with no regions for a custom workout without blocks and an athlete with knee pain", () => {
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(
        generateTemplate([], { id: "empty", name: { en: "Empty" } }),
        null,
      );
    const user: UserType = {
      ...generateWarmUpOnlyPlanUser(),
      workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: ["KNEE_LEFT"] } },
    };

    const request = generateHomeRequest(id, { user });

    expect(
      catchThrownValue(() =>
        generateSetList(selectWorkout(request), request, {
          random: () => Math.random(),
        }),
      ),
    ).toStrictEqual({ type: "NO_EXERCISES", subtype: "PAIN", params: [] });
  });

  it("keeps the cardio zone of a custom workout for an athlete with sore quadriceps", () => {
    // Muscle soreness counts on the day the factory dates it.
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
    const { id } = useCustomWorkoutsStore.getState().saveCustomWorkout(
      generateTemplate(
        [{ kind: "duration", skill: "CARDIO_2", duration: 1200 }],
        {
          id: "run",
          name: { en: "Run" },
        },
      ),
      null,
    );

    const request = generateHomeRequest(id, {
      user: generateAthlete({ soreMuscles: ["QUADRICEPS"] }),
      place: "STUDIO",
      equipment: ["TREADMILL"],
    });

    const { setList } = generateSetList(selectWorkout(request), request, {
      random: () => Math.random(),
    });

    expect([...new Set(setList.map((entry) => entry.skill))]).toEqual([
      "CARDIO_2",
    ]);
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

describe("selectWorkout: workout per training type", () => {
  afterEach(() => useCustomWorkoutsStore.getState().clearCustomWorkouts());

  it("returns the blocks of the scheduled plan day sorted by section order with no filters", () => {
    const training = createAiwlTraining({
      workout: {
        aiwl: 1,
        id: "TRAINING_DAY_1",
        name: { en: "Monday" },
        blocks: [
          generateBranchesBlock("GKS", ["510"]),
          generateBranchesBlock("WU", ["410"], { duration: 300 }),
        ],
      },
    });
    const user = {
      ...generateWarmUpOnlyPlanUser(),
      trainingPlan: createAiwlPlan([training]),
    };

    const selection = selectWorkout({
      type: "PLAN",
      user,
      weekday: 1,
      givenSection: undefined,
      daysSinceLastWorkout: 0,
    });

    expect(selection.workout.blocks.map((block) => block.skill)).toEqual([
      "WU",
      "GKS",
    ]);
    expect(selection.filters).toStrictEqual({});
  });

  it("returns the template object of a custom workout with the short workout filters", () => {
    const { id } = useCustomWorkoutsStore.getState().saveCustomWorkout(
      generateTemplate([generatePicksBlock("WU")], {
        id: "own",
        name: { en: "Own" },
      }),
      null,
    );

    const selection = selectWorkout({
      type: id,
      user: generateWarmUpOnlyPlanUser(),
      weekday: 1,
      givenSection: undefined,
      daysSinceLastWorkout: 0,
    });

    expect(selection.workout).toBe(lookupTemplate(id));
    expect(selection.filters).toBe(SHORT_WORKOUT_FILTERS);
  });

  it("returns the strength test template with the strength test filters", () => {
    const selection = selectWorkout({
      type: "TEST_WORKOUT",
      user: generateWarmUpOnlyPlanUser(),
      weekday: 1,
      givenSection: undefined,
      daysSinceLastWorkout: 0,
    });

    expect(selection.workout.id).toBe("TEST");
    expect(selection.filters).toBe(STRENGTH_TEST_FILTERS);
  });

  it("throws NO_EXERCISES for an unknown type with the type as param", () => {
    expect(
      catchThrownValue(() =>
        selectWorkout({
          type: "NO_SUCH_TYPE",
          user: generateWarmUpOnlyPlanUser(),
          weekday: 1,
          givenSection: undefined,
          daysSinceLastWorkout: 0,
        }),
      ),
    ).toStrictEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["NO_SUCH_TYPE"],
    });
  });

  it("throws the pain error for a custom workout without blocks", () => {
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(
        generateTemplate([], { id: "empty", name: { en: "Empty" } }),
        null,
      );

    expect(
      catchThrownValue(() =>
        selectWorkout({
          type: id,
          user: generateWarmUpOnlyPlanUser(),
          weekday: 1,
          givenSection: undefined,
          daysSinceLastWorkout: 0,
        }),
      ),
    ).toStrictEqual({ type: "NO_EXERCISES", subtype: "PAIN", params: [] });
  });
});

describe("generateSetList: replay of previous drawn blocks", () => {
  afterEach(jest.restoreAllMocks);
  afterEach(() => useCustomWorkoutsStore.getState().clearCustomWorkouts());

  const customTemplate = generateTemplate(
    [
      generatePicksBlock("WU", { picks: [{ tags: [], count: 2 }] }),
      generatePicksBlock("MOB", { picks: [{ tags: [], count: 2 }] }),
    ],
    { id: "own", name: { en: "Own" } },
  );

  it("runs the previous drawn blocks and returns their branches", () => {
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(customTemplate, null);
    const request = generateHomeRequest(id);
    const previousDrawnBlocks = [
      { block: generateBranchesBlock("WU", ["410"]), templateIndex: 0 },
    ];

    const { setList } = generateSetList(selectWorkout(request), request, {
      random: () => Math.random(),
      previousDrawnBlocks,
    });

    expect(setList.length).toBeGreaterThan(0);
    expect(setList.every((entry) => entry.branchId === "410")).toBe(true);
  });

  it("replaces a pain blocked drawn branch from the pool of its original pick only", () => {
    // Branch 523 trains the knee direction and knee pain blocks it. The knee
    // pick pool contains 518, 767 and 866 after the pain check; the hip pick
    // pool contains other branches.
    const template = generateTemplate(
      [
        generatePicksBlock("GKS", {
          picks: [{ tags: ["EXERCISE_DIRECTION_KNEE"], count: 1 }],
          fallbackToWholeTree: false,
        }),
        generatePicksBlock("GKS", {
          picks: [{ tags: ["EXERCISE_DIRECTION_HIP"], count: 1 }],
          fallbackToWholeTree: false,
        }),
      ],
      { id: "gks" },
    );
    const { id } = useCustomWorkoutsStore
      .getState()
      .saveCustomWorkout(template, null);
    const request = generateHomeRequest(id, {
      user: {
        ...generateWarmUpOnlyPlanUser(),
        workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: ["KNEE_LEFT"] } },
      },
      equipment: ["DUMBBELL", "BARBELL"],
    });
    const previousDrawnBlocks = [
      { block: generateBranchesBlock("GKS", ["523"]), templateIndex: 0 },
    ];

    const { setList } = generateSetList(selectWorkout(request), request, {
      random: () => 0.99,
      previousDrawnBlocks,
    });

    expect(["518", "767", "866"]).toContain(setList[0].branchId);
  });
});
