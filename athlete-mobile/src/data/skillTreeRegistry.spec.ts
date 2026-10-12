import type { SkillTree } from "@/constants/workoutConstants";
import {
  getSkillTree,
  getAllSkillTrees,
  getSkillTreeNames,
  clearSkillTreeRegistry,
} from "./skillTreeRegistry";

describe("skillTreeRegistry", () => {
  beforeEach(() => {
    clearSkillTreeRegistry();
  });

  describe("singleton behavior", () => {
    it("returns the same object reference on multiple calls", () => {
      expect(getAllSkillTrees()).toBe(getAllSkillTrees());
    });
  });

  describe("getAllSkillTrees", () => {
    it("returns all 27 skill trees", () => {
      const trees = getAllSkillTrees();

      expect(Object.keys(trees)).toHaveLength(27);
    });
  });

  describe("getSkillTreeNames", () => {
    it("returns all expected skill tree names", () => {
      const names = getSkillTreeNames();

      expect(names).toEqual(
        expect.arrayContaining([
          "BAS",
          "BR",
          "CARDIO_1_LAKTAT",
          "CARDIO_1_SHORT",
          "CARDIO_2",
          "CD",
          "GKS",
          "MAX",
          "MOB",
          "PLYO",
          "PREV",
          "SA",
          "SK",
          "SUPPORT",
          "SWR1",
          "WU",
        ]),
      );
    });
  });

  describe("getSkillTree", () => {
    it("returns BAS skill tree with 19 branches", () => {
      const bas = getSkillTree("BAS");

      expect(Object.keys(bas!)).toHaveLength(19);
      expect(Object.keys(bas!)).toContain("548");
      expect(Object.keys(bas!)).toContain("549");
    });

    it("returns branch 548 with expected structure and tags", () => {
      const bas = getSkillTree("BAS")!;
      const branch548 = bas["548"];

      expect(branch548.tags).toContain("EQ_TYPE_KG");
      expect(branch548.tags).toContain("MUSCLE_QUADRICEPS");
      expect(branch548.tags).toContain("PLACE_HOME");
      expect(branch548.levels).toBeDefined();
      expect(Object.keys(branch548.levels).length).toBeGreaterThan(0);
    });

    it("returns the exact same object reference as in getAllSkillTrees", () => {
      const allTrees = getAllSkillTrees();

      expect(getSkillTree("BAS")).toBe(allTrees["BAS"]);
      expect(getSkillTree("SWR1")).toBe(allTrees["SWR1"]);
    });

    it("returns undefined for non-existent skill tree", () => {
      expect(getSkillTree("NONEXISTENT" as SkillTree)).toBeUndefined();
    });
  });

  describe("tags", () => {
    it("holds no branch with a doubled muscle prefix", () => {
      const malformed = Object.entries(getAllSkillTrees()).flatMap(
        ([treeName, tree]) =>
          Object.entries(tree)
            .filter(([, branch]) =>
              branch.tags.some((tag) => tag.startsWith("MUSCLE_MUSCLE_")),
            )
            .map(([branchId]) => `${treeName}/${branchId}`),
      );
      expect(malformed).toEqual([]);
    });
  });

  describe("clearSkillTreeRegistry", () => {
    it("creates a new object instance after clearing", () => {
      const before = getAllSkillTrees();
      clearSkillTreeRegistry();

      expect(getAllSkillTrees()).not.toBe(before);
    });
  });
});
