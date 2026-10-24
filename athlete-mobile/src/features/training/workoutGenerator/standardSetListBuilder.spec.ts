import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import {
  findCatalogExerciseById,
  generateAuthoredValues,
  generateValueExercise,
} from "../../../../test/factories/valueExercise";
import type { GenerationInput } from "./generationInput";
import type { SetListBlock } from "./setListBuilder";
import {
  buildStandardSetList,
  isBuildablePair,
} from "./standardSetListBuilder";

/**
 * Fakes a two sided branch reference with the exercise ID `e<id>`.
 *
 * generateBranchReference("c", ["MUSCLE_CHEST"])
 * → { branchId: "c", exerciseId: "ec", branchTags: ["SIDE_BOTH", "MUSCLE_CHEST"] }
 */
const generateBranchReference = (
  id: string,
  tags: string[],
): BranchExerciseReference => ({
  branchId: id,
  exerciseId: `e${id}`,
  branchTags: ["SIDE_BOTH", ...tags],
});

/**
 * Fakes four bodyweight references: chest twice, biceps (same region as
 * chest) and quadriceps.
 *
 * generateBodyweightReferences().chest
 * → { branchId: "c", exerciseId: "ec",
 *     branchTags: ["SIDE_BOTH", "MUSCLE_CHEST", "REGION_UPPER_BODY", "EQ_TYPE_KG"] }
 */
const generateBodyweightReferences = () => ({
  chest: generateBranchReference("c", [
    "MUSCLE_CHEST",
    "REGION_UPPER_BODY",
    "EQ_TYPE_KG",
  ]),
  chestAgain: generateBranchReference("c2", [
    "MUSCLE_CHEST",
    "REGION_UPPER_BODY",
    "EQ_TYPE_KG",
  ]),
  biceps: generateBranchReference("b", [
    "MUSCLE_BICEPS",
    "REGION_UPPER_BODY",
    "EQ_TYPE_KG",
  ]),
  quads: generateBranchReference("q", [
    "MUSCLE_QUADRICEPS",
    "REGION_LOWER_BODY",
    "EQ_TYPE_KG",
  ]),
});
type BodyweightReferences = ReturnType<typeof generateBodyweightReferences>;

/**
 * Fakes a weighted chest reference whose catalog exercise starts at 40 kg and
 * 10 repetitions.
 *
 * generateWeightedChest().reference
 * → { branchId: "w", exerciseId: "ew", branchTags: [..., "EQ_TYPE_WEIGHTS"] }
 */
const generateWeightedChest = () => {
  const reference = generateBranchReference("w", [
    "MUSCLE_CHEST",
    "REGION_UPPER_BODY",
    "EQ_TYPE_WEIGHTS",
  ]);
  const exercise: ExerciseType = {
    ...generateValueExercise("repetition", { withWeights: true }),
    id: reference.exerciseId,
    tags: reference.branchTags,
    values: {
      weight: generateAuthoredValues("40", "80"),
      repetition: generateAuthoredValues("10", "15"),
    },
  };
  return { reference, exercise };
};

/**
 * Builds a catalog exercise advanced by repetitions for each reference.
 *
 * generateCatalog([chest]) → [{ id: "ec", tags: chest.branchTags, isAdvanceByReps: true, ... }]
 */
const generateCatalog = (
  references: BranchExerciseReference[],
): ExerciseType[] =>
  references.map((reference) => ({
    ...generateValueExercise("repetition"),
    id: reference.exerciseId,
    tags: reference.branchTags,
  }));

/**
 * Builds a block of 2 sets resting 30 s within a superset, 90 s between sets
 * and 60 s after an exercise.
 *
 * generateBlock("SWR2", { sets: 1 })
 * → { skill: "SWR2", minutes: 30, sets: 1,
 *     rest: { withinSuperset: 30, betweenSets: 90, afterExercise: 60 } }
 */
const generateBlock = (
  skill: SkillCode,
  values: Partial<SetListBlock> = {},
): SetListBlock => ({
  skill,
  minutes: 30,
  sets: 2,
  rest: { withinSuperset: 30, betweenSets: 90, afterExercise: 60 },
  ...values,
});

