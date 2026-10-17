import type { ExerciseBranchType } from "@/features/training/models/ExerciseBranch";
import type { BranchDataMapType } from "@/store/exerciseProgressStore";
import {
  getRaisedSubstituteLevel,
  getSubstitutionTargetLevel,
} from "./substitutionLevelUtils";

const substitute = (levels: number[]): ExerciseBranchType => ({
  branchId: "80",
  tags: [],
  exercises: Object.fromEntries(
    levels.map((level) => [level, { exerciseId: `80${level}` }]),
  ),
});

const stored = (level: number): BranchDataMapType => ({
  "80": { branchId: "80", level },
});

describe("substitutionLevelUtils: getSubstitutionTargetLevel", () => {
  it.each([
    ["BEGINNER", 1],
    ["ADVANCED", 2],
    ["PROFESSIONAL", 3],
  ])(
    "targets the entry level of a %s athlete for a never trained branch",
    (userLevel, expected) => {
      expect(getSubstitutionTargetLevel("80", {}, userLevel)).toBe(expected);
    },
  );

  it("targets the stored level above the entry level", () => {
    expect(getSubstitutionTargetLevel("80", stored(4), "ADVANCED")).toBe(4);
  });

  it("targets the entry level above the stored level", () => {
    expect(getSubstitutionTargetLevel("80", stored(1), "ADVANCED")).toBe(2);
  });
});

describe("substitutionLevelUtils: getRaisedSubstituteLevel", () => {
  it("raises nothing for a never trained branch", () => {
    expect(getRaisedSubstituteLevel(substitute([1, 2]), {}, "ADVANCED")).toBe(
      null,
    );
  });

  it("raises a stored level below the entry level to the entry level", () => {
    expect(
      getRaisedSubstituteLevel(substitute([1, 2]), stored(1), "ADVANCED"),
    ).toEqual({ branchId: "80", level: 2, exerciseId: "802" });
  });

  it("raises a professional athlete to the highest authored level below the entry level", () => {
    expect(
      getRaisedSubstituteLevel(substitute([1, 2]), stored(1), "PROFESSIONAL"),
    ).toEqual({ branchId: "80", level: 2, exerciseId: "802" });
  });

  it("raises nothing when no level between the stored and the entry level is authored", () => {
    expect(
      getRaisedSubstituteLevel(substitute([1, 3]), stored(1), "ADVANCED"),
    ).toBe(null);
  });

  it("raises nothing for a stored level at or above the entry level", () => {
    expect(
      getRaisedSubstituteLevel(substitute([2, 3]), stored(3), "ADVANCED"),
    ).toBe(null);
  });
});
