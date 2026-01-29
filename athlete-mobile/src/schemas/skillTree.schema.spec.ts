import { transformSkillTree } from "@/utils/skillTreeTransform";
import * as v from "valibot";
import BAS from "../../assets/data/generator/skillTrees/BAS.json";
import WU from "../../assets/data/generator/skillTrees/WU.json";
import { SkillBranchSchema, SkillTreeSchema } from "./skillTree.schema";

describe("SkillTreeSchema", () => {
  test("validates transformed BAS.json", () => {
    const transformed = transformSkillTree(
      BAS as Parameters<typeof transformSkillTree>[0],
    );
    const result = v.safeParse(SkillTreeSchema, transformed);

    if (!result.success) {
      console.error("Validation issues:", v.flatten(result.issues));
    }

    expect(result.success).toBe(true);
  });

  test("validates transformed WU.json", () => {
    const transformed = transformSkillTree(
      WU as Parameters<typeof transformSkillTree>[0],
    );
    const result = v.safeParse(SkillTreeSchema, transformed);

    if (!result.success) {
      console.error("Validation issues:", v.flatten(result.issues));
    }

    expect(result.success).toBe(true);
  });

  test("validates a single skill branch", () => {
    const branch = {
      tags: ["TAG1", "TAG2"],
      levels: {
        "1": { exerciseId: "100" },
        "2": { exerciseId: "101" },
      },
    };

    const result = v.safeParse(SkillBranchSchema, branch);
    expect(result.success).toBe(true);
  });

  test("validates a skill tree structure", () => {
    const skillTree = {
      branch1: {
        tags: ["TAG1"],
        levels: { "1": { exerciseId: "100" } },
      },
      branch2: {
        tags: ["TAG2", "TAG3"],
        levels: { "1": { exerciseId: "200" }, "2": { exerciseId: "201" } },
      },
    };

    const result = v.safeParse(SkillTreeSchema, skillTree);
    expect(result.success).toBe(true);
  });

  test("rejects skill branch with invalid level key", () => {
    const invalidBranch = {
      tags: ["TAG1"],
      levels: {
        "not-a-number": { exerciseId: "100" },
      },
    };

    const result = v.safeParse(SkillBranchSchema, invalidBranch);
    expect(result.success).toBe(false);
  });

  test("transform converts string keys to number keys", () => {
    const input = {
      tags: ["TAG1"],
      levels: { "1": { exerciseId: "100" }, "2": { exerciseId: "101" } },
    };
    const result = v.parse(SkillBranchSchema, input);

    expect(result.levels[1]).toEqual({ exerciseId: "100" });
    expect(result.levels[2]).toEqual({ exerciseId: "101" });
  });

  test("direct number access works on transformed output", () => {
    const input = {
      tags: ["TAG1", "TAG2"],
      levels: { "5": { exerciseId: "500" }, "10": { exerciseId: "1000" } },
    };
    const result = v.parse(SkillBranchSchema, input);

    expect(result.levels[5]).toBeDefined();
    expect(result.levels[5].exerciseId).toBe("500");
    expect(result.levels[10]).toBeDefined();
    expect(result.levels[10].exerciseId).toBe("1000");
  });

  test("transformed output preserves tags array", () => {
    const input = {
      tags: ["TAG1", "TAG2", "TAG3"],
      levels: { "1": { exerciseId: "100" } },
    };
    const result = v.parse(SkillBranchSchema, input);

    expect(result.tags).toEqual(["TAG1", "TAG2", "TAG3"]);
  });
});
