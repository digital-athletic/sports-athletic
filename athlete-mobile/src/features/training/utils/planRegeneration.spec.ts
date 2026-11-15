import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import {
  type AiwlTrainingType,
  type LegacyTrainingType,
  readCopiedBranches,
  type UserTrainingType,
} from "@/features/training/models/UserTraining";
import { createAiwlTraining } from "@/features/training/utils/testFixtures";
import type { Block } from "@/schemas/aiwl.schema";
import {
  generateBranchesBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { keepUnchangedTrainingDays } from "./planRegeneration";

const branch = (branchId: string) => ({ branchId, tags: [], exercises: {} });

const training = (
  overrides: Partial<LegacyTrainingType> & { branchId: string },
): LegacyTrainingType => ({
  weekday: 1,
  focus: "PHASE",
  skills: { SWR1: [branch(overrides.branchId)] },
  lengths: { SWR1: 40 },
  equipment: ["DUMBBELL", "MAT"],
  ...overrides,
});

const planWith = (...trainings: UserTrainingType[]): TrainingPlanType =>
  ({
    start: "2026-10-12",
    sections: [
      {
        start: "2026-10-12",
        numOfWeeks: 4,
        type: "SWR1",
        cardioType: "CARDIO_3",
        trainings,
      },
    ],
  }) as TrainingPlanType;

const keptBranchId = (oldPlan: TrainingPlanType, newPlan: TrainingPlanType) =>
  readCopiedBranches(
    keepUnchangedTrainingDays(oldPlan, newPlan).sections[0].trainings[0],
  )?.SWR1?.[0].branchId;

const keptTraining = (oldPlan: TrainingPlanType, newPlan: TrainingPlanType) =>
  keepUnchangedTrainingDays(oldPlan, newPlan).sections[0].trainings[0];

describe("keepUnchangedTrainingDays", () => {
  it("keeps the old branches of a day whose focus, skills, minutes and equipment stayed the same", () => {
    expect(
      keptBranchId(
        planWith(training({ branchId: "old" })),
        planWith(training({ branchId: "new" })),
      ),
    ).toBe("old");
  });

  it("redraws a day whose place equipment changed", () => {
    expect(
      keptBranchId(
        planWith(training({ branchId: "old" })),
        planWith(
          training({ branchId: "new", equipment: ["DUMBBELL", "KETTLEBELL"] }),
        ),
      ),
    ).toBe("new");
  });

  it("redraws a day whose focus changed", () => {
    expect(
      keptBranchId(
        planWith(training({ branchId: "old" })),
        planWith(training({ branchId: "new", focus: "CARDIO" })),
      ),
    ).toBe("new");
  });

  it("redraws a day whose minute budgets changed", () => {
    expect(
      keptBranchId(
        planWith(training({ branchId: "old" })),
        planWith(training({ branchId: "new", lengths: { SWR1: 45 } })),
      ),
    ).toBe("new");
  });

  it("redraws a day whose skill list changed", () => {
    expect(
      keptBranchId(
        planWith(training({ branchId: "old" })),
        planWith(
          training({
            branchId: "new",
            skills: { SWR1: [branch("new")], MOB: [branch("mob")] },
          }),
        ),
      ),
    ).toBe("new");
  });

  it("redraws a day of an old plan that stored no equipment", () => {
    expect(
      keptBranchId(
        planWith(training({ branchId: "old", equipment: undefined })),
        planWith(training({ branchId: "new" })),
      ),
    ).toBe("new");
  });

  it("redraws a day that the old plan held on another weekday", () => {
    expect(
      keptBranchId(
        planWith(training({ branchId: "old", weekday: 2 })),
        planWith(training({ branchId: "new" })),
      ),
    ).toBe("new");
  });

  it("redraws a day that the old plan stored as an AIWL workout", () => {
    expect(
      keptBranchId(
        planWith(createAiwlTraining()),
        planWith(training({ branchId: "new" })),
      ),
    ).toBe("new");
  });

  it("keeps a day that the new plan stores as an AIWL workout as generated", () => {
    const aiwlTraining = createAiwlTraining();
    expect(
      keptTraining(
        planWith(training({ branchId: "old" })),
        planWith(aiwlTraining),
      ),
    ).toBe(aiwlTraining);
  });
});

describe("keepUnchangedTrainingDays: regeneration with the other plan generator", () => {
  const legacyPlan = planWith(
    training({ branchId: "old", weekday: 1 }),
    training({ branchId: "old", weekday: 3 }),
  );
  const aiwlPlan: TrainingPlanType = {
    ...planWith(
      createAiwlTraining({ weekday: 1 }),
      createAiwlTraining({ weekday: 3 }),
    ),
    format: "aiwl",
  };

  it("writes every day of a legacy plan new as an AIWL workout without legacy fields", () => {
    const plan = keepUnchangedTrainingDays(legacyPlan, aiwlPlan);

    expect(plan.format).toBe("aiwl");
    expect(plan.sections[0].trainings).toEqual(aiwlPlan.sections[0].trainings);
    for (const day of plan.sections[0].trainings) {
      expect(Object.keys(day)).not.toContain("skills");
      expect(Object.keys(day)).not.toContain("lengths");
    }
  });

  it("writes every day of an AIWL plan new as a legacy day without a workout", () => {
    const plan = keepUnchangedTrainingDays(aiwlPlan, legacyPlan);

    expect(plan.format).toBeUndefined();
    expect(plan.sections[0].trainings).toEqual(
      legacyPlan.sections[0].trainings,
    );
    for (const day of plan.sections[0].trainings) {
      expect(Object.keys(day)).not.toContain("workout");
    }
  });
});

describe("keepUnchangedTrainingDays: AIWL trainings", () => {
  const aiwlTraining = (
    blocks: Block[],
    overrides: Partial<AiwlTrainingType> = {},
  ) => createAiwlTraining({ workout: generateTemplate(blocks), ...overrides });

  const oldDay = aiwlTraining([
    generateBranchesBlock("WU", ["410"], { duration: 300 }),
    generateBranchesBlock("SWR1", ["old1", "old2"], { duration: 1800 }),
  ]);

  it("keeps the old branch IDs of a day whose focus, blocks, durations and equipment stayed the same", () => {
    const newDay = aiwlTraining([
      generateBranchesBlock("WU", ["411"], { duration: 300 }),
      generateBranchesBlock("SWR1", ["new1", "new2"], { duration: 1800 }),
    ]);

    expect(keptTraining(planWith(oldDay), planWith(newDay))).toEqual({
      ...newDay,
      workout: oldDay.workout,
    });
  });

  it("redraws a day whose block duration changed", () => {
    const newDay = aiwlTraining([
      generateBranchesBlock("WU", ["411"], { duration: 300 }),
      generateBranchesBlock("SWR1", ["new1"], { duration: 2100 }),
    ]);

    expect(keptTraining(planWith(oldDay), planWith(newDay))).toBe(newDay);
  });

  it("redraws a day whose block skills changed", () => {
    const newDay = aiwlTraining([
      generateBranchesBlock("WU", ["411"], { duration: 300 }),
      generateBranchesBlock("MOB", ["new1"], { duration: 1800 }),
    ]);

    expect(keptTraining(planWith(oldDay), planWith(newDay))).toBe(newDay);
  });

  it("redraws a day with another number of blocks", () => {
    const newDay = aiwlTraining([
      generateBranchesBlock("WU", ["411"], { duration: 300 }),
    ]);

    expect(keptTraining(planWith(oldDay), planWith(newDay))).toBe(newDay);
  });

  it("redraws a day whose place equipment changed", () => {
    const newDay = aiwlTraining(oldDay.workout.blocks, {
      equipment: ["KETTLEBELL"],
    });

    expect(keptTraining(planWith(oldDay), planWith(newDay))).toBe(newDay);
  });

  it("redraws a day whose focus changed", () => {
    const newDay = aiwlTraining(oldDay.workout.blocks, { focus: "CARDIO" });

    expect(keptTraining(planWith(oldDay), planWith(newDay))).toBe(newDay);
  });
});
