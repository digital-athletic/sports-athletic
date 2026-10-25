import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateTaggedBranches } from "@test/factories/skillTree";
import { catchThrownValue } from "@test/factories/thrownValue";
import { filterBranchesByMuscleSoreness } from "./muscleSorenessRule";

const UPPER_AND_LOWER_BODY_BRANCHES = generateTaggedBranches(
  { "1": ["REGION_UPPER_BODY"], "2": ["REGION_LOWER_BODY"] },
  {},
);

describe("muscleSorenessRule: filterBranchesByMuscleSoreness", () => {
  it("removes a branch of the sore region and requests its region", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["CHEST"] });

    const result = filterBranchesByMuscleSoreness(
      UPPER_AND_LOWER_BODY_BRANCHES,
      input,
      "GKS",
    );

    expect(Object.keys(result.keep)).toEqual(["2"]);
    expect(result.removals).toEqual([
      { branchId: "1", family: "muscleSoreness", details: ["UPPER_BODY"] },
    ]);
    expect(result.replace).toEqual(["UPPER_BODY"]);
  });

  it("requests the first region of a removed branch and keeps a branch without regions", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["QUADRICEPS"] });
    const branches = generateTaggedBranches(
      {
        "1": ["REGION_FULL_BODY", "REGION_LOWER_BODY"],
        "2": ["EQ_DUMBBELL"],
      },
      {},
    );

    const result = filterBranchesByMuscleSoreness(branches, input, "GKS");

    expect(Object.keys(result.keep)).toEqual(["2"]);
    expect(result.replace).toEqual(["FULL_BODY"]);
  });

  it("keeps a cardio branch of another region on upper body soreness", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["CHEST"] });

    const result = filterBranchesByMuscleSoreness(
      UPPER_AND_LOWER_BODY_BRANCHES,
      input,
      "CARDIO_3",
    );

    expect(Object.keys(result.keep)).toEqual(["2"]);
    expect(result.replace).toEqual(["UPPER_BODY"]);
  });

  it("removes every cardio branch on lower body soreness with one request", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["QUADRICEPS"] });

    const result = filterBranchesByMuscleSoreness(
      UPPER_AND_LOWER_BODY_BRANCHES,
      input,
      "CARDIO_3",
    );

    expect(result.keep).toEqual({});
    expect(result.removals.map((removal) => removal.branchId)).toEqual([
      "1",
      "2",
    ]);
    expect(result.replace).toEqual(["LOWER_BODY"]);
  });

  it("keeps every branch of a skill that ignores muscle soreness", () => {
    const input = generateRuleFamilyInput({ soreMuscles: ["CHEST"] });

    const result = filterBranchesByMuscleSoreness(
      UPPER_AND_LOWER_BODY_BRANCHES,
      input,
      "WU",
    );

    expect(result.keep).toEqual(UPPER_AND_LOWER_BODY_BRANCHES);
    expect(result.removals).toEqual([]);
  });

  it("throws main's raw soreness error for two sore areas", () => {
    const input = generateRuleFamilyInput({
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    const thrown = catchThrownValue(() =>
      filterBranchesByMuscleSoreness(
        UPPER_AND_LOWER_BODY_BRANCHES,
        input,
        "GKS",
      ),
    );

    expect(thrown).toEqual({
      type: "TOO_MUCH_SORENESS",
      subtype: "MULTIPLE_REGIONS",
      params: ["UPPER_BODY", "LOWER_BODY"],
    });
  });

  it("does not throw for two sore areas in a skill that ignores muscle soreness", () => {
    const input = generateRuleFamilyInput({
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    const result = filterBranchesByMuscleSoreness(
      UPPER_AND_LOWER_BODY_BRANCHES,
      input,
      "MOB",
    );

    expect(result.keep).toEqual(UPPER_AND_LOWER_BODY_BRANCHES);
  });
});
