import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { Block } from "@/schemas/aiwl.schema";
import { generateFilledResultFromCatalog } from "@test/factories/blockResult";
import { generateResolvedPicksBlock } from "@test/factories/resolvedPicksBlock";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { describeSetListEntries } from "@test/factories/setListDescription";
import { generateStrengthTestInput } from "@test/factories/strengthTestInput";
import { generatePrescribedResult } from "@test/factories/strengthTestResult";
import {
  generatePicksBlock,
  generateUntimedBranchesBlock,
} from "@test/factories/templateBlock";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import type { ResolvedPicksBlock } from "../blockHandlers/picks/picksBlockResolution";
import { createEmptyPicksWorkout } from "../blockHandlers/picks/picksWorkoutRules";
import type { GenerationInput } from "../generationInput/generationInput";
import { readSkillCatalogEntry } from "../generationInput/skillCatalogEntry";
import { resolveBlockTiming } from "../setListBuilders/blockTiming";
import type { PrescribedSetListBuilder } from "../setListBuilders/setListBuilder";
import type { BlockResult } from "./blockWalk";
import {
  createSetListBuilder,
  readSkillSetListKind,
  SHORT_WORKOUT_SET_LIST_RULES,
  type SetListBuildingRules,
  STRENGTH_TEST_SET_LIST_RULES,
  TRAINING_DAY_SET_LIST_RULES,
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

// A prescribed builder that reads no block setting and builds no entry.
const NO_SETTINGS_BUILDER: PrescribedSetListBuilder = {
  blockSettings: [],
  build: () => [],
};

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
 * Builds the set list of training day blocks handed over in section order,
 * by the training day rules unless the rules argument replaces them.
 *
 * buildTrainingDaySetList([SASKG block with e1])
 * → [e1 set [1, 2], pause 10, e1 set [2, 2]]
 */
const buildTrainingDaySetList = (
  results: FilledBlockResult[],
  input = DEFAULT_INPUT,
  rules: SetListBuildingRules = TRAINING_DAY_SET_LIST_RULES,
): GeneratedSetListEntry[] =>
  createSetListBuilder(
    { ...input, picksWorkout: createEmptyPicksWorkout() },
    rules,
  )(results, results);

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
    results.flatMap(({ block }) =>
      block.kind === "exercises"
        ? []
        : [
            [
              block,
              generateResolvedPicksBlock(
                block.skill,
                resolveBlockTiming(
                  block,
                  readSkillCatalogEntry(input.skillCatalog, block.skill),
                ),
              ),
            ] as const,
          ],
    ),
  );

/**
 * Builds the set list of short workout block results in template order, by
 * the short workout rules unless the rules argument replaces them; the
 * builder gets the filled ones as its blocks and reads the resolved blocks of
 * the picks workout.
 *
 * buildShortWorkoutSetList([WU block with e1, empty BAS block])
 * → [e1 set [1, 1], pause 30]
 */
