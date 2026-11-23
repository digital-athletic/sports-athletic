import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { DrawnBlock } from "@/features/training/workoutGenerator/replacementPools";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import {
  SHORT_WORKOUT_FILTERS,
  type WorkoutGenerationRequest,
  type WorkoutSelection,
} from "@/features/training/workoutGeneratorRouter";
import type { Block, Template } from "@/schemas/aiwl.schema";
import { generateAthlete } from "@test/factories/athlete";
import {
  generateBlockResult,
  generateFilledBlockResult,
} from "@test/factories/blockResult";
import { generateBranchReference } from "@test/factories/branchReference";
import { generateBranchLevel } from "@test/factories/generationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import {
  generateSetListFromDrawnWorkout,
  readDrawnBlocks,
  type DrawnWorkout,
} from "./drawnWorkout";

/**
 * Builds the request of an advanced athlete at home. The overrides replace
 * any field.
 *
 * generateRequest({ equipment: ["BARBELL"] })
 * → { type: "own", place: "HOME", equipment: ["BARBELL"], user: <advanced athlete>, ... }
 */
const generateRequest = (
  overrides: Partial<WorkoutGenerationRequest> = {},
): WorkoutGenerationRequest => ({
  type: "own",
  user: generateAthlete(),
  place: "HOME",
  exercises: loadExercises(),
  skillTrees: getAllSkillTrees(),
  weekday: 1,
  equipment: ["DUMBBELL", "BARBELL", "RACK", "BENCH"],
  givenSection: undefined,
  daysSinceLastWorkout: 0,
  userExerciseData: { exerciseData: {}, branchData: {} },
  ...overrides,
});

/**
 * Builds the selection the router makes for a custom workout template.
 *
 * generateSelection(template)
 * → { workout: template, lookUpBranch: lookUpStoredBranchInCatalog, filters: SHORT_WORKOUT_FILTERS }
 */
const generateSelection = (template: Template): WorkoutSelection => ({
  workout: template,
  lookUpBranch: lookUpStoredBranchInCatalog,
  filters: SHORT_WORKOUT_FILTERS,
});

/**
 * Builds a template of a core block with three picks and a push block with
 * two picks.
 *
 * generateStrengthTemplate()
 * → blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 3 }] },
 *            { kind: "picks", skill: "SWR1", picks: [{ tags: [], count: 2 }] }]
 */
const generateStrengthTemplate = (): Template =>
  generateTemplate([
    generatePicksBlock("GKS", { picks: [{ tags: [], count: 3 }] }),
    generatePicksBlock("SWR1", { picks: [{ tags: [], count: 2 }] }),
  ]);

/**
 * Builds the drawn workout of a template from drawn blocks.
 *
 * generateDrawnWorkout(template, [{ block: gksBlock, templateIndex: 0 }])
 * → { templateBlocks: '[{"kind":"picks",...}]', drawnBlocks: [{ block: gksBlock, templateIndex: 0 }] }
 */
const generateDrawnWorkout = (
  template: Template,
  drawnBlocks: DrawnBlock[],
): DrawnWorkout => ({
  templateBlocks: JSON.stringify(template.blocks),
  drawnBlocks,
});

/**
 * Lists the distinct branch IDs of a skill in a set list, sorted and without
 * pauses.
 *
 * listBranchIdsOfSkill(setList, "GKS") → ["510", "522", "523"]
 */
const listBranchIdsOfSkill = (
  setList: GeneratedSetListEntry[],
  skill: string,
): string[] =>
  [
    ...new Set(
      setList
        .filter((entry) => entry.skill === skill && entry.branchId !== "-1")
        .map((entry) => entry.branchId),
    ),
  ].sort();

/**
 * Lists the skills of a set list in order of first appearance.
 *
 * listSkills(setList) → ["GKS", "SWR1"]
 */
const listSkills = (setList: GeneratedSetListEntry[]): string[] => [
  ...new Set(setList.map((entry) => entry.skill)),
];

/**
 * Lists the superset pairs of a skill from the entries of its first set, two
 * entries per pair, each pair sorted and the list sorted.
 *
 * listPairsOfSkill(setList, "GKS") → ["510+523", "520+520"]
 */
const listPairsOfSkill = (
  setList: GeneratedSetListEntry[],
  skill: string,
): string[] => {
  const firstSetBranchIds = setList
    .filter(
      (entry) =>
        entry.skill === skill && entry.branchId !== "-1" && entry.set[0] === 1,
    )
    .map((entry) => entry.branchId);
  const pairs: string[] = [];
  for (let index = 0; index < firstSetBranchIds.length; index += 2) {
    pairs.push(
      firstSetBranchIds
        .slice(index, index + 2)
        .sort()
        .join("+"),
    );
  }
  return pairs.sort();
};