/**
 * Builds the set list of the pairs, by default with a catalog of every
 * exercise in them.
 *
 * buildSetList([{ first: chest }], generateBlock("SWR2"))
 * → [{ exerciseId: "ec", set: [1, 2], ... }, { exerciseId: "999999", duration: 90, ... }, ...]
 */
const buildSetList = (
  pairs: ExercisePair[],
  block: SetListBlock,
  exerciseCatalog = generateCatalog(
    pairs.flatMap(({ first, second }) => (second ? [first, second] : [first])),
  ),
  input: GenerationInput = generateRuleFamilyInput({ exerciseCatalog }),
): GeneratedSetListEntry[] => buildStandardSetList(pairs, block, input);

/**
 * Describes each entry as "<exercise> <set>/<sets>" or "pause <seconds>".
 *
 * describeSetList([ec set [1, 2], pause 90]) → "ec 1/2, pause 90"
 */
const describeSetList = (setList: GeneratedSetListEntry[]): string =>
  setList
    .map((entry) =>
      isPauseExercise(entry.exerciseId)
        ? `pause ${entry.duration}`
        : `${entry.exerciseId} ${entry.set.join("/")}`,
    )
    .join(", ");

/**
 * Lists the durations of the pauses.
 *
 * listPauseDurations([ec set 1, pause 90, ec set 2, pause 60]) → [90, 60]
 */
const listPauseDurations = (setList: GeneratedSetListEntry[]) =>
  setList
    .filter((entry) => isPauseExercise(entry.exerciseId))
    .map((entry) => entry.duration);

const unresolve = (reference: BranchExerciseReference) => ({
  ...reference,
  exerciseId: "-1",
});

describe("standardSetListBuilder: rests", () => {
  it.each([
    ["the rest after an exercise for another muscle", "quads", 60],
    ["the rest between sets for the same region and muscle", "chestAgain", 90],
    ["the rest after an exercise for the same region only", "biceps", 60],
  ] as const)("closes a single exercise on %s", (_label, nextName, rest) => {
    const references = generateBodyweightReferences();

    const setList = buildSetList(
      [{ first: references.chest }, { first: references[nextName] }],
      generateBlock("SWR2"),
    );

    expect(listPauseDurations(setList)).toEqual([90, rest, 90, 60]);
  });

  it.each([
    ["the rest after an exercise for another muscle", "biceps", 60],
    [
      "the rest between sets for the partner's region and muscle",
      "chestAgain",
      90,
    ],
  ] as const)("closes a superset on %s", (_label, nextName, rest) => {
    const references = generateBodyweightReferences();

    const setList = buildSetList(
      [
        { first: references.quads, second: references.chest },
        { first: references[nextName] },
      ],
      generateBlock("SWR2"),
    );

    expect(listPauseDurations(setList).slice(0, 4)).toEqual([30, 30, 30, rest]);
  });

  it("compares with the next built pair, not with an unresolved one", () => {
    const { chest, chestAgain, quads } = generateBodyweightReferences();

    const setList = buildSetList(
      [{ first: chest }, { first: unresolve(chestAgain) }, { first: quads }],
      generateBlock("SWR2"),
    );

    expect(describeSetList(setList)).toBe(
      "ec 1/2, pause 90, ec 2/2, pause 60, eq 1/2, pause 90, eq 2/2, pause 60",
    );
  });

  it("writes each superset entry with its start values, set and skill", () => {
    const { chest, quads } = generateBodyweightReferences();
    const entry = (reference: BranchExerciseReference, set: number) => ({
      branchId: reference.branchId,
      exerciseId: reference.exerciseId,
      tags: reference.branchTags,
      duration: 40,
      height: undefined,
      repetition: undefined,
      weight: undefined,
      weightType: "weightAbsolute",
      set: [set, 2],
      skill: "BAS",
    });
    const pause = (set: number, duration: number) => ({
      branchId: "-1",
      exerciseId: "999999",
      set: [set, 2],
      skill: "BAS",
      duration,
    });

    const setList = buildSetList(
      [{ first: chest, second: quads }],
      generateBlock("BAS", { setDuration: 40 }),
    );

    expect(setList).toEqual([
      entry(chest, 1),
      pause(1, 30),
      entry(quads, 1),
      pause(1, 30),
      entry(chest, 2),
      pause(2, 30),
      entry(quads, 2),
      pause(2, 60),
    ]);
  });
});

