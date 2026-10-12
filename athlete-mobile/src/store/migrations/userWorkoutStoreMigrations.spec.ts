import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import type { State } from "../userWorkoutStore";
import { userWorkoutStoreMigrations } from "./userWorkoutStoreMigrations";

const stateWith = (trainingPlan: TrainingPlanType | null): State => ({
  workoutData: {
    sport: "OTHER_SPORT",
    tags: { LEVEL: ["ADVANCED"] },
    seasonPhase: { type: null, endDate: "2026-12-31" },
    maxValues: DEFAULT_MAX_VALUES,
  },
  trainingPlan,
});

const plan = { start: "2026-10-05", sections: [] } as TrainingPlanType;

describe("userWorkoutStoreMigrations", () => {
  describe("v16 to v17: marks stored plans for a check", () => {
    it("marks a stored plan for a check", () => {
      const result = userWorkoutStoreMigrations[16](stateWith(plan));
      expect(result.planCheckPending).toBe(true);
    });

    it("leaves the stored plan unchanged", () => {
      const result = userWorkoutStoreMigrations[16](stateWith(plan));
      expect(result.trainingPlan).toBe(plan);
    });

    it("marks nothing when no plan is stored", () => {
      const result = userWorkoutStoreMigrations[16](stateWith(null));
      expect(result.planCheckPending).toBeFalsy();
    });
  });
});
