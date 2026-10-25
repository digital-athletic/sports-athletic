import type { LevelTag } from "@/constants/workoutConstants";
import { loadExercises } from "@/data/loadExercises";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import { generateRuleFamilyInput } from "../../../../test/factories/ruleFamilyInput";
import { buildBranchLookupIndex } from "./branchLookupIndex";
import {
  isPreventionOrSpecialWarmUpSkill,
  replaceBlockedBranches,
} from "./branchReplacement";
import { setUpWorkout } from "./workoutSetup";

const [exerciseTemplate] = loadExercises();

/**
 * Builds a lower body branch of the BAS tree.
 *
 * generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, ["SIDE_ONE"])
 * → { tags: ["SKILL_BAS", "REGION_LOWER_BODY", "SIDE_ONE"], levels: { 1: { exerciseId: "e1" } } }
 */
const generateLowerBodyBranch = (
  levels: Record<number, { exerciseId: string }>,
  extraTags: string[] = ["SIDE_BOTH"],
): SkillTreeType[string] => ({
  tags: ["SKILL_BAS", "REGION_LOWER_BODY", ...extraTags],
  levels,
});

/**
 * Builds an upper body branch on exercise 431 with the given tags.
 *
 * generateUpperBodyBranch(["EQ_TYPE_KG"])
 * → { tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "EQ_TYPE_KG"], levels: { 1: { exerciseId: "431" } } }
 */
const generateUpperBodyBranch = (tags: string[]): SkillTreeType[string] => ({
  tags: ["REGION_UPPER_BODY", "SIDE_BOTH", ...tags],
  levels: { 1: { exerciseId: "431" } },
});

/**
 * Builds catalog exercises with the given IDs from a real exercise.
 *
 * generateCatalogExercises(["e1"]) → [{ ...Exercises.json[0], id: "e1", tags: ["REGION_LOWER_BODY"] }]
 */
const generateCatalogExercises = (ids: string[]): ExerciseType[] =>
  ids.map((id) => ({ ...exerciseTemplate, id, tags: ["REGION_LOWER_BODY"] }));

interface ReplacementInputOptions {
  skillTrees: Record<string, SkillTreeType>;
  level?: LevelTag;
  birthday?: string;
  pains?: string[];
  equipment?: string[];
  exerciseCatalog?: ExerciseType[];
  branchData?: Record<string, UserExerciseBranchDataType | undefined>;
  random?: () => number;
}

/**
 * Builds a workout input whose branch lookup index holds only the given trees.
 *
 * generateReplacementInput({ skillTrees: { BAS: { "1": branch } } })
 * → beginner athlete, index over BAS, random always 0
 */
const generateReplacementInput = ({
  skillTrees,
  level = "BEGINNER",
  birthday,
  pains,
  equipment,
  exerciseCatalog = generateCatalogExercises(["e1", "e2", "e3"]),
  branchData = {},
  random = () => 0,
}: ReplacementInputOptions) =>
  setUpWorkout({
    ...generateRuleFamilyInput({
      level,
      birthday,
      pains,
      equipment,
      exerciseCatalog,
    }),
    branchLookupIndex: buildBranchLookupIndex(skillTrees),
    exerciseData: { exerciseData: {}, branchData },
    random,
  });

