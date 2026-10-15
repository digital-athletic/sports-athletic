import * as v from "valibot";
import { loadSkillPriorities } from "./loadSkillPriorities";
import { SkillPrioritiesSchema } from "@/schemas/generator.schema";

const validPriorities = {
  CHILD: {
    pain: { phase: { "0": ["PHASE", "PREV1"] } },
    noPain: { phase: { "0": ["PHASE", "WU"] } },
  },
  ADULT: {
    pain: { combined: { "0": ["PHASE", "HBCARDIO"] } },
    noPain: { stability: { "0": ["GKS", "BAS", "MOB"] } },
  },
};

describe("loadSkillPriorities", () => {
  it("parses the real file", () => {
    const priorities = loadSkillPriorities();

    expect(priorities.CHILD.noPain.phase?.["20"]).toEqual(["BAS"]);
    expect(priorities.ADULT.pain.stability?.["0"]).toEqual([
      "PREV3",
      "WUSPEZIAL",
      "GKS",
      "BAS",
      "MOB",
    ]);
  });

  it("returns a fresh copy on every call", () => {
    const first = loadSkillPriorities();
    first.CHILD.noPain.phase = {};

    expect(loadSkillPriorities().CHILD.noPain.phase?.["0"]).toEqual([
      "PHASE",
      "WU",
    ]);
  });
});

describe("SkillPrioritiesSchema", () => {
  it("accepts known skill codes and placeholders", () => {
    expect(v.safeParse(SkillPrioritiesSchema, validPriorities).success).toBe(
      true,
    );
  });

  it("rejects an unknown skill code", () => {
    const invalid = structuredClone(validPriorities);
    invalid.CHILD.noPain.phase["0"] = ["PHASE", "WUU"];

    expect(v.safeParse(SkillPrioritiesSchema, invalid).success).toBe(false);
  });

  it("rejects a non numeric minute key", () => {
    const invalid = structuredClone(validPriorities);
    Object.assign(invalid.CHILD.noPain.phase, { abc: ["WU"] });

    expect(v.safeParse(SkillPrioritiesSchema, invalid).success).toBe(false);
  });
});
