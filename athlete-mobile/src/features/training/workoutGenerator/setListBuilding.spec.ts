import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Block } from "@/schemas/aiwl.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { generateSequenceRandom } from "../../../../test/factories/sequenceRandom";
import { type ResolvedBlockTiming, resolveBlockTiming } from "./blockTiming";
import type { BlockResult } from "./blockWalk";
import type { GenerationInput } from "./generationInput";
import type { ResolvedPicksBlock } from "./picksBlockResolution";
import { createEmptyPicksWorkout } from "./picksWorkoutRules";
import {
  createShortWorkoutSetListBuilder,
  createTrainingDaySetListBuilder,
  readSkillSetListKind,
} from "./setListBuilding";
import { readSkillCatalogEntry } from "./skillCatalogEntry";
import type { FilledBlockResult } from "./workoutFinish";

const EXERCISE_TAGS: Record<string, string[]> = {
  e1: ["REGION_UPPER_BODY", "MUSCLE_CHEST", "SIDE_BOTH"],
  e2: ["REGION_UPPER_BODY", "MUSCLE_BICEPS", "SIDE_BOTH"],
  e3: ["REGION_LOWER_BODY", "MUSCLE_CALF", "SIDE_BOTH"],
};

/**
 * Builds a catalog exercise advanced by repetitions with the tags of its ID.
 *
 * generateExercise("e1")
 * → { id: "e1", tags: ["REGION_UPPER_BODY", "MUSCLE_CHEST", "SIDE_BOTH"], isAdvanceByReps: true, ... }
 */
const generateExercise = (id: string): ExerciseType => ({
  id,
  name: id,
  displayName: id,
  description: id,
  picture: `${id}.jpg`,
  video: `${id}.mp4`,
  level: { m: 1, w: 1 },
  tags: EXERCISE_TAGS[id],
  isAdvanceByReps: true,
  isAdvanceByDuration: false,
  isJump: false,
  values: {},
});

/**
 * Builds the input of an advanced adult man whose catalog holds e1, e2 and e3.
 *
 * generateInput(() => 0.6) → { exerciseCatalog: [e1, e2, e3], random: () => 0.6, ... }
 */
const generateInput = (random: () => number = () => 0): GenerationInput => ({
  ...generateRuleFamilyInput({
    exerciseCatalog: ["e1", "e2", "e3"].map(generateExercise),
  }),
  random,
});

/**
 * Builds a filled result whose branches resolve to the given exercise IDs.
 *
 * generateFilledResult({ kind: "branches", skill: "GKS", ... }, ["e1"])
 * → { status: "filled", block, usedBranchIds: ["be1"],
 *     exercises: [{ branchId: "be1", branchTags: [...], exerciseId: "e1" }] }
 */
const generateFilledResult = (
  block: Block,
  exerciseIds: string[],
): FilledBlockResult => ({
  status: "filled",
  block,
  usedBranchIds: exerciseIds.map((id) => `b${id}`),
  exercises: exerciseIds.map((id) => ({
    branchId: `b${id}`,
    branchTags: EXERCISE_TAGS[id],
    exerciseId: id,
  })),
});

/**
 * Builds a stored training day block of the skill.
 *
 * generateBranchesBlock("GKS", { sets: 3 }) → { kind: "branches", skill: "GKS", branches: ["1"], sets: 3 }
 */
const generateBranchesBlock = (
  skill: string,
  values: Partial<Extract<Block, { kind: "branches" }>> = {},
): Block => ({ kind: "branches", skill, branches: ["1"], ...values });

/**
 * Builds a short workout block of the skill.
 *
 * generatePicksBlock("BAS") → { kind: "picks", skill: "BAS", picks: [{ tags: [], count: 1 }] }
 */
const generatePicksBlock = (
  skill: string,
  values: Partial<Extract<Block, { kind: "picks" }>> = {},
): Block => ({
  kind: "picks",
  skill,
  picks: [{ tags: [], count: 1 }],
  ...values,
});

/**
 * Lists each entry as "<exercise> <set>/<sets>" or "pause <seconds>".
 *
 * describeSetList([e1 set [1, 2], pause 90]) → ["e1 1/2", "pause 90"]
 */
const describeSetList = (setList: GeneratedSetListEntry[]): string[] =>
  setList.map((entry) =>
    isPauseExercise(entry.exerciseId)
      ? `pause ${entry.duration}`
      : `${entry.exerciseId} ${entry.set.join("/")}`,
  );

/**
 * Lists the exercises of a set list in order of their first set.
 *
 * listExerciseOrder([e3 1/4, pause 60, e3 2/4, e1 1/4]) → ["e3", "e1"]
 */
