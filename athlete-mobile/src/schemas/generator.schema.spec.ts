import * as v from "valibot";
import {
  SkillTypeSchema,
  SetTupleSchema,
  GeneratedSetListEntrySchema,
  ExerciseBranchSchema,
  toUserExerciseData,
  toUserExerciseDataList,
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

    it("validates entry with repetitionMAX field", () => {
      const entryWithRepMAX = {
        ...validEntry,
        repetitionMAX: { level: "EASY", repetitions: 5 },
      };
      expect(v.is(GeneratedSetListEntrySchema, entryWithRepMAX)).toBe(true);
    });

    it("validates entry without repetitionMAX (optional)", () => {
      expect(v.is(GeneratedSetListEntrySchema, validEntry)).toBe(true);
    });
  });

  describe("toUserExerciseData", () => {
    const baseEntry: GeneratedSetListEntryFromSchema = {
      branchId: "branch-1",
      exerciseId: "ex-123",
      set: [1, 3],
      skill: "MAX",
    };

    it("maps repetitionMAX to maxFRepetitions as single-element array", () => {
      const entry = {
        ...baseEntry,
        repetitionMAX: { level: "EASY", repetitions: 5 },
      };
      const result = toUserExerciseData(entry);
      expect(result.maxFRepetitions).toEqual([
        { level: "EASY", repetitions: 5 },
      ]);
    });

    it("returns maxFRepetitions as undefined when repetitionMAX is absent", () => {
      const result = toUserExerciseData(baseEntry);
      expect(result.maxFRepetitions).toBeUndefined();
    });

    it("preserves all other fields in conversion", () => {
      const entry = {
        ...baseEntry,
        duration: 30,
        repetition: 8,
        weight: 80,
        height: 1,
        weightType: "weightAbsolute",
        repetitionMAX: { level: "HARD", repetitions: 3 },
      };
      const result = toUserExerciseData(entry);
      expect(result).toEqual({
        exerciseId: "ex-123",
        set: [1, 3],
        skill: "MAX",
        duration: 30,
        repetition: 8,
        weight: 80,
        height: 1,
        weightType: "weightAbsolute",
        branchId: "branch-1",
        maxFRepetitions: [{ level: "HARD", repetitions: 3 }],
      });
    });
  });

  describe("toUserExerciseDataList", () => {
    it("maps array correctly, preserving maxFRepetitions on entries that have it", () => {
      const entries: GeneratedSetListEntryFromSchema[] = [
        {
          branchId: "branch-1",
          exerciseId: "ex-1",
          set: [1, 3],
          skill: "MAX",
          repetitionMAX: { level: "EASY", repetitions: 5 },
        },
        {
          branchId: "branch-2",
          exerciseId: "ex-2",
          set: [2, 3],
          skill: "WU",
        },
      ];
      const results = toUserExerciseDataList(entries);
      expect(results[0].maxFRepetitions).toEqual([
        { level: "EASY", repetitions: 5 },
      ]);
      expect(results[1].maxFRepetitions).toBeUndefined();
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
