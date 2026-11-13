import { createAiwlTraining } from "@/features/training/utils/testFixtures";
import { type OldTrainingType, readCopiedBranches } from "./UserTraining";

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
});