describe("branchReplacement: replaceBlockedBranches", () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("skips branches tagged for the other gender", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, [
            "GENDER_FEMALE",
          ]),
        },
      },
    });

    expect(
      replaceBlockedBranches(
        { skill: "BAS", replace: ["LOWER_BODY"], usedBranchIds: [] },
        input,
      ),
    ).toEqual([]);
  });

  it("skips a branch resolving to an exercise the skill already holds", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        },
      },
    });

    expect(
      replaceBlockedBranches(
        { skill: "BAS", replace: ["LOWER_BODY"], usedBranchIds: ["1"] },
        input,
      ),
    ).toEqual([]);
  });

  it("reads the branch progress of used branches when checking for duplicates", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({
            1: { exerciseId: "e1" },
            2: { exerciseId: "e2" },
          }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
          "3": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }),
        },
      },
      branchData: { "1": { branchId: "1", level: 2 } },
    });

    const replacement = replaceBlockedBranches(
      { skill: "BAS", replace: ["LOWER_BODY"], usedBranchIds: ["1"] },
      input,
    );

    expect(replacement.map(({ branchId }) => branchId)).toEqual(["3"]);
  });

  it("counts used branches only inside the tree the context selects", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: { "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }) },
        GKS: { "9": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }) },
      },
    });

    const replacement = replaceBlockedBranches(
      { skill: "BAS", replace: ["LOWER_BODY"], usedBranchIds: ["9"] },
      input,
    );

    expect(replacement.map(({ branchId }) => branchId)).toEqual(["1"]);
  });

  it("skips a branch whose branch tags block the athlete's pain region", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, [
            "BLOCK_KNEE",
          ]),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
        },
      },
      pains: ["KNEE_LEFT"],
    });

    const replacement = replaceBlockedBranches(
      { skill: "BAS", replace: ["LOWER_BODY"], usedBranchIds: [] },
      input,
    );

    expect(replacement.map(({ branchId }) => branchId)).toEqual(["2"]);
  });

  it("skips a branch whose exercise on any level blocks the athlete's pain region", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({
            1: { exerciseId: "e1" },
            2: { exerciseId: "e2" },
          }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }),
        },
      },
      pains: ["KNEE_LEFT"],
      exerciseCatalog: [
        ...generateCatalogExercises(["e1", "e3"]),
        {
          ...exerciseTemplate,
          id: "e2",
          tags: ["REGION_LOWER_BODY", "BLOCK_KNEE"],
        },
      ],
    });

    const replacement = replaceBlockedBranches(
      { skill: "BAS", replace: ["LOWER_BODY"], usedBranchIds: [] },
      input,
    );

    expect(replacement.map(({ branchId }) => branchId)).toEqual(["2"]);
  });

  it("replaces from the weighted tree for a child when the place has weights", () => {
    const input = generateReplacementInput({
      skillTrees: {
        SWR1: {
          "1": generateUpperBodyBranch(["EQ_DUMBBELL", "EQ_TYPE_WEIGHTS"]),
        },
        SWR1KG: { "2": generateUpperBodyBranch(["EQ_TYPE_KG"]) },
      },
      birthday: "2014-01-01",
      equipment: ["DUMBBELL"],
      exerciseCatalog: loadExercises(),
    });

    const replacement = replaceBlockedBranches(
      { skill: "SWR1", replace: ["UPPER_BODY"], usedBranchIds: [] },
      input,
    );

    expect(replacement.map(({ branchId }) => branchId)).toEqual(["1"]);
  });

  it("draws the replacement through the random source of the input", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
        },
      },
      random: () => 0.6,
    });

    const replacement = replaceBlockedBranches(
      { skill: "BAS", replace: ["LOWER_BODY"], usedBranchIds: [] },
      input,
    );

    expect(replacement).toEqual([
      { branchId: "2", branch: input.branchLookupIndex.get("2")?.branch },
    ]);
  });

  // five used lower body branches fill the region for every level but PROFESSIONAL
  it.each([
    ["ADVANCED", []],
    ["PROFESSIONAL", ["6"]],
  ] as const)(
    "falls back to a less used region only below the region cap at level %s",
    (level, expected) => {
      const input = generateReplacementInput({
        skillTrees: {
          BAS: Object.fromEntries(
            ["1", "2", "3", "4", "5", "6"].map((id) => [
              id,
              generateLowerBodyBranch({ 1: { exerciseId: `e${id}` } }),
            ]),
          ),
        },
        level,
        exerciseCatalog: generateCatalogExercises([
          "e1",
          "e2",
          "e3",
          "e4",
          "e5",
          "e6",
        ]),
      });

      const replacement = replaceBlockedBranches(
        {
          skill: "BAS",
          replace: ["UPPER_BODY"],
          usedBranchIds: ["1", "2", "3", "4", "5"],
        },
        input,
      );

      expect(replacement.map(({ branchId }) => branchId)).toEqual(expected);
    },
  );

  it("skips a one sided branch when the region has room for one more slot", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, [
            "SIDE_ONE",
          ]),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }, [
            "SIDE_ONE",
          ]),
          "3": generateLowerBodyBranch({ 1: { exerciseId: "e3" } }, [
            "SIDE_ONE",
          ]),
          "4": generateLowerBodyBranch({ 1: { exerciseId: "e4" } }),
        },
      },
      exerciseCatalog: generateCatalogExercises(["e1", "e2", "e3", "e4"]),
    });

    const replacement = replaceBlockedBranches(
      { skill: "BAS", replace: ["UPPER_BODY"], usedBranchIds: ["1", "2"] },
      input,
    );

    expect(replacement.map(({ branchId }) => branchId)).toEqual(["4"]);
  });

  // the second slot finds only a branch with the exercise of the first
  it("skips a slot without a candidate and keeps the earlier picks", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        },
      },
    });

    const replacement = replaceBlockedBranches(
      {
        skill: "BAS",
        replace: ["LOWER_BODY", "LOWER_BODY"],
        usedBranchIds: [],
      },
      input,
    );

    expect(replacement.map(({ branchId }) => branchId)).toEqual(["1"]);
  });

  // the index holds no prevention tree, so the registry's names seed empty trees
  it("finds no replacement for a prevention skill whose tree the index lacks", () => {
    const input = generateReplacementInput({
      skillTrees: {
        BAS: { "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }) },
      },
      pains: ["KNEE_LEFT"],
    });

    expect(
      replaceBlockedBranches(
        { skill: "PREVKNEE", replace: ["LOWER_BODY"], usedBranchIds: [] },
        input,
      ),
    ).toEqual([]);
  });

  // the second slot finds only a branch with the exercise of the first
  it("returns nothing for a special warm-up skill that fills fewer slots than requested", () => {
    const input = generateReplacementInput({
      skillTrees: {
        WUSPEZIAL: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, [
            "PAIN_KNEE",
          ]),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, [
            "PAIN_KNEE",
          ]),
        },
      },
      pains: ["KNEE_LEFT"],
    });

    expect(
      replaceBlockedBranches(
        {
          skill: "WUSPEZIAL",
          replace: ["LOWER_BODY", "LOWER_BODY"],
          usedBranchIds: [],
        },
        input,
      ),
    ).toEqual([]);
  });

  // the third slot finds only branch 3, which has no region tag, so no region holds a branch
  it("returns nothing for a prevention skill whose replacement stops without a region branch", () => {
    const input = generateReplacementInput({
      skillTrees: {
        PREVKG: {
          "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, [
            "PREVENTION_KNEE",
          ]),
          "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }, [
            "PREVENTION_KNEE",
          ]),
          "3": {
            tags: ["PREVENTION_KNEE", "SIDE_BOTH"],
            levels: { 1: { exerciseId: "e3" } },
          },
        },
      },
      pains: ["KNEE_LEFT"],
    });

    expect(
      replaceBlockedBranches(
        {
          skill: "PREVKNEE",
          replace: ["LOWER_BODY", "LOWER_BODY", "LOWER_BODY"],
          usedBranchIds: [],
        },
        input,
      ),
    ).toEqual([]);
  });
});

describe("branchReplacement: isPreventionOrSpecialWarmUpSkill", () => {
  it.each([
    ["PREVKNEE", true],
    ["WUPREV", true],
    ["WUSPEZIAL", true],
    ["WU", false],
    ["GKS", false],
  ])(
    "reads %s as a skill that refills all slots or none: %s",
    (skill, expected) => {
      expect(isPreventionOrSpecialWarmUpSkill(skill)).toBe(expected);
    },
  );
});