const buildShortWorkoutSetList = (
  results: BlockResult[],
  input = DEFAULT_INPUT,
  resolvedBlocks = resolveCatalogTimings(results, input),
  rules: SetListBuildingRules = SHORT_WORKOUT_SET_LIST_RULES,
): GeneratedSetListEntry[] =>
  createSetListBuilder(
    {
      ...input,
      picksWorkout: { ...createEmptyPicksWorkout(), blocks: resolvedBlocks },
    },
    rules,
  )(
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
  it("builds SASKG from its training day defaults: 2 sets with 10 seconds rest", () => {
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

  it("takes the block's own rest before the training day default", () => {
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
        generatePicksBlock("WU"),
        ["e1"],
      ),
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generatePicksBlock("BAS"),
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
        generatePicksBlock("BAS", { superset: "none" }),
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
        generatePicksBlock("WU"),
        ["e1"],
      ),
      {
        status: "empty",
        block: generatePicksBlock("BAS"),
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
          generatePicksBlock("CARDIO_4", {
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
    const result = generateFilledResultFromCatalog(
      EXERCISE_CATALOG,
      generatePicksBlock("WU"),
      ["e1"],
    );

    const setList = buildShortWorkoutSetList(
      [result],
      DEFAULT_INPUT,
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

    expect(describeSetListEntries(setList)).toEqual([
      "e1 1/2",
      "pause 15",
      "e1 2/2",
    ]);
  });

  it("builds a branches block from the skill catalog timing without a resolved picks block", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generateUntimedBranchesBlock("BAS"),
          ["e2"],
        ),
      ],
      DEFAULT_INPUT,
      new Map(),
    );

    expect(describeSetListEntries(setList)).toEqual([
      "e2 1/2",
      "pause 60",
      "e2 2/2",
    ]);
  });

  it("takes the values of a branches block before the skill catalog", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generateUntimedBranchesBlock("BAS", {
            sets: 3,
            rest: { betweenSets: 15 },
          }),
          ["e2"],
        ),
      ],
      DEFAULT_INPUT,
      new Map(),
    );

    expect(describeSetListEntries(setList)).toEqual([
      "e2 1/3",
      "pause 15",
      "e2 2/3",
      "pause 15",
      "e2 3/3",
    ]);
  });

  it("runs a cardio branches block without timing values for its stored duration", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generateUntimedBranchesBlock("CARDIO_4", { duration: 1200 }),
          ["e2"],
        ),
      ],
      DEFAULT_INPUT,
      new Map(),
    );

    expect(setList).toEqual([
      {
        branchId: "be2",
        exerciseId: "e2",
        set: [1, 1],
        skill: "CARDIO_4",
        duration: 1200,
      },
    ]);
  });

  // The ladder sets the count: two warm up sets, then the working sets
  it("builds a max strength branches block without timing values by its ladder", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generateUntimedBranchesBlock("MAX_STRENGTH"),
          ["e2"],
        ),
      ],
      DEFAULT_INPUT,
      new Map(),
    );

    expect(
      describeSetListEntries(setList).filter((entry) =>
        entry.startsWith("e2 "),
      ),
    ).toEqual(["e2 1/5", "e2 2/5", "e2 3/5", "e2 4/5", "e2 5/5"]);
  });

  it("builds a picks block and a branches block of one workout from their own timing", () => {
    const picksResult = generateFilledResultFromCatalog(
      EXERCISE_CATALOG,
      generatePicksBlock("WU"),
      ["e1"],
    );
    const branchesResult = generateFilledResultFromCatalog(
      EXERCISE_CATALOG,
      generateUntimedBranchesBlock("BAS"),
      ["e2"],
    );

    const setList = buildShortWorkoutSetList(
      [picksResult, branchesResult],
      DEFAULT_INPUT,
      resolveCatalogTimings([picksResult], DEFAULT_INPUT),
    );

    expect(describeSetListEntries(setList)).toEqual([
      "e1 1/1",
      "pause 30",
      "e2 1/2",
      "pause 60",
      "e2 2/2",
    ]);
  });

  it("throws for a block that workout setup did not resolve", () => {
    expect(() =>
      buildShortWorkoutSetList(
        [
          generateFilledResultFromCatalog(
            EXERCISE_CATALOG,
            generatePicksBlock("PLYO"),
            ["e1"],
          ),
        ],
        DEFAULT_INPUT,
        new Map(),
      ),
    ).toThrow(
      new Error("Workout setup resolved no picks block for skill PLYO"),
    );
  });
});

