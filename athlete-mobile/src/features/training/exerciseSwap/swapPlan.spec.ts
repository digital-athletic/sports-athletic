import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { TrainingSectionType } from "@/features/training/models/TrainingSection";
import { generateLowerBodyBranch } from "@test/factories/skillTree";
import {
  collectPlanSwaps,
  resolvePlanSectionIndex,
  toExerciseBranch,
} from "./swapPlan";

/**
 * Builds a plan section starting on the given day, e.g.
 * { start: "2026-10-05", numOfWeeks: 4, type: "BASE", cardioType: "NONE", trainings: [] }.
 */
const generatePlanSection = (start: string): TrainingSectionType =>
  ({
    start,
    numOfWeeks: 4,
    type: "BASE",
    cardioType: "NONE",
    trainings: [],
  }) as unknown as TrainingSectionType;

/**
 * Builds a plan with sections on 5 October, 2 November and 30 November 2026.
 */
const generateThreeSectionPlan = (): TrainingPlanType => ({
  start: "2026-10-05",
  sections: ["2026-10-05", "2026-11-02", "2026-11-30"].map(generatePlanSection),
});

describe("swapPlan: toExerciseBranch", () => {
  it("names the catalog levels as plan exercises", () => {
    const branch = generateLowerBodyBranch({ 1: { exerciseId: "e1" } });

    expect(toExerciseBranch({ branchId: "7", branch })).toEqual({
      branchId: "7",
      tags: branch.tags,
      exercises: { 1: { exerciseId: "e1" } },
    });
  });
});

describe("swapPlan: collectPlanSwaps", () => {
  it("collects each exercise moved to an alternative", () => {
    const alternative = {
      branchId: "20",
      branch: generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
    };

    expect(
      collectPlanSwaps({
        "10": { skill: "SK", position: 1, alternatives: [alternative] },
      }),
    ).toEqual([
      {
        skill: "SK",
        originalBranchId: "10",
        branch: toExerciseBranch(alternative),
      },
    ]);
  });

  it("leaves out exercises cycled back to the original", () => {
    const alternative = {
      branchId: "20",
      branch: generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
    };

    expect(
      collectPlanSwaps({
        "10": { skill: "SK", position: 0, alternatives: [alternative] },
      }),
    ).toEqual([]);
  });
});

describe("swapPlan: resolvePlanSectionIndex", () => {
  it("uses the given section", () => {
    expect(
      resolvePlanSectionIndex(
        generateThreeSectionPlan(),
        2,
        new Date("2026-11-10T12:00:00"),
      ),
    ).toBe(2);
  });

  it("uses the section of today without a given section", () => {
    expect(
      resolvePlanSectionIndex(
        generateThreeSectionPlan(),
        undefined,
        new Date("2026-11-10T12:00:00"),
      ),
    ).toBe(1);
  });

  it("reads a given section 0 as the section of today, as generation does", () => {
    expect(
      resolvePlanSectionIndex(
        generateThreeSectionPlan(),
        0,
        new Date("2026-11-10T12:00:00"),
      ),
    ).toBe(1);
  });
});
