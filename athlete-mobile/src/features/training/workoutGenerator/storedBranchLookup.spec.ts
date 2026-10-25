import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { ExerciseBranchEntry } from "@/schemas/generator.schema";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { buildBranchLookupIndex } from "./branchLookupIndex";
import {
  createStoredDayBranchLookup,
  listStoredBranches,
  lookUpStoredBranchInCatalog,
} from "./storedBranchLookup";

const STALE_GKS_ENTRY: ExerciseBranchEntry = {
  branchId: "510",
  tags: ["EQ_BARBELL", "REGION_FULL_BODY"],
  exercises: { "2": { exerciseId: "375" } },
};

describe("storedBranchLookup: lookUpStoredBranchInCatalog", () => {
  it.each([
    ["GKS", "510", "GKS"],
    ["GKS", "547", "GKSKG"],
    ["PREVKNEE", "153", "PREVKG"],
    ["SWR2KG", "79", "SWR1KG"],
  ])(
    "reads the branch %s %s from the skill tree %s",
    (skill, branchId, treeName) => {
      const input = generateRuleFamilyInput();

      expect(lookUpStoredBranchInCatalog(skill, branchId, input)).toBe(
        getAllSkillTrees()[treeName][branchId],
      );
    },
  );

  it.each(["999999", "constructor", "toString", "__proto__"])(
    "finds no branch for the ID %s",
    (branchId) => {
      expect(
        lookUpStoredBranchInCatalog("GKS", branchId, generateRuleFamilyInput()),
      ).toBeUndefined();
    },
  );

  it("finds no branch without levels, as plan creation never stores one", () => {
    const input = {
      ...generateRuleFamilyInput(),
      branchLookupIndex: buildBranchLookupIndex({
        GKS: { "1": { tags: ["REGION_CORE"], levels: {} } },
      }),
    };

    expect(lookUpStoredBranchInCatalog("GKS", "1", input)).toBeUndefined();
  });
});

describe("storedBranchLookup: createStoredDayBranchLookup", () => {
  const input = generateRuleFamilyInput();

  it("reads the stored entry instead of the current catalog branch", () => {
    const lookUpStoredBranch = createStoredDayBranchLookup({
      GKS: [STALE_GKS_ENTRY],
    });

    expect(lookUpStoredBranch("GKS", "510", input)).toBe(STALE_GKS_ENTRY);
  });

  it("reads an entry whose ID no skill tree holds", () => {
    const entry = { branchId: "900001", tags: [], exercises: {} };
    const lookUpStoredBranch = createStoredDayBranchLookup({ GKS: [entry] });

    expect(lookUpStoredBranch("GKS", "900001", input)).toBe(entry);
  });

  it("reads the last entry of a repeated ID", () => {
    const first = { branchId: "510", tags: ["REGION_CORE"] };
    const lookUpStoredBranch = createStoredDayBranchLookup({
      GKS: [first, STALE_GKS_ENTRY],
    });

    expect(lookUpStoredBranch("GKS", "510", input)).toBe(STALE_GKS_ENTRY);
  });

  it.each(["SWR2KG", "constructor", "toString"])(
    "finds no entry under the skill %s",
    (skill) => {
      const lookUpStoredBranch = createStoredDayBranchLookup({
        GKS: [STALE_GKS_ENTRY],
      });

      expect(lookUpStoredBranch(skill, "510", input)).toBeUndefined();
    },
  );
});

describe("storedBranchLookup: listStoredBranches", () => {
  it("lists the found branches in stored order with repeats and drops the rest", () => {
    const trees = getAllSkillTrees();

    const storedBranches = listStoredBranches(
      {
        kind: "branches",
        skill: "GKS",
        branches: ["523", "999999", "510", "523"],
      },
      generateRuleFamilyInput(),
      lookUpStoredBranchInCatalog,
    );

    expect(storedBranches).toEqual([
      { branchId: "523", branch: trees.GKS["523"] },
      { branchId: "510", branch: trees.GKS["510"] },
      { branchId: "523", branch: trees.GKS["523"] },
    ]);
  });
});
