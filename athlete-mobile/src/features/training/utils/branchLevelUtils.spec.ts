import type { SkillTreesState } from "@/data/skillTreeRegistry";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import {
  type BranchLevelContext,
  calculateBranchLevelUpdate,
  findCurrentBranchLevel,
  findNextExerciseInBranch,
  getBranchIdsInUse,
  needsOneToBothCompensation,
  type TrainingPlanContext,
} from "./branchLevelUtils";

// Minimal real branch data for testing
const SWR_BRANCH: SkillBranchType = {
  tags: ["REGION_LOWER_BODY", "SIDE_BOTH", "EXERCISE_DIRECTION_SQUAT"],
  levels: {
    1: { exerciseId: "101" },
    2: { exerciseId: "102" },
    3: { exerciseId: "103" },
  },
};

const ONE_SIDED_BRANCH: SkillBranchType = {
  tags: ["REGION_LOWER_BODY", "SIDE_ONE"],
  levels: { 1: { exerciseId: "201" }, 2: { exerciseId: "202" } },
};

const PREVENTION_BRANCH: SkillBranchType = {
  tags: ["REGION_UPPER_BODY", "SIDE_ONE", "PREVENTION_SHOULDER"],
  levels: { 1: { exerciseId: "401" }, 2: { exerciseId: "402" } },
};

// Branch with duplicate exercise IDs across levels (for skip testing)
const DUPLICATE_ID_BRANCH: SkillBranchType = {
  tags: ["REGION_CORE", "SIDE_BOTH"],
  levels: {
    1: { exerciseId: "601" },
    2: { exerciseId: "601" }, // same as level 1
    3: { exerciseId: "602" },
  },
};

// Top levels repeat the exercise of level 2
const REPEATED_TOP_BRANCH: SkillBranchType = {
  tags: ["REGION_CORE", "SIDE_BOTH"],
  levels: {
    1: { exerciseId: "701" },
    2: { exerciseId: "702" },
    3: { exerciseId: "702" },
  },
};

// Level 3 is not authored
const GAP_BRANCH: SkillBranchType = {
  tags: ["REGION_LOWER_BODY", "SIDE_BOTH"],
  levels: {
    1: { exerciseId: "801" },
    2: { exerciseId: "802" },
    4: { exerciseId: "804" },
  },
};

// Lowest levels repeat the same exercise
const REPEATED_BOTTOM_BRANCH: SkillBranchType = {
  tags: ["REGION_CORE", "SIDE_BOTH"],
  levels: {
    1: { exerciseId: "901" },
    2: { exerciseId: "901" },
    3: { exerciseId: "903" },
  },
};

// Level 2 is not authored, levels 3 and 4 repeat the same exercise
const GAP_AT_BOTTOM_BRANCH: SkillBranchType = {
  tags: ["REGION_CORE", "SIDE_BOTH"],
  levels: {
    1: { exerciseId: "951" },
    3: { exerciseId: "952" },
    4: { exerciseId: "952" },
  },
};

// Every level holds the same exercise
const REPEATED_EVERYWHERE_BRANCH: SkillBranchType = {
  tags: ["REGION_CORE", "SIDE_BOTH"],
  levels: {
    1: { exerciseId: "611" },
    2: { exerciseId: "611" },
    3: { exerciseId: "611" },
  },
};

const branchWithLevels = (
  tags: string[],
  levels: number[],
  exercisePrefix: string,
): SkillBranchType => ({
  tags,
  levels: Object.fromEntries(
    levels.map((level) => [level, { exerciseId: `${exercisePrefix}${level}` }]),
  ),
});