const listExerciseOrder = (setList: GeneratedSetListEntry[]): string[] => [
  ...new Set(
    setList
      .filter((entry) => !isPauseExercise(entry.exerciseId))
      .map((entry) => entry.exerciseId),
  ),
];

/**
 * Builds the set list of training day blocks handed over in section order.
 *
 * buildTrainingDaySetList([SASKG block with e1])
 * → [e1 set [1, 2], pause 10, e1 set [2, 2]]
 */
const buildTrainingDaySetList = (
  results: FilledBlockResult[],
  input = generateInput(),
): GeneratedSetListEntry[] =>
  createTrainingDaySetListBuilder(input)(results, results);

/**
 * Builds a resolved picks block with the given timing and an empty pool.
 *
 * generateResolvedPicksBlock("WU", { sets: 2, superset: "none", rest: {...} })
 * → { skill: "WU", sets: 2, superset: "none", rest: {...}, pool: {}, picks: [], ... }
 */
const generateResolvedPicksBlock = (
  skill: string,
  timing: ResolvedBlockTiming,
): ResolvedPicksBlock => ({
  ...timing,
  skill,
  pool: {},
  picks: [],
  countBy: "exercises",
  fallbackToWholeTree: false,
});

/**
 * Resolves each block of the results as workout setup does: its own timing,
 * then the skill catalog entry.
 *
 * resolveCatalogTimings([WU block with e1], input)
 * → Map { WU block → { skill: "WU", sets: 1, superset: "muscles", ... } }
 */
const resolveCatalogTimings = (
  results: BlockResult[],
  input: GenerationInput,
): ReadonlyMap<Block, ResolvedPicksBlock> =>
  new Map(
    results.map(({ block }) => [
      block,
      generateResolvedPicksBlock(
        block.skill,
        resolveBlockTiming(
          block,
          readSkillCatalogEntry(input.skillCatalog, block.skill),
        ),
      ),
    ]),
  );

/**
 * Builds the set list of short workout block results in template order; the
 * builder gets the filled ones as its blocks and reads the resolved blocks of
 * the picks workout.
 *
 * buildShortWorkoutSetList([WU block with e1, empty BAS block])
 * → [e1 set [1, 1], pause 30]
 */
const buildShortWorkoutSetList = (
  results: BlockResult[],
  input = generateInput(),
  resolvedBlocks = resolveCatalogTimings(results, input),
): GeneratedSetListEntry[] =>
  createShortWorkoutSetListBuilder({
    ...input,
    picksWorkout: { ...createEmptyPicksWorkout(), blocks: resolvedBlocks },
  })(
    results.filter(
      (result): result is FilledBlockResult => result.status === "filled",
    ),
    results,
  );

describe("setListBuilding: readSkillSetListKind", () => {
  it.each([
    ["CARDIO_2", "cardio"],
    ["CARDIO_5", "cardio"],
    ["MAX", "maxStrength"],
    ["MAX_STRENGTH", "maxStrength"],
    ["SASKG", "standard"],
    ["WUSPEZIAL", "standard"],
  ])("builds %s with the %s builder", (skill, kind) => {
    expect(readSkillSetListKind(skill)).toBe(kind);
  });
});

describe("setListBuilding: training day", () => {
  it("builds SASKG from its plan workout values: 2 sets with 10 seconds rest", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResult(generateBranchesBlock("SASKG"), ["e1"]),
    ]);

    expect(describeSetList(setList)).toEqual(["e1 1/2", "pause 10", "e1 2/2"]);
  });

  it("pairs a superset by muscles and rests within the superset", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResult(generateBranchesBlock("BAS"), ["e1", "e2"]),
    ]);

    expect(describeSetList(setList)).toEqual([
      "e1 1/2",
      "pause 30",
      "e2 1/2",
      "pause 30",
      "e1 2/2",
      "pause 30",
      "e2 2/2",
    ]);
  });

  it("builds single exercises for a skill without superset", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResult(generateBranchesBlock("GKS"), ["e1", "e2"]),
    ]);

    expect(describeSetList(setList)).toEqual([
      "e1 1/2",
      "pause 90",
      "e1 2/2",
      "pause 60",
      "e2 1/2",
      "pause 90",
      "e2 2/2",
    ]);
  });

  it("closes a block with the catalog afterBlock rest", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResult(generateBranchesBlock("WUSPEZIAL"), ["e1"]),
      generateFilledResult(generateBranchesBlock("MOB"), ["e2"]),
    ]);

    expect(describeSetList(setList)).toEqual(["e1 1/1", "pause 30", "e2 1/1"]);
  });

  it("takes the block's own rest before the plan workout value", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResult(
        generateBranchesBlock("GKS", { rest: { betweenSets: 15 } }),
        ["e1"],
      ),
    ]);

    expect(describeSetList(setList)).toEqual(["e1 1/2", "pause 15", "e1 2/2"]);
  });

  it("opens a block away from the exercise that ended the block before", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResult(generateBranchesBlock("GKS"), ["e1"]),
      generateFilledResult(generateBranchesBlock("GKSKG"), ["e1", "e2"]),
    ]);

    expect(listExerciseOrder(setList.slice(4))).toEqual(["e2", "e1"]);
  });

  it("orders a max strength block lower body first", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResult(generateBranchesBlock("MAX"), ["e1", "e3"]),
    ]);

    expect(listExerciseOrder(setList)).toEqual(["e3", "e1"]);
  });

  it("runs a cardio block for its stored duration", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResult(
        generateBranchesBlock("CARDIO_4", { duration: 1200 }),
        ["e1"],
      ),
    ]);

    expect(setList).toEqual([
      {
        branchId: "be1",
        exerciseId: "e1",
        set: [1, 1],
        skill: "CARDIO_4",
        duration: 1200,
      },
    ]);
  });

  it("draws the cardio branch after the order draws of the block before", () => {
    const setList = buildTrainingDaySetList(
      [
        generateFilledResult(generateBranchesBlock("GKS"), ["e1", "e2"]),
        generateFilledResult(
          generateBranchesBlock("CARDIO_4", { duration: 600 }),
          ["e1", "e2"],
        ),
      ],
      generateInput(generateSequenceRandom([0, 0, 0.6])),
    );

    expect(setList.at(-1)).toMatchObject({ exerciseId: "e2", duration: 600 });
  });
});

