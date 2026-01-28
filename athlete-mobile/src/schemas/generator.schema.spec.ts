import * as v from "valibot";
import {
  SkillTypeSchema,
  SetTupleSchema,
  GeneratedSetListEntrySchema,
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
});
