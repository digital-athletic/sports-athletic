import { createAiwlTraining } from "@/features/training/utils/testFixtures";
import {
  generateBranchesBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import {
  isLegacyTraining,
  type LegacyTrainingType,
  readCopiedBranches,
  replaceBranchIdInWorkout,
  type UserTrainingType,
} from "./UserTraining";

const legacyTraining: LegacyTrainingType = {
  weekday: 1,
  focus: "PHASE",
  skills: { WU: [{ branchId: "410", tags: [], exercises: {} }] },
  lengths: { WU: 5 },
};

describe("readCopiedBranches", () => {
  it("returns the copied branches of a legacy training", () => {
    expect(readCopiedBranches(legacyTraining)).toBe(legacyTraining.skills);
  });

  it("returns no branches for a training stored as an AIWL workout", () => {
    expect(readCopiedBranches(createAiwlTraining())).toBeUndefined();
  });

  // Stores older than version 17 can hold a legacy training without skills.
  describe("a legacy training stored without skills", () => {
    const trainingWithoutSkills = {
      weekday: 1,
      focus: "PHASE",
      lengths: { WU: 5 },
    } as unknown as UserTrainingType;

    it("counts as a legacy training", () => {
      expect(isLegacyTraining(trainingWithoutSkills)).toBe(true);
    });

    it("returns empty branches", () => {
      expect(readCopiedBranches(trainingWithoutSkills)).toEqual({});
    });
  });
});

describe("replaceBranchIdInWorkout", () => {
  const workout = generateTemplate([
    generateBranchesBlock("WU", ["10"]),
    generateBranchesBlock("SK", ["10", "11", "10"]),
  ]);

  it("replaces the first branch ID in the blocks of the skill with one branch ID", () => {
    expect(replaceBranchIdInWorkout(workout, "SK", "10", ["20"])).toEqual(
      generateTemplate([
        generateBranchesBlock("WU", ["10"]),
        generateBranchesBlock("SK", ["20", "11", "10"]),
      ]),
    );
  });

  it("replaces one branch ID with two branch IDs", () => {
    expect(replaceBranchIdInWorkout(workout, "SK", "11", ["20", "21"])).toEqual(
      generateTemplate([
        generateBranchesBlock("WU", ["10"]),
        generateBranchesBlock("SK", ["10", "20", "21", "10"]),
      ]),
    );
  });

  it("replaces the branch ID in a later block of the skill", () => {
    const twoBlocks = generateTemplate([
      generateBranchesBlock("SK", ["11"]),
      generateBranchesBlock("SK", ["10"]),
    ]);

    expect(replaceBranchIdInWorkout(twoBlocks, "SK", "10", ["20"])).toEqual(
      generateTemplate([
        generateBranchesBlock("SK", ["11"]),
        generateBranchesBlock("SK", ["20"]),
      ]),
    );
  });

  it("returns undefined when no block of the skill plans the branch ID", () => {
    expect(
      replaceBranchIdInWorkout(workout, "MOB", "10", ["20"]),
    ).toBeUndefined();
  });

  it("leaves the given workout unchanged", () => {
    replaceBranchIdInWorkout(workout, "SK", "10", ["20"]);

    expect(workout.blocks[1]).toEqual(
      generateBranchesBlock("SK", ["10", "11", "10"]),
    );
  });
});
