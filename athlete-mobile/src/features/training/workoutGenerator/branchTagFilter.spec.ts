import { generateTaggedBranches } from "@test/factories/skillTree";
import { filterBranchesByTags } from "./branchTagFilter";

describe("branchTagFilter: filterBranchesByTags", () => {
  it.each<{ behaviour: string; tags: string[]; kept: string[] }>([
    {
      behaviour: "keeps every branch for an empty tag list",
      tags: [],
      kept: ["knee", "shoulder", "warmUp", "untagged"],
    },
    {
      behaviour: "needs one listed tag of every named group",
      tags: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"],
      kept: ["knee"],
    },
    {
      behaviour: "accepts any listed tag within a group",
      tags: ["SKILL_WARM_UP", "SKILL_PREVENTION", "PREVENTION_KNEE_HIP"],
      kept: ["knee", "warmUp"],
    },
    {
      behaviour: "lets a branch without a region tag match every region",
      tags: ["REGION_UPPER_BODY"],
      kept: ["shoulder", "warmUp", "untagged"],
    },
    {
      behaviour: "counts EQ_TYPE_WEIGHTS to its own group, not to EQ",
      tags: ["EQ_TYPE_WEIGHTS", "EQ_DUMBBELL"],
      kept: [],
    },
  ])("$behaviour", ({ tags, kept }) => {
    const branches = generateTaggedBranches({
      knee: ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP", "REGION_LOWER_BODY"],
      shoulder: ["SKILL_PREVENTION", "PREVENTION_SHOULDER", "EQ_DUMBBELL"],
      warmUp: ["SKILL_WARM_UP", "PREVENTION_KNEE_HIP", "EQ_TYPE_WEIGHTS"],
      untagged: ["SKILL_PREVENTION"],
    });

    expect(Object.keys(filterBranchesByTags(branches, tags))).toEqual(kept);
  });

  it("matches only branches carrying a tag outside every tag group", () => {
    const branches = generateTaggedBranches({
      carrier: ["CUSTOM_X", "SKILL_PREVENTION"],
      other: ["SKILL_PREVENTION"],
      untagged: [],
    });

    expect(Object.keys(filterBranchesByTags(branches, ["CUSTOM_X"]))).toEqual([
      "carrier",
    ]);
  });

  it("keeps the branch values by identity", () => {
    const branches = generateTaggedBranches({ a: ["SKILL_WARM_UP"] });

    expect(filterBranchesByTags(branches, ["SKILL_WARM_UP"]).a).toBe(
      branches.a,
    );
  });
});
