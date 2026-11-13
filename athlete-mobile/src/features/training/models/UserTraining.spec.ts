import { createAiwlTraining } from "@/features/training/utils/testFixtures";
import {
  isOldTraining,
  type OldTrainingType,
  readCopiedBranches,
  type UserTrainingType,
} from "./UserTraining";

const oldTraining: OldTrainingType = {
  weekday: 1,
  focus: "PHASE",
  skills: { WU: [{ branchId: "410", tags: [], exercises: {} }] },
  lengths: { WU: 5 },
};

describe("readCopiedBranches", () => {
  it("returns the copied branches of an old training", () => {
    expect(readCopiedBranches(oldTraining)).toBe(oldTraining.skills);
  });

  it("returns no branches for a training stored as an AIWL workout", () => {
    expect(readCopiedBranches(createAiwlTraining())).toBeUndefined();
  });

  // Stores older than version 17 can hold an old training without skills.
  describe("an old training stored without skills", () => {
    const trainingWithoutSkills = {
      weekday: 1,
      focus: "PHASE",
      lengths: { WU: 5 },
    } as unknown as UserTrainingType;

    it("counts as an old training", () => {
      expect(isOldTraining(trainingWithoutSkills)).toBe(true);
    });

    it("returns empty branches", () => {
      expect(readCopiedBranches(trainingWithoutSkills)).toEqual({});
    });
  });
});