/**
 * Seeds Math.random, which the random source of each start reads.
 *
 * seedRandom(7) → the next draws are the seed 7 sequence
 */
const seedRandom = (seed: number) =>
  jest.spyOn(Math, "random").mockImplementation(generateSeededRandom(seed));

afterEach(jest.restoreAllMocks);

describe("drawnWorkout: readDrawnBlocks", () => {
  it("reads the distinct branch IDs of a block in draw order", () => {
    const template = generateTemplate([generatePicksBlock("GKS")]);
    const result = generateBlockResult("filled", {
      block: template.blocks[0] as ReturnType<typeof generatePicksBlock>,
      exercises: [
        generateBranchReference("523"),
        generateBranchReference("510"),
        generateBranchReference("510"),
        generateBranchReference("520"),
      ],
    });

    const blocks = readDrawnBlocks({ blocks: [result], setList: [] }, template);

    expect(blocks.map(({ block }) => block.branches)).toEqual([
      ["523", "510", "520"],
    ]);
  });

  // The template starts with a mobility block, so the template index is 1.
  it.each<[string, Block, DrawnBlock]>([
    [
      "copies the timing fields of a picks block",
      generatePicksBlock("GKS", {
        sets: 4,
        setDuration: 40,
        values: "exercise",
        rest: { withinSuperset: 10, betweenSets: 45, afterExercise: 60 },
        superset: "drawOrder",
      }),
      {
        block: {
          kind: "branches",
          skill: "GKS",
          branches: ["510"],
          sets: 4,
          setDuration: 40,
          values: "exercise",
          rest: { withinSuperset: 10, betweenSets: 45, afterExercise: 60 },
          superset: "drawOrder",
        },
        templateIndex: 1,
      },
    ],
    [
      "copies no picks setting other than the timing fields",
      generatePicksBlock("GKS", {
        countBy: "pairs",
        fallbackToWholeTree: false,
        order: "asDrawn",
      }),
      {
        block: { kind: "branches", skill: "GKS", branches: ["510"] },
        templateIndex: 1,
      },
    ],
    [
      "copies the duration of a branches block and omits the template index",
      generateBranchesBlock("CARDIO_2", ["510"], { duration: 1500 }),
      {
        block: {
          kind: "branches",
          skill: "CARDIO_2",
          branches: ["510"],
          duration: 1500,
        },
      },
    ],
  ])("%s", (_name, block, expected) => {
    const template = generateTemplate([generatePicksBlock("MOB"), block]);

    const blocks = readDrawnBlocks(
      { blocks: [generateFilledBlockResult(block, ["510"])], setList: [] },
      template,
    );

    expect(blocks).toStrictEqual([expected]);
  });

  it("skips a block without branches", () => {
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePicksBlock("GKS"),
    ]);
    const emptyBlock = generateBlockResult("filled", {
      block: template.blocks[0] as ReturnType<typeof generatePicksBlock>,
      exercises: [],
    });

    const blocks = readDrawnBlocks(
      {
        blocks: [
          emptyBlock,
          generateFilledBlockResult(template.blocks[1], ["510"]),
        ],
        setList: [],
      },
      template,
    );

    expect(blocks.map(({ block }) => block.skill)).toEqual(["GKS"]);
  });
});

describe("drawnWorkout: generateSetListFromDrawnWorkout on the first start", () => {
  it("returns a drawn workout of the template blocks with the branches the set list shows", () => {
    const template = generateStrengthTemplate();
    seedRandom(1);

    const { setList, drawnWorkoutToSave } = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest(),
      selection: generateSelection(template),
    });

    expect(drawnWorkoutToSave?.templateBlocks).toBe(
      JSON.stringify(template.blocks),
    );
    expect(
      drawnWorkoutToSave?.drawnBlocks.map(({ block, templateIndex }) => [
        block.skill,
        templateIndex,
        [...block.branches].sort(),
      ]),
    ).toEqual([
      ["GKS", 0, listBranchIdsOfSkill(setList, "GKS")],
      ["SWR1", 1, listBranchIdsOfSkill(setList, "SWR1")],
    ]);
  });

  it("saves the original of a cardio block that the first start swapped", () => {
    // Knee pain blocks branch 585, so the generator runs CARDIO_5 instead.
    const template = generateTemplate([
      generateBranchesBlock("CARDIO_2", ["585"], { duration: 1500 }),
    ]);

    const { setList, drawnWorkoutToSave } = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest({
        place: "HALL",
        equipment: ["AREA_10", "AREA_20", "TRACK_20", "TREADMILL"],
        user: generateAthlete({ pains: ["KNEE_LEFT"] }),
      }),
      selection: generateSelection(template),
    });

    expect(listSkills(setList)).toEqual(["CARDIO_5"]);
    expect(drawnWorkoutToSave?.drawnBlocks).toStrictEqual([
      {
        block: {
          kind: "branches",
          skill: "CARDIO_2",
          branches: ["585"],
          duration: 1500,
        },
      },
    ]);
  });
});

