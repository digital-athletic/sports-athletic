import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import type { SkillTreesState } from "@/store/skillTreesStore";
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
  tags: ["REGION_LOWER_BODY", "SIDE_BOTH", "EXERCISEDIRECTION_SQUAT"],
  levels: {
    "1": { id: "101" },
    "2": { id: "102" },
    "3": { id: "103" },
  },
};

const ONE_SIDED_BRANCH: SkillBranchType = {
  tags: ["REGION_LOWER_BODY", "SIDE_ONE"],
  levels: { "1": { id: "201" }, "2": { id: "202" } },
};

const PREVENTION_BRANCH: SkillBranchType = {
  tags: ["REGION_UPPER_BODY", "SIDE_ONE", "PREVENTION_SHOULDER"],
  levels: { "1": { id: "401" }, "2": { id: "402" } },
};

// Branch with duplicate exercise IDs across levels (for skip testing)
const DUPLICATE_ID_BRANCH: SkillBranchType = {
  tags: ["REGION_CORE", "SIDE_BOTH"],
  levels: {
    "1": { id: "601" },
    "2": { id: "601" }, // same as level 1
    "3": { id: "602" },
  },
};

describe("branchLevelUtils", () => {
  describe("findCurrentBranchLevel", () => {
    it("returns level from branchData when available", () => {
      const branchData: BranchDataMapType = {
        "25": { branchId: "25", level: 3 },
      };
      const result = findCurrentBranchLevel(
        "25",
        "103",
        SWR_BRANCH,
        branchData,
      );
      expect(result).toBe(3);
    });

    it("finds level by exercise ID when branchData is missing", () => {
      const result = findCurrentBranchLevel("25", "102", SWR_BRANCH, {});
      expect(result).toBe(2);
    });

    it("returns lowest level when exercise ID not found", () => {
      const result = findCurrentBranchLevel("25", "999", SWR_BRANCH, {});
      expect(result).toBe(1);
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
  });

  describe("getBranchIdsInUse", () => {
    it("extracts unique branch IDs from exercise list", () => {
      const exerciseList = [
        { exerciseId: "101", branchId: "25", skill: "SWR" as const },
        { exerciseId: "201", branchId: "26", skill: "SWR" as const },
        { exerciseId: "102", branchId: "25", skill: "SWR" as const },
      ];
      expect(getBranchIdsInUse(exerciseList)).toEqual(["25", "26"]);
    });

    it("filters out -1 branch IDs (pause exercises)", () => {
      const exerciseList = [
        { exerciseId: "101", branchId: "25", skill: "SWR" as const },
        { exerciseId: "999999", branchId: "-1", skill: "SWR" as const },
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
          skill: "SWR",
          ageGroup: "ADULT",
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
          skill: "SWR",
          ageGroup: "ADULT",
        },
        context,
        createPlanContext(),
      );
      expect(result).toEqual({
        type: "SAME_BRANCH",
        branchId: "25",
        newLevel: 3,
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
          skill: "SWR",
          ageGroup: "ADULT",
        },
        context,
        createPlanContext(),
      );
      expect(result).toEqual({
        type: "SAME_BRANCH",
        branchId: "25",
        newLevel: 2,
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
          skill: "SWR",
          ageGroup: "ADULT",
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
          skill: "STABILITY",
          ageGroup: "ADULT",
        },
        context,
        createPlanContext(),
      );
      expect(result).toEqual({
        type: "SAME_BRANCH",
        branchId: "50",
        newLevel: 3,
      });
    });
  });
});
