import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Block } from "@/schemas/aiwl.schema";
import { generateFilledResultFromCatalog } from "@test/factories/blockResult";
import { generateResolvedSelectionsBlock } from "@test/factories/resolvedSelectionsBlock";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { describeSetListEntries } from "@test/factories/setListDescription";
import {
  generateSelectionsBlock,
  generateUntimedBranchesBlock,
} from "@test/factories/templateBlock";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import type { ResolvedSelectionsBlock } from "../blockHandlers/selections/selectionsBlockResolution";
import { createEmptySelectionsWorkout } from "../blockHandlers/selections/selectionsWorkoutRules";
import type { GenerationInput } from "../generationInput/generationInput";
import { readSkillCatalogEntry } from "../generationInput/skillCatalogEntry";
import { resolveBlockTiming } from "../setListBuilders/blockTiming";
import type { BlockResult } from "./blockWalk";
import {
  createShortWorkoutSetListBuilder,
  createTrainingDaySetListBuilder,
  readSkillSetListKind,
} from "./setListBuilding";
import type { FilledBlockResult } from "./workoutFinish";

const EXERCISE_CATALOG = [
  generateTaggedExercise("e1", [
    "REGION_UPPER_BODY",
    "MUSCLE_CHEST",
    "SIDE_BOTH",
  ]),
  generateTaggedExercise("e2", [
    "REGION_UPPER_BODY",
    "MUSCLE_BICEPS",
    "SIDE_BOTH",
  ]),
  generateTaggedExercise("e3", [
    "REGION_LOWER_BODY",
    "MUSCLE_CALF",
    "SIDE_BOTH",
  ]),
];

// The advanced adult man of the rule family specs, whose catalog holds e1, e2
// and e3 and whose draws always return 0.
const DEFAULT_INPUT = generateRuleFamilyInput({
  exerciseCatalog: EXERCISE_CATALOG,
  random: () => 0,
});

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
  input = DEFAULT_INPUT,
): GeneratedSetListEntry[] =>
  createTrainingDaySetListBuilder(input)(results, results);

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
): ReadonlyMap<Block, ResolvedSelectionsBlock> =>
  new Map(
    results.map(({ block }) => [
      block,
      generateResolvedSelectionsBlock(
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
 * the selections workout.
 *
 * buildShortWorkoutSetList([WU block with e1, empty BAS block])
 * → [e1 set [1, 1], pause 30]
 */
const buildShortWorkoutSetList = (
  results: BlockResult[],
  input = DEFAULT_INPUT,
  resolvedBlocks = resolveCatalogTimings(results, input),
): GeneratedSetListEntry[] =>
  createShortWorkoutSetListBuilder({
    ...input,
    selectionsWorkout: {
      ...createEmptySelectionsWorkout(),
      blocks: resolvedBlocks,
    },
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
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("SASKG"),
        ["e1"],
      ),
    ]);

    expect(describeSetListEntries(setList)).toEqual([
      "e1 1/2",
      "pause 10",
      "e1 2/2",
    ]);
  });

  it("pairs a superset by muscles and rests within the superset", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("BAS"),
        ["e1", "e2"],
      ),
    ]);

    expect(describeSetListEntries(setList)).toEqual([
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
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("GKS"),
        ["e1", "e2"],
      ),
    ]);

    expect(describeSetListEntries(setList)).toEqual([
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
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("WUSPEZIAL"),
        ["e1"],
      ),
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("MOB"),
        ["e2"],
      ),
    ]);

    expect(describeSetListEntries(setList)).toEqual([
      "e1 1/1",
      "pause 30",
      "e2 1/1",
    ]);
  });

  it("takes the block's own rest before the plan workout value", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("GKS", { rest: { betweenSets: 15 } }),
        ["e1"],
      ),
    ]);

    expect(describeSetListEntries(setList)).toEqual([
      "e1 1/2",
      "pause 15",
      "e1 2/2",
    ]);
  });

  it("opens a block away from the exercise that ended the block before", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("GKS"),
        ["e1"],
      ),
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("GKSKG"),
        ["e1", "e2"],
      ),
    ]);

    expect(listExerciseOrder(setList.slice(4))).toEqual(["e2", "e1"]);
  });

  it("orders a max strength block lower body first", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("MAX"),
        ["e1", "e3"],
      ),
    ]);

    expect(listExerciseOrder(setList)).toEqual(["e3", "e1"]);
  });

  it("runs a cardio block for its stored duration", () => {
    const setList = buildTrainingDaySetList([
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("CARDIO_4", { duration: 1200 }),
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
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generateUntimedBranchesBlock("GKS"),
          ["e1", "e2"],
        ),
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generateUntimedBranchesBlock("CARDIO_4", { duration: 600 }),
          ["e1", "e2"],
        ),
      ],
      generateRuleFamilyInput({
        exerciseCatalog: EXERCISE_CATALOG,
        random: generateSequenceRandom([0, 0, 0.6]),
      }),
    );

    expect(setList.at(-1)).toMatchObject({ exerciseId: "e2", duration: 600 });
  });
});