describe("drawnWorkout: generateSetListFromDrawnWorkout on a reuse", () => {
  it("replays the saved branches in block order with another seed and returns no drawn workout to save", () => {
    const template = generateStrengthTemplate();
    seedRandom(1);
    const first = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest(),
      selection: generateSelection(template),
    });
    seedRandom(2);

    const second = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest(),
      selection: generateSelection(template),
      drawnWorkout: first.drawnWorkoutToSave ?? undefined,
    });

    expect(listBranchIdsOfSkill(first.setList, "GKS")).not.toEqual([]);
    expect(listBranchIdsOfSkill(second.setList, "GKS")).toEqual(
      listBranchIdsOfSkill(first.setList, "GKS"),
    );
    expect(listBranchIdsOfSkill(second.setList, "SWR1")).toEqual(
      listBranchIdsOfSkill(first.setList, "SWR1"),
    );
    expect(listSkills(second.setList)).toEqual(["GKS", "SWR1"]);
    expect(second.drawnWorkoutToSave).toBeNull();
  });

  it.each(["drawOrder", "drawOrderWithLeftovers"] as const)(
    "replays the pairs of a %s block with another seed",
    (superset) => {
      const template = generateTemplate([
        generatePicksBlock("GKS", {
          picks: [{ tags: [], count: 4 }],
          superset,
          sets: 3,
        }),
        generatePicksBlock("MOB", { picks: [{ tags: [], count: 2 }] }),
      ]);
      seedRandom(1);
      const first = generateSetListFromDrawnWorkout({
        random: () => Math.random(),
        request: generateRequest(),
        selection: generateSelection(template),
      });
      seedRandom(2);

      const second = generateSetListFromDrawnWorkout({
        random: () => Math.random(),
        request: generateRequest(),
        selection: generateSelection(template),
        drawnWorkout: first.drawnWorkoutToSave ?? undefined,
      });

      expect(listPairsOfSkill(first.setList, "GKS")).not.toEqual([]);
      expect(listPairsOfSkill(second.setList, "GKS")).toEqual(
        listPairsOfSkill(first.setList, "GKS"),
      );
    },
  );

  it("saves and replays two blocks of one skill with their own branches", () => {
    const template = generateTemplate([
      generatePicksBlock("MOB"),
      generatePicksBlock("PREVKNEE", {
        picks: [{ tags: ["PREVENTION_KNEE_HIP"], count: 1 }],
      }),
      generatePicksBlock("PREVKNEE", {
        picks: [{ tags: ["PREVENTION_ANKLE"], count: 1 }],
      }),
    ]);
    seedRandom(1);
    const first = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest(),
      selection: generateSelection(template),
    });
    seedRandom(9);

    const second = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest(),
      selection: generateSelection(template),
      drawnWorkout: first.drawnWorkoutToSave ?? undefined,
    });

    const preventionBlocks = (
      first.drawnWorkoutToSave?.drawnBlocks ?? []
    ).filter(({ block }) => block.skill === "PREVKNEE");
    const preventionBranchIds = preventionBlocks.flatMap(
      ({ block }) => block.branches,
    );
    expect(preventionBlocks.map(({ templateIndex }) => templateIndex)).toEqual([
      1, 2,
    ]);
    expect(new Set(preventionBranchIds).size).toBe(preventionBranchIds.length);
    expect(listBranchIdsOfSkill(second.setList, "PREVKNEE")).toEqual(
      preventionBranchIds.sort(),
    );
  });
});