describe("branchLevelUtils", () => {
  describe("findCurrentBranchLevel", () => {
    it("returns level from branchData when available", () => {
      const branchData: BranchDataMapType = {
        "25": { branchId: "25", level: 3 },
      };
      const result = findCurrentBranchLevel(
        "25",
        SWR_BRANCH,
        branchData,
        "BEGINNER",
      );
      expect(result).toBe(3);
    });

    it.each([
      ["BEGINNER", 1],
      ["ADVANCED", 2],
      ["PROFESSIONAL", 3],
    ])(
      "maps a %s athlete without stored progress to entry level %i",
      (userLevel, expected) => {
        expect(findCurrentBranchLevel("25", SWR_BRANCH, {}, userLevel)).toBe(
          expected,
        );
      },
    );

    it("uses the entry level when the levels repeat the exercise", () => {
      const result = findCurrentBranchLevel(
        "61",
        REPEATED_EVERYWHERE_BRANCH,
        {},
        "ADVANCED",
      );
      expect(result).toBe(2);
    });

    it("falls back from the entry level to the next lower authored level", () => {
      const result = findCurrentBranchLevel(
        "253",
        GAP_BRANCH,
        {},
        "PROFESSIONAL",
      );
      expect(result).toBe(2);
    });
  });

  describe("findNextExerciseInBranch", () => {
    it("returns next exercise when level exists", () => {
      const result = findNextExerciseInBranch(SWR_BRANCH, "101", 2, true);
      expect(result).toEqual({ exerciseId: "102", level: 2 });
    });

    it("returns previous exercise when leveling down", () => {
      const result = findNextExerciseInBranch(SWR_BRANCH, "103", 2, false);
      expect(result).toEqual({ exerciseId: "102", level: 2 });
    });

    it("skips levels with same exercise ID when leveling up", () => {
      const result = findNextExerciseInBranch(
        DUPLICATE_ID_BRANCH,
        "601",
        2,
        true,
      );
      expect(result).toEqual({ exerciseId: "602", level: 3 });
    });

    it("returns null when target level does not exist", () => {
      const result = findNextExerciseInBranch(SWR_BRANCH, "103", 5, true);
      expect(result).toBeNull();
    });

    it("returns null when branch has no levels", () => {
      const emptyBranch: SkillBranchType = { tags: [], levels: {} };
      const result = findNextExerciseInBranch(emptyBranch, "100", 1, true);
      expect(result).toBeNull();
    });

    it("returns null on level up when the top levels repeat the current exercise", () => {
      const result = findNextExerciseInBranch(
        REPEATED_TOP_BRANCH,
        "702",
        3,
        true,
      );
      expect(result).toBeNull();
    });

    it("passes over a missing level on level up", () => {
      const result = findNextExerciseInBranch(GAP_BRANCH, "802", 3, true);
      expect(result).toEqual({ exerciseId: "804", level: 4 });
    });

    it("returns null on level down when the lower levels repeat the current exercise", () => {
      const result = findNextExerciseInBranch(
        REPEATED_BOTTOM_BRANCH,
        "901",
        1,
        false,
      );
      expect(result).toBeNull();
    });

    it("passes over repeated exercises and missing levels on level down", () => {
      const result = findNextExerciseInBranch(
        GAP_AT_BOTTOM_BRANCH,
        "952",
        3,
        false,
      );
      expect(result).toEqual({ exerciseId: "951", level: 1 });
    });
  });

  describe("getBranchIdsInUse", () => {
    it("extracts unique branch IDs from exercise list", () => {
      const exerciseList = [
        { exerciseId: "101", branchId: "25", skill: "SWR1" as const },
        { exerciseId: "201", branchId: "26", skill: "SWR1" as const },
        { exerciseId: "102", branchId: "25", skill: "SWR1" as const },
      ];
      expect(getBranchIdsInUse(exerciseList)).toEqual(["25", "26"]);
    });

    it("filters out -1 branch IDs (pause exercises)", () => {
      const exerciseList = [
        { exerciseId: "101", branchId: "25", skill: "SWR1" as const },
        { exerciseId: "999999", branchId: "-1", skill: "SWR1" as const },
      ];
      expect(getBranchIdsInUse(exerciseList)).toEqual(["25"]);
    });

    it("returns empty array for null exercise list", () => {
      expect(getBranchIdsInUse(null)).toEqual([]);
    });
  });

  describe("needsOneToBothCompensation", () => {
    it("returns true when switching from ONE to BOTH sided", () => {
      const result = needsOneToBothCompensation(
        ONE_SIDED_BRANCH.tags,
        SWR_BRANCH.tags,
      );
      expect(result).toBe(true);
    });

    it("returns false for prevention exercises", () => {
      const bothSidedPrev = ["SIDE_BOTH", "PREVENTION_SHOULDER"];
      const result = needsOneToBothCompensation(
        PREVENTION_BRANCH.tags,
        bothSidedPrev,
      );
      expect(result).toBe(false);
    });

    it("returns false when both are BOTH-sided", () => {
      const result = needsOneToBothCompensation(
        SWR_BRANCH.tags,
        SWR_BRANCH.tags,
      );
      expect(result).toBe(false);
    });

    it("returns false when switching from BOTH to ONE", () => {
      const result = needsOneToBothCompensation(
        SWR_BRANCH.tags,
        ONE_SIDED_BRANCH.tags,
      );
      expect(result).toBe(false);
    });
  });

  describe("calculateBranchLevelUpdate", () => {
    const createContext = (
      overrides: Partial<BranchLevelContext> = {},
    ): BranchLevelContext => ({
      skillTrees: {} as SkillTreesState["skillTrees"],
      branchData: {},
      equipment: [],
      gender: "MALE",
      exerciseList: null,
      ...overrides,
    });

    const createPlanContext = (
      overrides: Partial<TrainingPlanContext> = {},
    ): TrainingPlanContext => ({
      type: "PLAN",
      sectionIndex: 0,
      weekday: 1,
      ...overrides,
    });

    it("returns BRANCH_NOT_FOUND when branch does not exist", () => {
      const context = createContext({ skillTrees: { ALL: {} } });
      const result = calculateBranchLevelUpdate(
        {
          levelUp: true,
          branchId: "999",
          exerciseId: "100",
          skill: "SWR1",
          ageGroup: "ADULT",
          userLevel: "BEGINNER",
        },
        context,
        createPlanContext(),
      );
      expect(result).toEqual({ type: "BRANCH_NOT_FOUND", branchId: "999" });
    });

    it("returns SAME_BRANCH when next level exists", () => {
      const context = createContext({
        skillTrees: { ALL: { "25": SWR_BRANCH } },
        branchData: { "25": { branchId: "25", level: 2 } },
      });
      const result = calculateBranchLevelUpdate(
        {
          levelUp: true,
          branchId: "25",
          exerciseId: "102",
          skill: "SWR1",
          ageGroup: "ADULT",
          userLevel: "BEGINNER",
        },
        context,
        createPlanContext(),
      );
      expect(result).toEqual({
        type: "SAME_BRANCH",
        branchId: "25",
        newLevel: 3,
        exerciseId: "103",
      });
    });

    it("returns SAME_BRANCH when leveling down", () => {
      const context = createContext({
        skillTrees: { ALL: { "25": SWR_BRANCH } },
        branchData: { "25": { branchId: "25", level: 3 } },
      });
      const result = calculateBranchLevelUpdate(
        {
          levelUp: false,
          branchId: "25",
          exerciseId: "103",
          skill: "SWR1",
          ageGroup: "ADULT",
          userLevel: "BEGINNER",
        },
        context,
        createPlanContext(),
      );
      expect(result).toEqual({
        type: "SAME_BRANCH",
        branchId: "25",
        newLevel: 2,
        exerciseId: "102",
      });
    });

    it("returns NO_CHANGE for non-PLAN training type", () => {
      const context = createContext({
        skillTrees: { ALL: { "25": SWR_BRANCH } },
        branchData: { "25": { branchId: "25", level: 3 } },
      });
      const result = calculateBranchLevelUpdate(
        {
          levelUp: true,
          branchId: "25",
          exerciseId: "103",
          skill: "SWR1",
          ageGroup: "ADULT",
          userLevel: "BEGINNER",
        },
        context,
        createPlanContext({ type: "MOB" }),
      );
      expect(result).toEqual({
        type: "NO_CHANGE",
        reason: "no_matching_branch_found",
        branchId: "25",
      });
    });

    it("skips duplicate exercise IDs when calculating level", () => {
      const context = createContext({
        skillTrees: { ALL: { "50": DUPLICATE_ID_BRANCH } },
        branchData: { "50": { branchId: "50", level: 1 } },
      });
      const result = calculateBranchLevelUpdate(
        {
          levelUp: true,
          branchId: "50",
          exerciseId: "601",
          skill: "BAS",
          ageGroup: "ADULT",
          userLevel: "BEGINNER",
        },
        context,
        createPlanContext(),
      );
      expect(result).toEqual({
        type: "SAME_BRANCH",
        branchId: "50",
        newLevel: 3,
        exerciseId: "602",
      });
    });

    it("saves no level above the top when the top levels repeat the exercise", () => {
      const context = createContext({
        skillTrees: { ALL: { "70": REPEATED_TOP_BRANCH } },
        branchData: { "70": { branchId: "70", level: 2 } },
      });
      const result = calculateBranchLevelUpdate(
        {
          levelUp: true,
          branchId: "70",
          exerciseId: "702",
          skill: "BAS",
          ageGroup: "ADULT",
          userLevel: "BEGINNER",
        },
        context,
        createPlanContext({ type: "BAS" }),
      );
      expect(result).toEqual({
        type: "NO_CHANGE",
        reason: "no_matching_branch_found",
        branchId: "70",
      });
    });

    it("levels up across a missing level", () => {
      const context = createContext({
        skillTrees: { ALL: { "253": GAP_BRANCH } },
        branchData: { "253": { branchId: "253", level: 2 } },
      });
      const result = calculateBranchLevelUpdate(
        {
          levelUp: true,
          branchId: "253",
          exerciseId: "802",
          skill: "SKKG",
          ageGroup: "ADULT",
          userLevel: "BEGINNER",
        },
        context,
        createPlanContext(),
      );
      expect(result).toEqual({
        type: "SAME_BRANCH",
        branchId: "253",
        newLevel: 4,
        exerciseId: "804",
      });
    });
  });

  describe("calculateBranchLevelUpdate: branch substitution", () => {
    const CORE_BOTH = ["REGION_CORE", "SIDE_BOTH"];
    const LOWER_BOTH = ["REGION_LOWER_BODY", "SIDE_BOTH"];

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const substituteIds = (
      result: ReturnType<typeof calculateBranchLevelUpdate>,
    ): string[] =>
      result.type === "BRANCH_SUBSTITUTION"
        ? result.equivalentBranches.map((branch) => branch.branchId)
        : [];

    const substitute = (
      tree: Record<string, SkillBranchType>,
      input: {
        levelUp: boolean;
        branchId: string;
        exerciseId: string;
        userLevel?: string;
      },
      branchData: BranchDataMapType = {},
    ) =>
      calculateBranchLevelUpdate(
        {
          skill: "SKKG",
          ageGroup: "ADULT",
          userLevel: "BEGINNER",
          ...input,
        },
        {
          skillTrees: { SKKG: tree } as SkillTreesState["skillTrees"],
          branchData,
          equipment: [],
          gender: "MALE",
          exerciseList: null,
        },
        { type: "PLAN", sectionIndex: 0, weekday: 1 },
      );

    it("searches the substitute at the current level on a level up", () => {
      const result = substitute(
        {
          "70": REPEATED_TOP_BRANCH,
          "80": branchWithLevels(CORE_BOTH, [3], "80"),
          "81": branchWithLevels(CORE_BOTH, [4], "81"),
        },
        { levelUp: true, branchId: "70", exerciseId: "702" },
        { "70": { branchId: "70", level: 3 } },
      );
      expect(substituteIds(result)).toEqual(["80"]);
    });

    it("searches the substitute at the current level on a level down", () => {
      const result = substitute(
        {
          "90": REPEATED_BOTTOM_BRANCH,
          "82": branchWithLevels(CORE_BOTH, [2], "82"),
          "83": branchWithLevels(CORE_BOTH, [1], "83"),
        },
        { levelUp: false, branchId: "90", exerciseId: "901" },
        { "90": { branchId: "90", level: 2 } },
      );
      expect(substituteIds(result)).toEqual(["82"]);
    });

    it("takes the entry level as the current level without stored progress", () => {
      const result = substitute(
        {
          "61": REPEATED_EVERYWHERE_BRANCH,
          "84": branchWithLevels(CORE_BOTH, [2], "84"),
          "85": branchWithLevels(CORE_BOTH, [4], "85"),
        },
        {
          levelUp: true,
          branchId: "61",
          exerciseId: "611",
          userLevel: "ADVANCED",
        },
      );
      expect(substituteIds(result)).toEqual(["84"]);
    });

    it("adds a second substitute that differs from the first for a one sided branch", () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      const result = substitute(
        {
          "26": ONE_SIDED_BRANCH,
          "40": branchWithLevels(LOWER_BOTH, [2], "40"),
          "41": branchWithLevels(LOWER_BOTH, [2], "41"),
        },
        { levelUp: true, branchId: "26", exerciseId: "202" },
        { "26": { branchId: "26", level: 2 } },
      );
      expect(substituteIds(result)).toEqual(["40", "41"]);
    });
  });
});
