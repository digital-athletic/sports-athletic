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
        "1": { id: "100" },
        "2": { id: "101" },
      },
    };

    const result = v.safeParse(SkillBranchSchema, branch);
    expect(result.success).toBe(true);
  });

  test("validates a skill tree structure", () => {
    const skillTree = {
      branch1: {
        tags: ["TAG1"],
        levels: { "1": { id: "100" } },
      },
      branch2: {
        tags: ["TAG2", "TAG3"],
        levels: { "1": { id: "200" }, "2": { id: "201" } },
      },
    };

    const result = v.safeParse(SkillTreeSchema, skillTree);
    expect(result.success).toBe(true);
  });

  test("rejects skill branch with invalid level key", () => {
    const invalidBranch = {
      tags: ["TAG1"],
      levels: {
        "not-a-number": { id: "100" },
      },
    };

    const result = v.safeParse(SkillBranchSchema, invalidBranch);
    expect(result.success).toBe(false);
  });
});