describe("drawnWorkout: generateSetListFromDrawnWorkout after a change of the athlete", () => {
  it("replays the branches with new weights after a level change", () => {
    const template = generateStrengthTemplate();
    seedRandom(1);
    const first = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest({
        user: generateAthlete({ level: "BEGINNER" }),
      }),
      selection: generateSelection(template),
    });
    seedRandom(2);

    const second = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest({
        user: generateAthlete({ level: "PROFESSIONAL" }),
      }),
      selection: generateSelection(template),
      drawnWorkout: first.drawnWorkoutToSave ?? undefined,
    });

    expect(listBranchIdsOfSkill(second.setList, "GKS")).toEqual(
      listBranchIdsOfSkill(first.setList, "GKS"),
    );
    expect(listBranchIdsOfSkill(second.setList, "SWR1")).toEqual(
      listBranchIdsOfSkill(first.setList, "SWR1"),
    );
    expect(second.setList.map(({ weight }) => weight)).not.toEqual(
      first.setList.map(({ weight }) => weight),
    );
  });

  it("replays the branches with new exercises after a branch level change", () => {
    const template = generateStrengthTemplate();
    seedRandom(1);
    const first = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest(),
      selection: generateSelection(template),
    });
    const branchData = Object.fromEntries(
      (first.drawnWorkoutToSave?.drawnBlocks ?? [])
        .flatMap(({ block }) => block.branches)
        .map((branchId) => [branchId, generateBranchLevel(branchId, 1)]),
    );
    seedRandom(2);

    const second = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest({
        userExerciseData: { exerciseData: {}, branchData },
      }),
      selection: generateSelection(template),
      drawnWorkout: first.drawnWorkoutToSave ?? undefined,
    });

    expect(listBranchIdsOfSkill(second.setList, "GKS")).toEqual(
      listBranchIdsOfSkill(first.setList, "GKS"),
    );
    expect(second.setList.map(({ exerciseId }) => exerciseId)).not.toEqual(
      first.setList.map(({ exerciseId }) => exerciseId),
    );
  });

  it("replaces a blocked saved branch for that start only", () => {
    // Knee pain blocks branch 523, which trains the knee.
    const template = generateTemplate([
      generatePicksBlock("GKS", {
        picks: [{ tags: ["EXERCISE_DIRECTION_KNEE"], count: 1 }],
        fallbackToWholeTree: false,
      }),
      generatePicksBlock("MOB"),
    ]);
    const drawnWorkout = generateDrawnWorkout(template, [
      {
        block: generateBranchesBlock("GKS", ["523"], { duration: undefined }),
        templateIndex: 0,
      },
      {
        block: generateBranchesBlock("MOB", ["952"], { duration: undefined }),
        templateIndex: 1,
      },
    ]);
    const before = structuredClone(drawnWorkout);
    seedRandom(3);

    const blocked = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest({
        equipment: ["DUMBBELL", "BARBELL"],
        user: generateAthlete({ pains: ["KNEE_LEFT"] }),
      }),
      selection: generateSelection(template),
      drawnWorkout,
    });
    const cleared = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest({ equipment: ["DUMBBELL", "BARBELL"] }),
      selection: generateSelection(template),
      drawnWorkout,
    });

    expect(listBranchIdsOfSkill(blocked.setList, "GKS")).toHaveLength(1);
    expect(listBranchIdsOfSkill(blocked.setList, "GKS")).not.toContain("523");
    expect(listBranchIdsOfSkill(blocked.setList, "MOB")).toEqual(["952"]);
    expect(blocked.drawnWorkoutToSave).toBeNull();
    expect(drawnWorkout).toEqual(before);
    expect(listBranchIdsOfSkill(cleared.setList, "GKS")).toEqual(["523"]);
  });
});

describe("drawnWorkout: generateSetListFromDrawnWorkout after a template change", () => {
  it("generates fresh and returns a drawn workout of the new template blocks", () => {
    const oldTemplate = generateStrengthTemplate();
    const newTemplate = generateTemplate([generatePicksBlock("MOB")]);
    const drawnWorkout = generateDrawnWorkout(oldTemplate, [
      {
        block: generateBranchesBlock("GKS", ["510"], { duration: undefined }),
        templateIndex: 0,
      },
    ]);
    seedRandom(1);

    const { setList, drawnWorkoutToSave } = generateSetListFromDrawnWorkout({
      random: () => Math.random(),
      request: generateRequest(),
      selection: generateSelection(newTemplate),
      drawnWorkout,
    });

    expect(drawnWorkoutToSave?.templateBlocks).toBe(
      JSON.stringify(newTemplate.blocks),
    );
    expect(
      drawnWorkoutToSave?.drawnBlocks.map(({ block }) => block.skill),
    ).toEqual(["MOB"]);
    expect(listSkills(setList)).toEqual(["MOB"]);
  });
});
