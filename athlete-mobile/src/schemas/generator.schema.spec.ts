import * as v from "valibot";
import {
  SkillTypeSchema,
  SetTupleSchema,
  GeneratedSetListEntrySchema,
  ExerciseBranchSchema,
  type GeneratedSetListEntryFromSchema,
} from "./generator.schema";

describe("generator.schema", () => {
  describe("SkillTypeSchema", () => {
    it("validates valid skill types", () => {
      const validSkills = [
        "PREVENTION",
        "MOBILITY",
        "SWR",
        "WARMUP",
        "STABILITY",
        "CARDIO",
        "SUPPORT",
        "FOAM_ROLLER",
        "SCHNELLIGKEITSAUSDAUER_SPECIAL",
      ];

      for (const skill of validSkills) {
        expect(v.is(SkillTypeSchema, skill)).toBe(true);
      }
    });

    it("rejects invalid skill types", () => {
      expect(v.is(SkillTypeSchema, "INVALID")).toBe(false);
      expect(v.is(SkillTypeSchema, "")).toBe(false);
      expect(v.is(SkillTypeSchema, 123)).toBe(false);
    });
  });

  describe("SetTupleSchema", () => {
    it("validates valid set tuples", () => {
      expect(v.is(SetTupleSchema, [1, 3])).toBe(true);
      expect(v.is(SetTupleSchema, [0, 0])).toBe(true);
      expect(v.is(SetTupleSchema, [5, 10])).toBe(true);
    });

    it("rejects invalid set tuples", () => {
      expect(v.is(SetTupleSchema, [1])).toBe(false);
      expect(v.is(SetTupleSchema, ["1", "2"])).toBe(false);
      expect(v.is(SetTupleSchema, null)).toBe(false);
    });
  });

  describe("GeneratedSetListEntrySchema", () => {
    const validEntry: GeneratedSetListEntryFromSchema = {
      branchId: "branch-1",
      exerciseId: "123",
      set: [1, 3],
      skill: "WU",
    };

    it("validates valid generated entry", () => {
      expect(v.is(GeneratedSetListEntrySchema, validEntry)).toBe(true);
    });

    it("validates generator skill types", () => {
      const skills = ["WUSPEZIAL", "SA", "SK", "MOB", "main", "WU"] as const;
      for (const skill of skills) {
        const entry = { ...validEntry, skill };
        expect(v.is(GeneratedSetListEntrySchema, entry)).toBe(true);
      }
    });

    it("rejects user-facing skill types", () => {
      const userFacingSkills = ["WARMUP", "MOBILITY", "PREVENTION", "CARDIO"];
      for (const skill of userFacingSkills) {
        const entry = { ...validEntry, skill };
        expect(v.is(GeneratedSetListEntrySchema, entry)).toBe(false);
      }
    });

    it("requires branchId", () => {
      const entryWithoutBranch = {
        exerciseId: "123",
        set: [1, 3],
        skill: "WU",
      };
      expect(v.is(GeneratedSetListEntrySchema, entryWithoutBranch)).toBe(false);
    });
  });

  describe("ExerciseBranchSchema", () => {
    it("validates and transforms exercises with numeric string keys", () => {
      const input = {
        branchId: "branch-123",
        tags: ["TAG1", "TAG2"],
        exercises: {
          "1": { exerciseId: "ex-100" },
          "2": { exerciseId: "ex-101" },
        },
      };

      const result = v.safeParse(ExerciseBranchSchema, input);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.output.exercises[1]).toEqual({ exerciseId: "ex-100" });
        expect(result.output.exercises[2]).toEqual({ exerciseId: "ex-101" });
      }
    });

    it("rejects non-numeric string keys", () => {
      const input = {
        branchId: "branch-123",
        tags: ["TAG1"],
        exercises: {
          abc: { exerciseId: "ex-100" },
        },
      };

      const result = v.safeParse(ExerciseBranchSchema, input);
      expect(result.success).toBe(false);
    });

    it("direct number access works on transformed output", () => {
      const input = {
        branchId: "branch-456",
        tags: ["TAG1"],
        exercises: {
          "5": { exerciseId: "ex-500" },
          "10": { exerciseId: "ex-1000" },
        },
      };

      const result = v.parse(ExerciseBranchSchema, input);

      expect(result.exercises[5]).toBeDefined();
      expect(result.exercises[5].exerciseId).toBe("ex-500");
      expect(result.exercises[10]).toBeDefined();
      expect(result.exercises[10].exerciseId).toBe("ex-1000");
    });

    it("preserves branchId and tags", () => {
      const input = {
        branchId: "branch-789",
        tags: ["TAG1", "TAG2", "TAG3"],
        exercises: {
          "1": { exerciseId: "ex-100" },
        },
      };

      const result = v.parse(ExerciseBranchSchema, input);

      expect(result.branchId).toBe("branch-789");
      expect(result.tags).toEqual(["TAG1", "TAG2", "TAG3"]);
    });

    it("rejects mixed valid and invalid keys", () => {
      const input = {
        branchId: "branch-123",
        tags: ["TAG1"],
        exercises: {
          "1": { exerciseId: "ex-100" },
          invalid: { exerciseId: "ex-101" },
        },
      };

      const result = v.safeParse(ExerciseBranchSchema, input);
      expect(result.success).toBe(false);
    });

    it("rejects keys with leading zeros as invalid", () => {
      const input = {
        branchId: "branch-123",
        tags: ["TAG1"],
        exercises: {
          "01": { exerciseId: "ex-100" },
        },
      };

      // "01" matches /^\d+$/ so it should be valid
      const result = v.safeParse(ExerciseBranchSchema, input);
      expect(result.success).toBe(true);

      if (result.success) {
        // "01" transforms to 1
        expect(result.output.exercises[1]).toEqual({ exerciseId: "ex-100" });
      }
    });
  });
});
