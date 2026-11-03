import { generateTaggedBranches } from "@test/factories/skillTree";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import { filterBranchesByGoalkeeperExclusion } from "./goalkeeperRule";

const exerciseCatalog = [
  generateTaggedExercise("goal", ["POSITION_GOAL", "REGION_LOWER_BODY"]),
  generateTaggedExercise("field", ["REGION_LOWER_BODY"]),
];
const branches = {
  ...generateTaggedBranches({ "1": [] }, { 1: { exerciseId: "field" } }),
  ...generateTaggedBranches(
    { "2": [] },
    { 1: { exerciseId: "field" }, 2: { exerciseId: "goal" } },
  ),
  ...generateTaggedBranches({ "3": ["POSITION_GOAL"] }, {}),
};

describe("goalkeeperRule: filterBranchesByGoalkeeperExclusion", () => {
  it("removes the goalkeeper exercises of a field player and names the position group", () => {
    const result = filterBranchesByGoalkeeperExclusion(
      branches,
      "FIELD_PLAYER",
      exerciseCatalog,
    );

    expect(Object.keys(result.keep)).toEqual(["1"]);
    expect(result.removals).toEqual([
      { branchId: "2", family: "goalkeeper", details: ["FIELD_PLAYER"] },
      { branchId: "3", family: "goalkeeper", details: ["FIELD_PLAYER"] },
    ]);
  });

  it("keeps the goalkeeper exercises of a goalkeeper", () => {
    const result = filterBranchesByGoalkeeperExclusion(
      branches,
      "GOALKEEPER",
      exerciseCatalog,
    );

    expect(result.keep).toEqual(branches);
    expect(result.removals).toEqual([]);
  });
});
