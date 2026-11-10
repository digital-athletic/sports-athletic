import { generateTaggedBranches } from "@test/factories/skillTree";
import { filterPositionTagOnlyBranches } from "./positionTagRule";

describe("positionTagRule: filterPositionTagOnlyBranches", () => {
  it("keeps a goalkeeper exercise that carries other tags", () => {
    const branches = generateTaggedBranches({
      "1": ["POSITION_GOAL", "REGION_LOWER_BODY"],
      "2": ["REGION_LOWER_BODY"],
    });

    const result = filterPositionTagOnlyBranches(branches);

    expect(result.keep).toEqual(branches);
    expect(result.removals).toEqual([]);
  });

  it("removes a branch whose only tag is the goalkeeper tag", () => {
    const branches = generateTaggedBranches({
      "1": ["POSITION_GOAL"],
      "2": [],
    });

    const result = filterPositionTagOnlyBranches(branches);

    expect(Object.keys(result.keep)).toEqual(["2"]);
    expect(result.removals).toEqual([
      { branchId: "1", family: "positionTagOnly", details: [] },
    ]);
  });
});
