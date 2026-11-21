import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { SavedBlock } from "@/features/training/workoutGenerator/replacementPools";
import type { WorkoutGenerationRequest } from "@/features/training/workoutGeneratorRouter";
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
  generateVersionedSetList,
  readVersionBlocks,
  type SavedVersion,
} from "./savedVersion";

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
 * Builds the version of a template from saved blocks.
 *
 * generateSavedVersion(template, [{ block: gksBlock, templateIndex: 0 }])
 * → { templateBlocks: '[{"kind":"picks",...}]', blocks: [{ block: gksBlock, templateIndex: 0 }] }
 */
const generateSavedVersion = (
  template: Template,
  blocks: SavedBlock[],
): SavedVersion => ({
  templateBlocks: JSON.stringify(template.blocks),
  blocks,
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
 * Seeds Math.random, which the generator reads for every draw.
 *
 * seedRandom(7) → the next draws are the seed 7 sequence
 */
const seedRandom = (seed: number) =>
  jest.spyOn(Math, "random").mockImplementation(generateSeededRandom(seed));

afterEach(jest.restoreAllMocks);

describe("savedVersion: readVersionBlocks", () => {
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

    const blocks = readVersionBlocks(
      { blocks: [result], setList: [] },
      template,
    );

    expect(blocks.map(({ block }) => block.branches)).toEqual([
      ["523", "510", "520"],
    ]);
  });

  // The template starts with a mobility block, so the template index is 1.
  it.each<[string, Block, SavedBlock]>([
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

    const blocks = readVersionBlocks(
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

    const blocks = readVersionBlocks(
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

describe("savedVersion: generateVersionedSetList on the first start", () => {
  it("returns a version of the template blocks with the branches the set list shows", () => {
    const template = generateStrengthTemplate();
    seedRandom(1);

    const { setList, versionToSave } = generateVersionedSetList({
      request: generateRequest(),
      template,
    });

    expect(versionToSave?.templateBlocks).toBe(JSON.stringify(template.blocks));
    expect(
      versionToSave?.blocks.map(({ block, templateIndex }) => [
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

    const { setList, versionToSave } = generateVersionedSetList({
      request: generateRequest({
        place: "HALL",
        equipment: ["AREA_10", "AREA_20", "TRACK_20", "TREADMILL"],
        user: generateAthlete({ pains: ["KNEE_LEFT"] }),
      }),
      template,
    });

    expect(listSkills(setList)).toEqual(["CARDIO_5"]);
    expect(versionToSave?.blocks).toStrictEqual([
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

describe("savedVersion: generateVersionedSetList on a reuse", () => {
  it("replays the saved branches in block order with another seed and returns no version to save", () => {
    const template = generateStrengthTemplate();
    seedRandom(1);
    const first = generateVersionedSetList({
      request: generateRequest(),
      template,
    });
    seedRandom(2);

    const second = generateVersionedSetList({
      request: generateRequest(),
      template,
      saved: first.versionToSave ?? undefined,
    });

    expect(listBranchIdsOfSkill(first.setList, "GKS")).not.toEqual([]);
    expect(listBranchIdsOfSkill(second.setList, "GKS")).toEqual(
      listBranchIdsOfSkill(first.setList, "GKS"),
    );
    expect(listBranchIdsOfSkill(second.setList, "SWR1")).toEqual(
      listBranchIdsOfSkill(first.setList, "SWR1"),
    );
    expect(listSkills(second.setList)).toEqual(["GKS", "SWR1"]);
    expect(second.versionToSave).toBeNull();
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
      const first = generateVersionedSetList({
        request: generateRequest(),
        template,
      });
      seedRandom(2);

      const second = generateVersionedSetList({
        request: generateRequest(),
        template,
        saved: first.versionToSave ?? undefined,
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
    const first = generateVersionedSetList({
      request: generateRequest(),
      template,
    });
    seedRandom(9);

    const second = generateVersionedSetList({
      request: generateRequest(),
      template,
      saved: first.versionToSave ?? undefined,
    });

    const preventionBlocks = (first.versionToSave?.blocks ?? []).filter(
      ({ block }) => block.skill === "PREVKNEE",
    );
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

describe("savedVersion: generateVersionedSetList after a change of the athlete", () => {
  it("replays the branches with new weights after a level change", () => {
    const template = generateStrengthTemplate();
    seedRandom(1);
    const first = generateVersionedSetList({
      request: generateRequest({
        user: generateAthlete({ level: "BEGINNER" }),
      }),
      template,
    });
    seedRandom(2);

    const second = generateVersionedSetList({
      request: generateRequest({
        user: generateAthlete({ level: "PROFESSIONAL" }),
      }),
      template,
      saved: first.versionToSave ?? undefined,
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
    const first = generateVersionedSetList({
      request: generateRequest(),
      template,
    });
    const branchData = Object.fromEntries(
      (first.versionToSave?.blocks ?? [])
        .flatMap(({ block }) => block.branches)
        .map((branchId) => [branchId, generateBranchLevel(branchId, 1)]),
    );
    seedRandom(2);

    const second = generateVersionedSetList({
      request: generateRequest({
        userExerciseData: { exerciseData: {}, branchData },
      }),
      template,
      saved: first.versionToSave ?? undefined,
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
    const saved = generateSavedVersion(template, [
      {
        block: generateBranchesBlock("GKS", ["523"], { duration: undefined }),
        templateIndex: 0,
      },
      {
        block: generateBranchesBlock("MOB", ["952"], { duration: undefined }),
        templateIndex: 1,
      },
    ]);
    const before = structuredClone(saved);
    seedRandom(3);

    const blocked = generateVersionedSetList({
      request: generateRequest({
        equipment: ["DUMBBELL", "BARBELL"],
        user: generateAthlete({ pains: ["KNEE_LEFT"] }),
      }),
      template,
      saved,
    });
    const cleared = generateVersionedSetList({
      request: generateRequest({ equipment: ["DUMBBELL", "BARBELL"] }),
      template,
      saved,
    });

    expect(listBranchIdsOfSkill(blocked.setList, "GKS")).toHaveLength(1);
    expect(listBranchIdsOfSkill(blocked.setList, "GKS")).not.toContain("523");
    expect(listBranchIdsOfSkill(blocked.setList, "MOB")).toEqual(["952"]);
    expect(blocked.versionToSave).toBeNull();
    expect(saved).toEqual(before);
    expect(listBranchIdsOfSkill(cleared.setList, "GKS")).toEqual(["523"]);
  });
});

describe("savedVersion: generateVersionedSetList after a template change", () => {
  it("generates fresh and returns a version of the new template blocks", () => {
    const oldTemplate = generateStrengthTemplate();
    const newTemplate = generateTemplate([generatePicksBlock("MOB")]);
    const saved = generateSavedVersion(oldTemplate, [
      {
        block: generateBranchesBlock("GKS", ["510"], { duration: undefined }),
        templateIndex: 0,
      },
    ]);
    seedRandom(1);

    const { setList, versionToSave } = generateVersionedSetList({
      request: generateRequest(),
      template: newTemplate,
      saved,
    });

    expect(versionToSave?.templateBlocks).toBe(
      JSON.stringify(newTemplate.blocks),
    );
    expect(versionToSave?.blocks.map(({ block }) => block.skill)).toEqual([
      "MOB",
    ]);
    expect(listSkills(setList)).toEqual(["MOB"]);
  });
});
