import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import {
  generateSkillBranch,
  generateTreeBranch,
} from "@test/factories/skillTree";
import {
  buildBranchLookupIndex,
  loadBranchLookupIndex,
} from "./branchLookupIndex";

describe("branchLookupIndex: branch IDs across all skill trees", () => {
  it("holds every branch ID in exactly one skill tree", () => {
    const skillTreeNamesByBranchId = new Map<string, string[]>();
    for (const [skillTreeName, skillTree] of Object.entries(
      getAllSkillTrees(),
    )) {
      for (const branchId of Object.keys(skillTree)) {
        skillTreeNamesByBranchId.set(branchId, [
          ...(skillTreeNamesByBranchId.get(branchId) ?? []),
          skillTreeName,
        ]);
      }
    }

    const sharedBranchIds = [...skillTreeNamesByBranchId].filter(
      ([, skillTreeNames]) => skillTreeNames.length > 1,
    );

    expect(sharedBranchIds).toEqual([]);
  });

  it("indexes every branch of every skill tree", () => {
    const branchCount = Object.values(getAllSkillTrees()).reduce(
      (count, skillTree) => count + Object.keys(skillTree).length,
      0,
    );

    expect(loadBranchLookupIndex().size).toBe(branchCount);
  });
});

describe("branchLookupIndex: buildBranchLookupIndex", () => {
  it.each([
    ["510", "GKS"],
    ["547", "GKSKG"],
    ["644", "PREV"],
    ["153", "PREVKG"],
    ["79", "SWR1KG"],
  ])(
    "maps the branch ID %s to its branch in the %s tree",
    (branchId, skillTreeName) => {
      const index = buildBranchLookupIndex(getAllSkillTrees());

      expect(index.get(branchId)).toEqual({
        branchId,
        skillTreeName,
        branch: getAllSkillTrees()[skillTreeName][branchId],
      });
    },
  );

  it("returns undefined for an ID that no tree holds", () => {
    const index = buildBranchLookupIndex(getAllSkillTrees());

    expect(index.get("999999")).toBeUndefined();
  });

  it.each(["constructor", "toString", "__proto__"])(
    "returns undefined for the inherited key %s as branch ID",
    (branchId) => {
      const index = buildBranchLookupIndex(getAllSkillTrees());

      expect(index.get(branchId)).toBeUndefined();
    },
  );

  it("keeps a branch without levels", () => {
    const index = buildBranchLookupIndex({
      GKS: { "1": generateSkillBranch([], {}) },
    });

    expect(index.get("1")).toEqual({
      branchId: "1",
      skillTreeName: "GKS",
      branch: { tags: [], levels: {} },
    });
  });

  it("throws when two skill trees hold the same branch ID", () => {
    const skillTrees = {
      GKS: { "1": generateTreeBranch(["10"]) },
      GKSKG: { "1": generateTreeBranch(["11"]) },
    };

    expect(() => buildBranchLookupIndex(skillTrees)).toThrow(
      "Branch ID 1 appears in the skill trees GKS and GKSKG",
    );
  });

  it("leaves the skill trees unchanged", () => {
    const skillTrees = { GKS: { "1": generateTreeBranch(["10"]) } };

    buildBranchLookupIndex(skillTrees);

    expect(skillTrees).toEqual({ GKS: { "1": generateTreeBranch(["10"]) } });
  });
});

describe("branchLookupIndex: loadBranchLookupIndex", () => {
  it("builds the index once from the loaded skill trees", () => {
    expect(loadBranchLookupIndex()).toBe(loadBranchLookupIndex());
    expect(loadBranchLookupIndex().get("510")?.skillTreeName).toBe("GKS");
  });
});
