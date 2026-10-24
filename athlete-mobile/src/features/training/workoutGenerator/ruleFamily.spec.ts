import { listBranchRemovals, readReplacementRegion } from "./ruleFamily";

describe("ruleFamily: listBranchRemovals", () => {
  it("lists the candidates missing from keep, in candidate order, with their details", () => {
    const branches = {
      "3": { tags: [] },
      "1": { tags: [] },
      "2": { tags: [] },
    };

    const removals = listBranchRemovals(
      branches,
      { "1": branches["1"] },
      "equipment",
      (branchId) => [`MISSING_${branchId}`],
    );

    expect(removals).toEqual([
      { branchId: "2", family: "equipment", details: ["MISSING_2"] },
      { branchId: "3", family: "equipment", details: ["MISSING_3"] },
    ]);
  });

  it("lists nothing when keep holds every candidate", () => {
    const branches = { "1": { tags: [] } };

    expect(listBranchRemovals(branches, branches, "gender", () => [])).toEqual(
      [],
    );
  });
});

describe("ruleFamily: readReplacementRegion", () => {
  it("reads the first region tag only", () => {
    expect(
      readReplacementRegion([
        "EQ_DUMBBELL",
        "REGION_FULL_BODY",
        "REGION_LOWER_BODY",
      ]),
    ).toEqual(["FULL_BODY"]);
  });

  it("reads no region for a branch without region tags or tags", () => {
    expect(readReplacementRegion(["EQ_DUMBBELL"])).toEqual([]);
    expect(readReplacementRegion()).toEqual([]);
  });
});
