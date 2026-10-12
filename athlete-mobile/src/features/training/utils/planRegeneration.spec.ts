import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { UserTrainingType } from "@/features/training/models/UserTraining";
import { keepUnchangedTrainingDays } from "./planRegeneration";

const branch = (branchId: string) => ({ branchId, tags: [], exercises: {} });

const training = (
  overrides: Partial<UserTrainingType> & { branchId: string },
): UserTrainingType => ({
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
  keepUnchangedTrainingDays(oldPlan, newPlan).sections[0].trainings[0].skills
    .SWR1?.[0].branchId;

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
});