describe("setListBuilding: short workout", () => {
  it("builds each block from its catalog timing and drops the last rest", () => {
    const setList = buildShortWorkoutSetList([
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateSelectionsBlock("WU"),
        ["e1"],
      ),
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateSelectionsBlock("BAS"),
        ["e2"],
      ),
    ]);

    expect(describeSetListEntries(setList)).toEqual([
      "e1 1/1",
      "pause 30",
      "e2 1/2",
      "pause 60",
      "e2 2/2",
    ]);
  });

  it("takes the block's superset before the catalog value", () => {
    const setList = buildShortWorkoutSetList([
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateSelectionsBlock("BAS", { superset: "none" }),
        ["e1", "e2"],
      ),
    ]);

    expect(describeSetListEntries(setList)).toEqual([
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
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateSelectionsBlock("WU"),
        ["e1"],
      ),
      {
        status: "empty",
        block: generateSelectionsBlock("BAS"),
        reason: undefined,
        usedBranchIds: [],
      },
    ]);

    expect(describeSetListEntries(setList)).toEqual(["e1 1/1", "pause 30"]);
  });

  it("builds a cardio block from the pairing without a draw", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generateSelectionsBlock("CARDIO_4", {
            sets: 1,
            superset: "none",
            rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
          }),
          ["e2", "e3"],
        ),
      ],
      generateRuleFamilyInput({
        exerciseCatalog: EXERCISE_CATALOG,
        random: generateSequenceRandom([]),
      }),
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
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateSelectionsBlock("MAX", {
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
    const result = generateFilledResultFromCatalog(
      EXERCISE_CATALOG,
      generateSelectionsBlock("WU"),
      ["e1"],
    );

    const setList = buildShortWorkoutSetList(
      [result],
      DEFAULT_INPUT,
      new Map([
        [
          result.block,
          generateResolvedSelectionsBlock("WU", {
            sets: 2,
            superset: "none",
            rest: { withinSuperset: 10, betweenSets: 15, afterExercise: 30 },
            setDuration: undefined,
            values: undefined,
          }),
        ],
      ]),
    );

    expect(describeSetListEntries(setList)).toEqual([
      "e1 1/2",
      "pause 15",
      "e1 2/2",
    ]);
  });

  it("throws for a block that workout setup did not resolve", () => {
    expect(() =>
      buildShortWorkoutSetList(
        [
          generateFilledResultFromCatalog(
            EXERCISE_CATALOG,
            generateSelectionsBlock("PLYO"),
            ["e1"],
          ),
        ],
        DEFAULT_INPUT,
        new Map(),
      ),
    ).toThrow(
      new Error("Workout setup resolved no selections block for skill PLYO"),
    );
  });
});
