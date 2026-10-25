import { loadExercises } from "@/data/loadExercises";
import {
  generateLowerBodyBranch,
  generateUpperBodyBranch,
} from "@test/factories/skillTree";
import {
  generateLowerBodyExercises,
  generateTaggedExercise,
} from "@test/factories/valueExercise";
import { generateReplacementInput } from "@test/factories/workoutInput";
import {
  isPreventionOrSpecialWarmUpSkill,
  replaceBlockedBranches,
} from "./branchReplacement";

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
      branchLevels: { "1": 2 },
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
        ...generateLowerBodyExercises(["e1", "e3"]),
        generateTaggedExercise("e2", ["REGION_LOWER_BODY", "BLOCK_KNEE"]),
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
        exerciseCatalog: generateLowerBodyExercises([
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
      exerciseCatalog: generateLowerBodyExercises(["e1", "e2", "e3", "e4"]),
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