describe("standardSetListBuilder: closing the block", () => {
  it.each([
    ["the block's afterBlock", "SWR2", { afterBlock: 40 }, 40],
    ["an afterBlock of 0", "SWR2", { afterBlock: 0 }, 0],
    ["the skill catalog afterBlock", "WUSPEZIAL", {}, 30],
    ["the block's afterBlock first", "WUSPEZIAL", { afterBlock: 5 }, 5],
    ["the rest after an exercise without afterBlock", "SWR2", {}, 60],
  ] as const)("closes the last pair on %s", (_label, skill, rest, closing) => {
    const { chest, quads } = generateBodyweightReferences();
    const block = generateBlock(skill);

    const setList = buildSetList([{ first: chest }, { first: quads }], {
      ...block,
      rest: { ...block.rest, ...rest },
    });

    expect(listPauseDurations(setList)).toEqual([90, 60, 90, closing]);
  });

  it("closes the last built pair on afterBlock when an unresolved pair follows", () => {
    const { chest, chestAgain } = generateBodyweightReferences();
    const block = generateBlock("SWR2");

    const setList = buildSetList(
      [{ first: chest }, { first: unresolve(chestAgain) }],
      { ...block, rest: { ...block.rest, afterBlock: 40 } },
    );

    expect(listPauseDurations(setList)).toEqual([90, 40]);
  });

  it("reads afterBlock from the skill catalog of the generation input", () => {
    const { chest } = generateBodyweightReferences();
    const exerciseCatalog = generateCatalog([chest]);
    const input = generateRuleFamilyInput({ exerciseCatalog });
    const rest = { withinSuperset: 1, betweenSets: 2, afterExercise: 3 };
    const skillCatalog = {
      ...input.skillCatalog,
      SWR2: { ...input.skillCatalog.SWR2, rest: { ...rest, afterBlock: 45 } },
    };

    const setList = buildSetList(
      [{ first: chest }],
      generateBlock("SWR2"),
      exerciseCatalog,
      { ...input, skillCatalog },
    );

    expect(listPauseDurations(setList)).toEqual([90, 45]);
  });
});

describe("standardSetListBuilder: unresolved and missing exercises", () => {
  it.each([
    [
      "builds nothing for an unresolved lead",
      ({ chest }: BodyweightReferences) => ({ first: unresolve(chest) }),
      "eq 1/2, pause 90, eq 2/2, pause 60",
    ],
    [
      "builds nothing for an unresolved partner",
      ({ chest, biceps }: BodyweightReferences) => ({
        first: chest,
        second: unresolve(biceps),
      }),
      "eq 1/2, pause 90, eq 2/2, pause 60",
    ],
    [
      "builds nothing for a lead missing from the catalog",
      ({ biceps }: BodyweightReferences) => ({ first: biceps }),
      "eq 1/2, pause 90, eq 2/2, pause 60",
    ],
    [
      "trains the lead alone when its partner is missing from the catalog",
      ({ chest, biceps }: BodyweightReferences) => ({
        first: chest,
        second: biceps,
      }),
      "ec 1/2, pause 90, ec 2/2, pause 60, eq 1/2, pause 90, eq 2/2, pause 60",
    ],
  ])("%s", (_label, generatePair, expected) => {
    const references = generateBodyweightReferences();
    const { chest, quads } = references;

    const setList = buildSetList(
      [generatePair(references), { first: quads }],
      generateBlock("SWR2"),
      generateCatalog([chest, quads]),
    );

    expect(describeSetList(setList)).toBe(expected);
  });
});