describe("setListBuilding: strength test", () => {
  it("keeps the list order of the prescribed exercises without pairing or ordering them", () => {
    const results = [generatePrescribedResult("TEST", ["54", "25"])];
    const listBuilder: PrescribedSetListBuilder = {
      blockSettings: [],
      build: (exercises, block) =>
        exercises.map(({ exerciseId }) => ({
          branchId: "-1",
          exerciseId,
          set: [1, 1],
          skill: block.skill,
        })),
    };

    const setList = createSetListBuilder(
      {
        ...generateStrengthTestInput({ random: () => 0 }),
        picksWorkout: createEmptyPicksWorkout(),
      },
      TRAINING_DAY_SET_LIST_RULES,
      { TEST: listBuilder },
    )(results, results);

    expect(listExerciseOrder(setList)).toEqual(["54", "25"]);
  });

  it("throws an error naming the skill for a prescribed result whose skill has no strength test builder", () => {
    const results = [generatePrescribedResult("GKS", ["25"])];

    expect(() =>
      createSetListBuilder(
        {
          ...generateStrengthTestInput(),
          picksWorkout: createEmptyPicksWorkout(),
        },
        STRENGTH_TEST_SET_LIST_RULES,
      )(results, results),
    ).toThrow(/GKS/);
  });

  it("throws for a prescribed result of skill TEST when the source passes no strength test builder", () => {
    const results = [generatePrescribedResult("TEST", ["25"])];

    expect(() =>
      createSetListBuilder(
        {
          ...generateStrengthTestInput(),
          picksWorkout: createEmptyPicksWorkout(),
        },
        STRENGTH_TEST_SET_LIST_RULES,
      )(results, results),
    ).toThrow("TEST: the source passed no prescribed builder");
  });

  it("throws for a block setting the strength test builder does not read", () => {
    const results = [
      generatePrescribedResult("TEST", ["25"], {
        sets: 9,
        rest: { betweenSets: 5 },
      }),
    ];

    expect(() =>
      createSetListBuilder(
        {
          ...generateStrengthTestInput(),
          picksWorkout: createEmptyPicksWorkout(),
        },
        STRENGTH_TEST_SET_LIST_RULES,
        { TEST: NO_SETTINGS_BUILDER },
      )(results, results),
    ).toThrow("TEST: its prescribed builder does not read sets, rest");
  });

  it("reads the builder of a prescribed result by its skill from the builders the source passes", () => {
    const results = [generatePrescribedResult("MAX", ["25"], { sets: 9 })];

    expect(() =>
      createSetListBuilder(
        {
          ...generateStrengthTestInput(),
          picksWorkout: createEmptyPicksWorkout(),
        },
        TRAINING_DAY_SET_LIST_RULES,
        { MAX: NO_SETTINGS_BUILDER },
      )(results, results),
    ).toThrow("MAX: its prescribed builder does not read sets");
  });

  it("builds every block setting a prescribed builder reads", () => {
    const results = [generatePrescribedResult("TEST", ["25"], { sets: 2 })];
    const setsBuilder: PrescribedSetListBuilder = {
      blockSettings: ["sets"],
      build: (exercises, block) =>
        exercises.map(({ exerciseId }) => ({
          branchId: "-1",
          exerciseId,
          set: [1, block.sets ?? 1],
          skill: block.skill,
        })),
    };

    const setList = createSetListBuilder(
      {
        ...generateStrengthTestInput(),
        picksWorkout: createEmptyPicksWorkout(),
      },
      STRENGTH_TEST_SET_LIST_RULES,
      { TEST: setsBuilder },
    )(results, results);

    expect(describeSetListEntries(setList)).toEqual(["25 1/2"]);
  });

  it("throws for a filled block of a skill the source passes a prescribed builder for", () => {
    const results = [
      generateFilledResultFromCatalog(
        EXERCISE_CATALOG,
        generateUntimedBranchesBlock("TEST"),
        ["e1"],
      ),
    ];

    expect(() =>
      createSetListBuilder(
        {
          ...generateStrengthTestInput({ exerciseCatalog: EXERCISE_CATALOG }),
          picksWorkout: createEmptyPicksWorkout(),
        },
        STRENGTH_TEST_SET_LIST_RULES,
        { TEST: NO_SETTINGS_BUILDER },
      )(results, results),
    ).toThrow("TEST: its prescribed builder builds exercises blocks only");
  });
});

