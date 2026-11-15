import type { LegacyTrainingType } from "@/features/training/models/UserTraining";
import { createAiwlTraining } from "@/features/training/utils/testFixtures";
import { buildBranchLookupIndex } from "@/features/training/workoutGenerator/generationInput/branchLookupIndex";
import type { Block } from "@/schemas/aiwl.schema";
import {
  generateSkillBranch,
  generateTreeBranch,
} from "@test/factories/skillTree";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { listPlannedExerciseIds, readPlannedBranches } from "./plannedBranches";

// GKS holds branches 10 and 11, WU branch 20 and branch 21 without levels.
const catalog = buildBranchLookupIndex({
  GKS: {
    "10": generateTreeBranch(["e10a", "e10b"], ["AGE_ADULT"]),
    "11": generateTreeBranch(["e11"]),
  },
  WU: {
    "20": generateTreeBranch(["e20"]),
    "21": generateSkillBranch([], {}),
  },
});

const legacyTraining: LegacyTrainingType = {
  weekday: 1,
  focus: "PHASE",
  skills: {
    GKS: [{ branchId: "5", tags: [], exercises: { 1: { exerciseId: "e5" } } }],
  },
  lengths: { GKS: 10 },
};

const aiwlTraining = (
  blocks: Block[] = [generateBranchesBlock("GKS", ["10"])],
) => createAiwlTraining({ workout: generateTemplate(blocks) });

describe("plannedBranches: readPlannedBranches", () => {
  it("returns the copied branches of a legacy training", () => {
    expect(readPlannedBranches(legacyTraining, catalog)).toBe(legacyTraining.skills);
  });

  it("resolves the branch IDs of an AIWL training through the catalog with tags and an exercise per level", () => {
    expect(readPlannedBranches(aiwlTraining(), catalog)).toEqual({
      GKS: [
        {
          branchId: "10",
          tags: ["AGE_ADULT"],
          exercises: { 1: { exerciseId: "e10a" }, 2: { exerciseId: "e10b" } },
        },
      ],
    });
  });

  it("joins the branch IDs of every block of a skill in block order", () => {
    const training = aiwlTraining([
      generateBranchesBlock("GKS", ["11"]),
      generateBranchesBlock("WU", ["20"]),
      generateBranchesBlock("GKS", ["10"]),
    ]);

    const branches = readPlannedBranches(training, catalog);

    expect([
      branches.GKS?.map(({ branchId }) => branchId),
      branches.WU?.map(({ branchId }) => branchId),
    ]).toEqual([["11", "10"], ["20"]]);
  });

  it("skips a branch ID the catalog lacks and a catalog branch without levels", () => {
    const training = aiwlTraining([
      generateBranchesBlock("WU", ["900001", "21", "20"]),
    ]);

    expect(
      readPlannedBranches(training, catalog).WU?.map(
        ({ branchId }) => branchId,
      ),
    ).toEqual(["20"]);
  });

  it("skips a block of another kind than branches", () => {
    const training = aiwlTraining([generatePicksBlock("WU")]);

    expect(readPlannedBranches(training, catalog)).toEqual({});
  });
});

describe("plannedBranches: listPlannedExerciseIds", () => {
  it("lists the exercises of every level of old and AIWL trainings once", () => {
    const trainings = [
      legacyTraining,
      aiwlTraining([generateBranchesBlock("GKS", ["10", "11", "10"])]),
    ];

    expect(listPlannedExerciseIds(trainings, catalog)).toEqual([
      "e5",
      "e10a",
      "e10b",
      "e11",
    ]);
  });

  it("lists nothing for an AIWL training whose branch IDs the catalog lacks", () => {
    const trainings = [
      aiwlTraining([generateBranchesBlock("GKS", ["900001"])]),
    ];

    expect(listPlannedExerciseIds(trainings, catalog)).toEqual([]);
  });
});