describe("standardSetListBuilder: warm-up sets", () => {
  it("opens a weighted explosive power exercise with 6 repetitions at 65 % and the rest between sets", () => {
    const { reference, exercise } = generateWeightedChest();

    const setList = buildSetList(
      [{ first: reference }],
      generateBlock("SK", {
        rest: { withinSuperset: 60, betweenSets: 180, afterExercise: 60 },
      }),
      [exercise],
    );

    expect(describeSetList(setList)).toBe(
      "ew 1/3, pause 180, ew 2/3, pause 180, ew 3/3, pause 60",
    );
    expect(
      setList
        .filter((entry) => !isPauseExercise(entry.exerciseId))
        .map((entry) => [entry.repetition, entry.weight]),
    ).toEqual([
      [6, 26],
      [10, 40],
      [10, 40],
    ]);
  });

  it("opens a weighted power endurance exercise with its repetitions at 70 % and a 60 s rest", () => {
    const { reference, exercise } = generateWeightedChest();

    const setList = buildSetList(
      [{ first: reference }],
      generateBlock("SWR2"),
      [exercise],
    );

    expect(describeSetList(setList.slice(0, 3))).toBe(
      "ew 1/3, pause 60, ew 2/3",
    );
    expect([setList[0], setList[2]].map((entry) => entry.weight)).toEqual([
      28, 40,
    ]);
    expect(setList[0].repetition).toBe(setList[2].repetition);
  });

  it("warms up both exercises of a superset with a weighted lead and rests within the superset", () => {
    const { reference, exercise } = generateWeightedChest();
    const { quads } = generateBodyweightReferences();

    const setList = buildSetList(
      [{ first: reference, second: quads }],
      generateBlock("SK"),
      [exercise, ...generateCatalog([quads])],
    );

    expect(describeSetList(setList.slice(0, 4))).toBe(
      "ew 1/3, pause 30, eq 1/3, pause 30",
    );
    expect([setList[0].repetition, setList[2].repetition]).toEqual([6, 6]);
  });

  it.each([
    ["a skill without warm-up sets", "GKS", true],
    ["a bodyweight exercise", "SK", false],
  ] as const)("adds no warm-up set for %s", (_label, skill, isWeighted) => {
    const weighted = generateWeightedChest();
    const { chest } = generateBodyweightReferences();

    const setList = isWeighted
      ? buildSetList([{ first: weighted.reference }], generateBlock(skill), [
          weighted.exercise,
        ])
      : buildSetList([{ first: chest }], generateBlock(skill));

    expect(setList[0].set).toEqual([1, 2]);
  });
});

describe("standardSetListBuilder: block values", () => {
  it.each([
    ["exercise", 4],
    ["skill", 10],
  ] as const)("starts the landing at the %s start value", (values, start) => {
    const landing = {
      branchId: "landing",
      exerciseId: "1107",
      branchTags: ["SIDE_BOTH"],
    };

    const setList = buildSetList(
      [{ first: landing }],
      generateBlock("PREV", { values }),
      [findCatalogExerciseById("1107")],
    );

    expect(setList.map((entry) => entry.repetition)).toEqual([
      start,
      undefined,
      start,
      undefined,
    ]);
  });
});

describe("standardSetListBuilder: isBuildablePair", () => {
  it.each([
    [
      "builds a catalog lead with a partner",
      ({ chest, biceps }: BodyweightReferences) => ({
        first: chest,
        second: biceps,
      }),
      true,
    ],
    [
      "skips an unresolved lead",
      ({ chest }: BodyweightReferences) => ({ first: unresolve(chest) }),
      false,
    ],
    [
      "skips a lead missing from the catalog",
      ({ quads }: BodyweightReferences) => ({ first: quads }),
      false,
    ],
    [
      "skips an unresolved partner",
      ({ chest, biceps }: BodyweightReferences) => ({
        first: chest,
        second: unresolve(biceps),
      }),
      false,
    ],
  ])("%s", (_label, generatePair, expected) => {
    const references = generateBodyweightReferences();
    const exerciseMap = new Map(
      generateCatalog([references.chest, references.biceps]).map((exercise) => [
        exercise.id,
        exercise,
      ]),
    );

    expect(isBuildablePair(generatePair(references), exerciseMap)).toBe(
      expected,
    );
  });
});