describe("setListBuilding: rules", () => {
  it("reads the training day defaults for blockTiming trainingDayDefaults", () => {
    const result = generateFilledResultFromCatalog(
      EXERCISE_CATALOG,
      generatePicksBlock("WU"),
      ["e1"],
    );

    const setList = buildShortWorkoutSetList(
      [result],
      DEFAULT_INPUT,
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
      { ...SHORT_WORKOUT_SET_LIST_RULES, blockTiming: "trainingDayDefaults" },
    );

    expect(describeSetListEntries(setList)).toEqual(["e1 1/1"]);
  });

  it("reads the timing workout setup resolved for a picks block with blockTiming workoutSetup", () => {
    expect(() =>
      buildTrainingDaySetList(
        [
          generateFilledResultFromCatalog(
            EXERCISE_CATALOG,
            generatePicksBlock("GKS"),
            ["e1"],
          ),
        ],
        DEFAULT_INPUT,
        { ...TRAINING_DAY_SET_LIST_RULES, blockTiming: "workoutSetup" },
      ),
    ).toThrow(new Error("Workout setup resolved no picks block for skill GKS"));
  });

  it("draws one cardio pair for cardioPairing drawOne", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generatePicksBlock("CARDIO_4", {
            sets: 1,
            superset: "none",
            rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 10 },
          }),
          ["e2", "e3"],
        ),
      ],
      generateRuleFamilyInput({
        exerciseCatalog: EXERCISE_CATALOG,
        random: generateSequenceRandom([0]),
      }),
      undefined,
      { ...SHORT_WORKOUT_SET_LIST_RULES, cardioPairing: "drawOne" },
    );

    expect(setList).toEqual([
      {
        branchId: "be2",
        exerciseId: "e2",
        set: [1, 1],
        skill: "CARDIO_4",
        duration: 0,
      },
    ]);
  });

  it("trains every max strength exercise on its own for maxStrengthPairing singles", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generatePicksBlock("MAX", {
            sets: 4,
            superset: "muscles",
            rest: { withinSuperset: 10, betweenSets: 10, afterExercise: 180 },
          }),
          ["e1", "e2"],
        ),
      ],
      DEFAULT_INPUT,
      undefined,
      { ...SHORT_WORKOUT_SET_LIST_RULES, maxStrengthPairing: "singles" },
    );

    expect(listExerciseOrder(setList)).toEqual(["e1", "e2"]);
  });

  it("opens a block away from the block before for exerciseOrder awayFromPreviousBlock", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generatePicksBlock("GKS"),
          ["e1"],
        ),
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generatePicksBlock("GKSKG"),
          ["e1", "e2"],
        ),
      ],
      DEFAULT_INPUT,
      undefined,
      {
        ...SHORT_WORKOUT_SET_LIST_RULES,
        exerciseOrder: "awayFromPreviousBlock",
      },
    );

    expect(listExerciseOrder(setList.slice(4))).toEqual(["e2", "e1"]);
  });

  it("keeps the pair order for exerciseOrder asPaired", () => {
    const setList = buildTrainingDaySetList(
      [
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
      ],
      DEFAULT_INPUT,
      { ...TRAINING_DAY_SET_LIST_RULES, exerciseOrder: "asPaired" },
    );

    expect(listExerciseOrder(setList.slice(4))).toEqual(["e1", "e2"]);
  });

  it("drops the rest at the end of the set list for closingRest setListEnd", () => {
    const setList = buildShortWorkoutSetList(
      [
        generateFilledResultFromCatalog(
          EXERCISE_CATALOG,
          generatePicksBlock("WU"),
          ["e1"],
        ),
        {
          status: "empty",
          block: generatePicksBlock("BAS"),
          reason: undefined,
          usedBranchIds: [],
        },
      ],
      DEFAULT_INPUT,
      undefined,
      { ...SHORT_WORKOUT_SET_LIST_RULES, closingRest: "setListEnd" },
    );

    expect(describeSetListEntries(setList)).toEqual(["e1 1/1"]);
  });

  it("keeps the rest before an empty last template block for closingRest lastTemplateBlock", () => {
    const filled = generateFilledResultFromCatalog(
      EXERCISE_CATALOG,
      generateUntimedBranchesBlock("WU"),
      ["e1"],
    );

    const setList = createSetListBuilder(
      { ...DEFAULT_INPUT, picksWorkout: createEmptyPicksWorkout() },
      { ...TRAINING_DAY_SET_LIST_RULES, closingRest: "lastTemplateBlock" },
    )(
      [filled],
      [
        filled,
        {
          status: "empty",
          block: generateUntimedBranchesBlock("CD"),
          reason: undefined,
          usedBranchIds: [],
        },
      ],
    );

    expect(describeSetListEntries(setList)).toEqual(["e1 1/1", "pause 30"]);
  });
});
