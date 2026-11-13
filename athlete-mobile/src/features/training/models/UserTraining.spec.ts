import { createAiwlTraining } from "@/features/training/utils/testFixtures";
import {
  isLegacyTraining,
  type LegacyTrainingType,
  readCopiedBranches,
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
