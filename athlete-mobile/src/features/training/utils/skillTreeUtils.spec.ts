import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillBranchType } from "@/schemas/skillTree.schema";
import type { UserExerciseBranchDataType } from "@/store/exerciseProgressStore";
import {
  getBranchIdByNameAndSkill,
  getBranchIdsByNames,
  getNextTypeFiltered,
  getSkillTree,
  getUserExerciseFromBranch,
  isPreventionSkill,
  mapSkillCodeToFocusArea,
} from "./skillTreeUtils";

describe("skillTreeUtils", () => {
  const mockExercises = [
    { id: "1", name: "Test Exercise 1", tags: ["EQ_DUMBBELL"] },
    { id: "2", name: "Test Exercise 2", tags: ["EQ_BARBELL"] },
    { id: "3", name: "Test Exercise 3", tags: [] },
  ] as ExerciseType[];

  const createMockSkillBranch = (): SkillBranchType => ({
    tags: ["PREVENTION_SHOULDER"],
    levels: {
      1: { exerciseId: "1" },
      2: { exerciseId: "2" },
      3: { exerciseId: "3" },
    },
  });

  const mockSkillTrees = {
    GKS: {
      branch1: createMockSkillBranch(),
    },
    GKSKG: {
      branch1: { ...createMockSkillBranch(), tags: ["PREVENTION_KNEE"] },
    },
    PREV: {
      shoulder: { ...createMockSkillBranch(), tags: ["PREVENTION_SHOULDER"] },
    },
    PREVKG: {
      knee: { ...createMockSkillBranch(), tags: ["PREVENTION_KNEE"] },
    },
    SA: {
      branch1: createMockSkillBranch(),
    },
    SAKG: {
      branch1: createMockSkillBranch(),
    },
    SK: {
      branch1: createMockSkillBranch(),
    },
    SKKG: {
      branch1: createMockSkillBranch(),
    },
    SWR1: {
      branch1: createMockSkillBranch(),
    },
    SWR1KG: {
      branch1: createMockSkillBranch(),
    },
    PLYO: {
      branch1: createMockSkillBranch(),
    },
    SASPEZIAL: {
      sasBranch: createMockSkillBranch(),
    },
    WUSPEZIAL: {
      wuBranch: { ...createMockSkillBranch(), tags: ["PAIN_SHOULDER"] },
    },
    // User-facing skill type targets
    MOB: {
      mobBranch: createMockSkillBranch(),
    },
    WU: {
      wuBranch: createMockSkillBranch(),
    },
    BR: {
      brBranch: createMockSkillBranch(),
    },
    BAS: {
      basBranch: createMockSkillBranch(),
    },
    CD: {
      cdBranch: createMockSkillBranch(),
    },
    SUPPORT: {
      supportBranch: createMockSkillBranch(),
    },
  };

  const mockSkillBranch = createMockSkillBranch();

  describe("getSkillTree", () => {
    it("should return default skill tree by skill name", () => {
      const result = getSkillTree(mockSkillTrees, "GKS", [], false);
      expect(Object.keys(result)).toEqual(Object.keys(mockSkillTrees.GKS));
      expect(result.branch1).toBeDefined();
    });

    it("should return GKS when skill is GKSKG and hasWeights is true", () => {
      const result = getSkillTree(mockSkillTrees, "GKSKG", [], true);
      expect(result).toEqual(mockSkillTrees.GKS);
    });

    it("should return GKSKG when skill is GKSKG and hasWeights is false", () => {
      const result = getSkillTree(mockSkillTrees, "GKSKG", [], false);
      expect(result).toEqual(mockSkillTrees.GKSKG);
    });

    it("should return the SASPEZIAL tree for the SAS skill", () => {
      expect(getSkillTree(mockSkillTrees, "SAS", [], true)).toEqual(
        mockSkillTrees.SASPEZIAL,
      );
    });

    it("should return PLYO skill tree for PLYO skill", () => {
      expect(getSkillTree(mockSkillTrees, "PLYO", [], false)).toEqual(
        mockSkillTrees.PLYO,
      );
    });

    it("draws the low plyometric branches for a medium plyometric slot", () => {
      const plyoTrees = {
        PLYO: {
          high: { ...createMockSkillBranch(), tags: ["SKILL_PLYO_HIGH"] },
          low: { ...createMockSkillBranch(), tags: ["SKILL_PLYO_LOW"] },
        },
      };
      expect(
        Object.keys(getSkillTree(plyoTrees, "PLYO_MEDIUM", [], false)),
      ).toEqual(["low"]);
    });

    it("should return PREV when skill is PREVKNEE and hasWeights is true", () => {
      const result = getSkillTree(mockSkillTrees, "PREVKNEE", [], true);
      expect(result).toEqual(mockSkillTrees.PREV);
    });

    it("should return PREVKG when skill is PREVKNEE and hasWeights is false", () => {
      const result = getSkillTree(mockSkillTrees, "PREVKNEE", [], false);
      expect(result).toEqual(mockSkillTrees.PREVKG);
    });

    it("should merge PREV and PREVKG when isShortWorkout is true", () => {
      const result = getSkillTree(mockSkillTrees, "PREVKNEE", [], false, true);
      expect(result).toEqual({
        ...mockSkillTrees.PREV,
        ...mockSkillTrees.PREVKG,
      });
    });

    it("should return SA when skill is SA and hasWeights is true", () => {
      const result = getSkillTree(mockSkillTrees, "SA", [], true);
      expect(result).toEqual(mockSkillTrees.SA);
    });

    it("should return SAKG when skill is SA and hasWeights is false", () => {
      const result = getSkillTree(mockSkillTrees, "SAKG", [], false);
      expect(result).toEqual(mockSkillTrees.SAKG);
    });

    it("should return SK when skill is SK and hasWeights is true", () => {
      const result = getSkillTree(mockSkillTrees, "SK", [], true);
      expect(result).toEqual(mockSkillTrees.SK);
    });

    it("should return SKKG when skill is SK and hasWeights is false", () => {
      const result = getSkillTree(mockSkillTrees, "SKKG", [], false);
      expect(result).toEqual(mockSkillTrees.SKKG);
    });

    it("should return SWR1 when skill is SWR and hasWeights is true", () => {
      const result = getSkillTree(mockSkillTrees, "SWR", [], true);
      expect(result).toEqual(mockSkillTrees.SWR1);
    });

    it("should return SWR1KG when skill is SWR and hasWeights is false", () => {
      const result = getSkillTree(mockSkillTrees, "SWR", [], false);
      expect(result).toEqual(mockSkillTrees.SWR1KG);
    });

    it("should handle SWR1 and SWR2 variants", () => {
      expect(getSkillTree(mockSkillTrees, "SWR1", [], true)).toEqual(
        mockSkillTrees.SWR1,
      );
      expect(getSkillTree(mockSkillTrees, "SWR2", [], true)).toEqual(
        mockSkillTrees.SWR1,
      );
      expect(getSkillTree(mockSkillTrees, "SWR1KG", [], false)).toEqual(
        mockSkillTrees.SWR1KG,
      );
      expect(getSkillTree(mockSkillTrees, "SWR2KG", [], false)).toEqual(
        mockSkillTrees.SWR1KG,
      );
    });

    it("should return empty object when skill tree is not found", () => {
      const result = getSkillTree(mockSkillTrees, "NONEXISTENT", [], false);
      expect(result).toEqual({});
    });

    it("should filter out branches without levels", () => {
      const treesWithEmptyLevels: Record<
        string,
        Record<string, SkillBranchType>
      > = {
        TEST: {
          branch1: {
            ...mockSkillBranch,
            levels: { 1: { exerciseId: "1" } },
          } as SkillBranchType,
          branch2: { ...mockSkillBranch, levels: {} } as SkillBranchType,
        },
      };
      const result = getSkillTree(treesWithEmptyLevels, "TEST", [], false);
      expect(Object.keys(result)).toEqual(["branch1"]);
    });

    it("should map MOBILITY to MOB and WARMUP to WU", () => {
      expect(getSkillTree(mockSkillTrees, "MOBILITY", [], false)).toEqual(
        mockSkillTrees.MOB,
      );
      expect(getSkillTree(mockSkillTrees, "WARMUP", [], false)).toEqual(
        mockSkillTrees.WU,
      );
    });

    it("should map FOAM_ROLLER to BR", () => {
      expect(getSkillTree(mockSkillTrees, "FOAM_ROLLER", [], false)).toEqual(
        mockSkillTrees.BR,
      );
    });

    it("should map STABILITY to BAS/GKS and SUPPORT to SUPPORT", () => {
      expect(getSkillTree(mockSkillTrees, "STABILITY", [], true)).toEqual(
        mockSkillTrees.BAS,
      );
      expect(getSkillTree(mockSkillTrees, "SUPPORT", [], false)).toEqual(
        mockSkillTrees.SUPPORT,
      );
    });
  });

  describe("getBranchIdByNameAndSkill", () => {
    it("should return 25 for SQUAT with SWR", () => {
      expect(getBranchIdByNameAndSkill("SQUAT", "SWR1")).toBe("25");
    });

    it("should return 143 for SQUAT with MAX", () => {
      expect(getBranchIdByNameAndSkill("SQUAT", "MAX")).toBe("143");
    });

    it("should return 219 for SQUAT with SK", () => {
      expect(getBranchIdByNameAndSkill("SQUAT", "SK")).toBe("219");
    });

    it("should return 316 for SQUAT with SA", () => {
      expect(getBranchIdByNameAndSkill("SQUAT", "SA")).toBe("316");
    });

    it("should return 663 for DEADLIFT with SWR", () => {
      expect(getBranchIdByNameAndSkill("DEADLIFT", "SWR1")).toBe("663");
    });

    it("should return 145 for DEADLIFT with MAX", () => {
      expect(getBranchIdByNameAndSkill("DEADLIFT", "MAX")).toBe("145");
    });

    it("should return 661 for DEADLIFT with SK", () => {
      expect(getBranchIdByNameAndSkill("DEADLIFT", "SK")).toBe("661");
    });

    it("should return 662 for DEADLIFT with SA", () => {
      expect(getBranchIdByNameAndSkill("DEADLIFT", "SA")).toBe("662");
    });

    it("should return 26 for BENCH_PRESS with SWR", () => {
      expect(getBranchIdByNameAndSkill("BENCH_PRESS", "SWR1")).toBe("26");
    });

    it("should return 134 for BENCH_PRESS with MAX", () => {
      expect(getBranchIdByNameAndSkill("BENCH_PRESS", "MAX")).toBe("134");
    });

    it("should return 215 for BENCH_PRESS with SK", () => {
      expect(getBranchIdByNameAndSkill("BENCH_PRESS", "SK")).toBe("215");
    });

    it("should return 314 for BENCH_PRESS with SA", () => {
      expect(getBranchIdByNameAndSkill("BENCH_PRESS", "SA")).toBe("314");
    });

    it("should return 664 for ROWING with SWR", () => {
      expect(getBranchIdByNameAndSkill("ROWING", "SWR1")).toBe("664");
    });

    it("should return 141 for ROWING with MAX", () => {
      expect(getBranchIdByNameAndSkill("ROWING", "MAX")).toBe("141");
    });

    it("should return 665 for ROWING with SK", () => {
      expect(getBranchIdByNameAndSkill("ROWING", "SK")).toBe("665");
    });

    it("should return 666 for ROWING with SA", () => {
      expect(getBranchIdByNameAndSkill("ROWING", "SA")).toBe("666");
    });

    it("should return 5 for SHOULDER_PRESS with SWR", () => {
      expect(getBranchIdByNameAndSkill("SHOULDER_PRESS", "SWR1")).toBe("5");
    });

    it("should return 140 for SHOULDER_PRESS with MAX", () => {
      expect(getBranchIdByNameAndSkill("SHOULDER_PRESS", "MAX")).toBe("140");
    });

    it("should return 667 for SHOULDER_PRESS with SK", () => {
      expect(getBranchIdByNameAndSkill("SHOULDER_PRESS", "SK")).toBe("667");
    });

    it("should return 668 for SHOULDER_PRESS with SA", () => {
      expect(getBranchIdByNameAndSkill("SHOULDER_PRESS", "SA")).toBe("668");
    });

    it("should return 53 for CALFLIFT", () => {
      expect(getBranchIdByNameAndSkill("CALFLIFT", "ANY_SKILL")).toBe("53");
    });

    it("should return -1 for unknown exercise", () => {
      expect(getBranchIdByNameAndSkill("UNKNOWN", "SWR1")).toBe("-1");
    });

    it("should return -1 when skill doesn't match any variant", () => {
      expect(getBranchIdByNameAndSkill("SQUAT", "UNKNOWN")).toBe("-1");
    });
  });

  describe("getBranchIdsByNames", () => {
    it("should map exercise names to branch IDs", () => {
      const names = ["SQUAT", "BENCH_PRESS", "DEADLIFT"];
      const result = getBranchIdsByNames(names, "SWR1");
      expect(result).toEqual(["25", "26", "663"]);
    });

    it("should return empty array for empty names", () => {
      const result = getBranchIdsByNames([], "SWR1");
      expect(result).toEqual([]);
    });

    it("should handle mixed valid and invalid names", () => {
      const names = ["SQUAT", "UNKNOWN", "BENCH_PRESS"];
      const result = getBranchIdsByNames(names, "SWR1");
      expect(result).toEqual(["25", "-1", "26"]);
    });

    it("should respect skill parameter for ID mapping", () => {
      const names = ["SQUAT"];
      const resultSWR = getBranchIdsByNames(names, "SWR1");
      const resultMAX = getBranchIdsByNames(names, "MAX");
      expect(resultSWR).toEqual(["25"]);
      expect(resultMAX).toEqual(["143"]);
    });
  });

  describe("getUserExerciseFromBranch", () => {
    it("should return exercise for user's specific progress level", () => {
      const userBranchData: UserExerciseBranchDataType = { level: 2 } as any;
      const result = getUserExerciseFromBranch(
        mockSkillBranch,
        "BEGINNER",
        mockExercises,
        userBranchData,
      );
      expect(result).toEqual(mockExercises[1]);
    });

    it("should fall back to BEGINNER level when user branch data is missing", () => {
      const result = getUserExerciseFromBranch(
        mockSkillBranch,
        "BEGINNER",
        mockExercises,
      );
      expect(result).toEqual(mockExercises[0]);
    });

    it("should return ADVANCED level (2) when user level is ADVANCED", () => {
      const result = getUserExerciseFromBranch(
        mockSkillBranch,
        "ADVANCED",
        mockExercises,
      );
      expect(result).toEqual(mockExercises[1]);
    });

    it("should return PROFESSIONAL level (3) when user level is PROFESSIONAL", () => {
      const result = getUserExerciseFromBranch(
        mockSkillBranch,
        "PROFESSIONAL",
        mockExercises,
      );
      expect(result).toEqual(mockExercises[2]);
    });

    it("should fall back to lower level if higher level not available", () => {
      const branchData: SkillBranchType = {
        ...mockSkillBranch,
        levels: { 1: { exerciseId: "1" } },
      } as SkillBranchType;
      const result = getUserExerciseFromBranch(
        branchData,
        "PROFESSIONAL",
        mockExercises,
      );
      expect(result).toEqual(mockExercises[0]);
    });

    it("should return null when exercise ID not found", () => {
      const result = getUserExerciseFromBranch(mockSkillBranch, "BEGINNER", [
        { id: "999" } as ExerciseType,
      ]);
      expect(result).toBeNull();
    });

    it("should return null when exerciseId is -1", () => {
      const branchData: SkillBranchType = {
        ...mockSkillBranch,
        levels: { 1: { exerciseId: "-1" } },
      } as SkillBranchType;
      const result = getUserExerciseFromBranch(
        branchData,
        "BEGINNER",
        mockExercises,
      );
      expect(result).toBeNull();
    });

    it("should handle legacy exerciseId property", () => {
      const branchData: SkillBranchType = {
        ...mockSkillBranch,
        levels: {
          1: { exerciseId: "1" } as any,
        },
      } as SkillBranchType;
      const result = getUserExerciseFromBranch(
        branchData,
        "BEGINNER",
        mockExercises,
      );
      expect(result).toEqual(mockExercises[0]);
    });

    it("should prefer id property over exerciseId", () => {
      const branchData: SkillBranchType = {
        ...mockSkillBranch,
        levels: {
          1: { id: "1", exerciseId: undefined } as any,
        },
      } as SkillBranchType;
      const result = getUserExerciseFromBranch(
        branchData,
        "BEGINNER",
        mockExercises,
      );
      expect(result?.id).toBe("1");
    });

    it("should prefer exerciseId when available", () => {
      const branchData: SkillBranchType = {
        ...mockSkillBranch,
        levels: {
          1: { id: "1", exerciseId: "2" } as any,
        },
      } as SkillBranchType;
      const result = getUserExerciseFromBranch(
        branchData,
        "BEGINNER",
        mockExercises,
      );
      expect(result?.id).toBe("2");
    });

    it("should log errors when log is true and exercise not found", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      getUserExerciseFromBranch(
        mockSkillBranch,
        "BEGINNER",
        [{ id: "999" } as ExerciseType],
        undefined,
        true,
      );
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Could not find exercise from branch",
        expect.anything(),
      );
      consoleSpy.mockRestore();
    });

    it("should not log errors when log is false", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();
      const branchData: SkillBranchType = {
        ...mockSkillBranch,
        levels: { 1: { exerciseId: "999" } },
      } as SkillBranchType;
      getUserExerciseFromBranch(
        branchData,
        "BEGINNER",
        mockExercises,
        undefined,
        false,
      );
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("getNextTypeFiltered", () => {
    it("should filter exercises by equipment type kg", () => {
      const items = [
        { tags: ["EQ_KG"] },
        { tags: ["EQ_DUMBBELL"] },
        { tags: ["EQ_KG"] },
      ];

      const result = getNextTypeFiltered("kg", items);
      expect(result.length).toBe(2);
      expect(result).toEqual([{ tags: ["EQ_KG"] }, { tags: ["EQ_KG"] }]);
    });

    it("should filter exercises by equipment type weight", () => {
      const items = [
        { tags: ["EQ_KG"] },
        { tags: ["EQ_DUMBBELL"] },
        { tags: ["EQ_BARBELL"] },
      ];

      const result = getNextTypeFiltered("weight", items);
      expect(result.length).toBe(2);
    });

    it("should return empty array when no exercises match", () => {
      const items = [{ tags: ["EQ_KG"] }];

      const result = getNextTypeFiltered("weight", items);
      expect(result).toEqual([]);
    });

    it("should return all when all exercises match", () => {
      const items = [{ tags: ["EQ_KG"] }, { tags: ["EQ_KG"] }];

      const result = getNextTypeFiltered("kg", items);
      expect(result).toEqual(items);
    });
  });

  describe("mapSkillCodeToFocusArea", () => {
    describe("FocusArea pass-through", () => {
      it.each([
        ["PREVENTION", "PREVENTION"],
        ["MOBILITY", "MOBILITY"],
        ["SWR", "SWR"],
        ["WARMUP", "WARMUP"],
        ["STABILITY", "STABILITY"],
        ["CARDIO", "CARDIO"],
      ])("should pass through %s unchanged", (input, expected) => {
        expect(mapSkillCodeToFocusArea(input)).toBe(expected);
      });
    });

    describe("PREVENTION codes", () => {
      it.each([
        ["PREV", "PREVENTION"],
        ["PREVKNEE", "PREVENTION"],
        ["PREVSHOULDER", "PREVENTION"],
        ["PREVWRIST", "PREVENTION"],
        ["PREVANKLE", "PREVENTION"],
        ["PREVSPINE", "PREVENTION"],
      ])("should map %s to PREVENTION", (input, expected) => {
        expect(mapSkillCodeToFocusArea(input)).toBe(expected);
      });
    });

    describe("WARMUP codes", () => {
      it.each([
        ["WU", "WARMUP"],
        ["WUPREV", "WARMUP"],
        ["WUSPEZIAL", "WARMUP"],
        ["WUSKSA", "WARMUP"],
        ["CD", "WARMUP"],
      ])("should map %s to WARMUP", (input, expected) => {
        expect(mapSkillCodeToFocusArea(input)).toBe(expected);
      });
    });

    describe("MOBILITY codes", () => {
      it.each([
        ["MOB", "MOBILITY"],
        ["BR", "MOBILITY"],
        ["FOAM_ROLLER", "MOBILITY"],
      ])("should map %s to MOBILITY", (input, expected) => {
        expect(mapSkillCodeToFocusArea(input)).toBe(expected);
      });
    });

    describe("STABILITY codes", () => {
      it.each([
        ["BAS", "STABILITY"],
        ["GKS", "STABILITY"],
        ["GKSKG", "STABILITY"],
      ])("should map %s to STABILITY", (input, expected) => {
        expect(mapSkillCodeToFocusArea(input)).toBe(expected);
      });
    });

    describe("SWR codes", () => {
      it.each([
        ["SWR1", "SWR"],
        ["SWR1KG", "SWR"],
        ["SWR2", "SWR"],
        ["SWR2KG", "SWR"],
        ["SK", "SWR"],
        ["SKKG", "SWR"],
        ["MAX", "SWR"],
        ["MAX_STRENGTH", "SWR"],
        ["main", "SWR"],
        ["PHASE", "SWR"],
        ["TEST", "SWR"],
      ])("should map %s to SWR", (input, expected) => {
        expect(mapSkillCodeToFocusArea(input)).toBe(expected);
      });
    });

    describe("CARDIO codes", () => {
      it.each([
        ["SA", "CARDIO"],
        ["SAKG", "CARDIO"],
        ["SAS", "CARDIO"],
        ["SASKG", "CARDIO"],
        ["CARDIO_1", "CARDIO"],
        ["CARDIO_1_SHORT", "CARDIO"],
        ["CARDIO_1_LAKTAT", "CARDIO"],
        ["CARDIO_2", "CARDIO"],
        ["CARDIO_3", "CARDIO"],
        ["CARDIO_4", "CARDIO"],
        ["CARDIO_5", "CARDIO"],
        ["HBCARDIO", "CARDIO"],
      ])("should map %s to CARDIO", (input, expected) => {
        expect(mapSkillCodeToFocusArea(input)).toBe(expected);
      });
    });

    describe("Non-focus skill types", () => {
      it.each([["SUPPORT"], ["POWER_ENDURANCE_SPECIAL"]])(
        "should return undefined for %s",
        (input) => {
          expect(mapSkillCodeToFocusArea(input)).toBeUndefined();
        },
      );
    });

    describe("Unknown/Invalid codes", () => {
      it.each([["UNKNOWN_SKILL"], [""], ["RANDOM_SKILL_NAME"]])(
        "should return undefined for %s",
        (input) => {
          expect(mapSkillCodeToFocusArea(input)).toBeUndefined();
        },
      );
    });
  });

  describe("isPreventionSkill", () => {
    it("returns true for PREVKNEE", () => {
      expect(isPreventionSkill("PREVKNEE")).toBeTruthy();
    });

    it("returns true for PREVSHOULDER", () => {
      expect(isPreventionSkill("PREVSHOULDER")).toBeTruthy();
    });

    it("returns true for PREVANKLE", () => {
      expect(isPreventionSkill("PREVANKLE")).toBeTruthy();
    });

    it("returns true for PREVSPINE", () => {
      expect(isPreventionSkill("PREVSPINE")).toBeTruthy();
    });

    it("should return true for PREVWRIST", () => {
      expect(isPreventionSkill("PREVWRIST")).toBeTruthy();
    });

    it("returns true for PREV (base prevention skill)", () => {
      expect(isPreventionSkill("PREV")).toBeTruthy();
    });

    it("returns true for PREVKG (prevention with bodyweight)", () => {
      expect(isPreventionSkill("PREVKG")).toBeTruthy();
    });

    it("returns false for GKS", () => {
      expect(isPreventionSkill("GKS")).toBeFalsy();
    });

    it("returns false for PLYO", () => {
      expect(isPreventionSkill("PLYO")).toBeFalsy();
    });

    it("returns false for SA", () => {
      expect(isPreventionSkill("SA")).toBeFalsy();
    });

    it("returns false for empty string", () => {
      expect(isPreventionSkill("")).toBeFalsy();
    });

    it("returns false for random skill name", () => {
      expect(isPreventionSkill("UNKNOWN_SKILL")).toBeFalsy();
    });

    it("returns false for skill containing PREV in the middle", () => {
      expect(isPreventionSkill("SOMEPREVSKILL")).toBeFalsy();
    });

    it("returns false for skill containing PREV at the end", () => {
      expect(isPreventionSkill("SKILLPREV")).toBeFalsy();
    });
  });
});