describe("setListBuilding: short workout", () => {
  it("builds each block from its catalog timing and drops the last rest", () => {
    const setList = buildShortWorkoutSetList([
      generateFilledResult(generatePicksBlock("WU"), ["e1"]),
      generateFilledResult(generatePicksBlock("BAS"), ["e2"]),
    ]);

    expect(describeSetList(setList)).toEqual([
      "e1 1/1",
      "pause 30",
      "e2 1/2",
      "pause 60",
      "e2 2/2",
    ]);
  });

  it("takes the block's superset before the catalog value", () => {
    const setList = buildShortWorkoutSetList([
      generateFilledResult(generatePicksBlock("BAS", { superset: "none" }), [
        "e1",
        "e2",
      ]),
    ]);

    expect(describeSetList(setList)).toEqual([
      "e1 1/2",
      "pause 60",
      "e1 2/2",
      "pause 60",
      "e2 1/2",
      "pause 60",
      "e2 2/2",
    ]);
  });

  it("keeps the closing rest when the last template block is empty", () => {
    const setList = buildShortWorkoutSetList([
      generateFilledResult(generatePicksBlock("WU"), ["e1"]),
      {
        status: "empty",
        block: generatePicksBlock("BAS"),
        reason: undefined,
        usedBranchIds: [],
      },
    ]);

    expect(describeSetList(setList)).toEqual(["e1 1/1", "pause 30"]);
  });

  it("builds a cardio block from the pairing without a draw", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResult(
          generatePicksBlock("CARDIO_4", {
            sets: 1,
            superset: "none",
            rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
          }),
          ["e2", "e3"],
        ),
      ],
      generateInput(generateSequenceRandom([])),
    );

    expect(setList).toEqual([
      {
        branchId: "be3",
        exerciseId: "e3",
        set: [1, 1],
        skill: "CARDIO_4",
        duration: 0,
      },
    ]);
  });

  it("pairs a max strength block by its superset and trains the lead only", () => {
    const setList = buildShortWorkoutSetList([
      generateFilledResult(
        generatePicksBlock("MAX", {
          sets: 4,
          superset: "muscles",
          rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 180 },
        }),
        ["e1", "e2"],
      ),
    ]);

    expect(listExerciseOrder(setList)).toEqual(["e1"]);
  });

  it("builds a block from the timing workout setup resolved", () => {
    const result = generateFilledResult(generatePicksBlock("WU"), ["e1"]);

    const setList = buildShortWorkoutSetList(
      [result],
      generateInput(),
      new Map([
        [
          result.block,
          generateResolvedPicksBlock("WU", {
            sets: 2,
            superset: "none",
            rest: { withinSuperset: 10, betweenSets: 15, afterExercise: 30 },
            setDuration: undefined,
            values: undefined,
          }),
        ],
      ]),
    );

    expect(describeSetList(setList)).toEqual(["e1 1/2", "pause 15", "e1 2/2"]);
  });

  it("throws for a block that workout setup did not resolve", () => {
    expect(() =>
      buildShortWorkoutSetList(
        [generateFilledResult(generatePicksBlock("PLYO"), ["e1"])],
        generateInput(),
        new Map(),
      ),
    ).toThrow(
      new Error("Workout setup resolved no picks block for skill PLYO"),
    );
  });
});
