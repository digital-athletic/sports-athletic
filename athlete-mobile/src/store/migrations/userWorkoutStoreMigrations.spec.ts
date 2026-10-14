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
  describe("v17 to v18: renames German skill tags in the stored plan", () => {
    const planWithMaxBranch = {
      start: "2026-10-05",
      sections: [
        {
          type: "MAX",
          trainings: [
            {
              weekday: 2,
              skills: {
                MAX_STRENGTH: [
                  {
                    branchId: "133",
                    tags: ["SKILL_MAX_KRAFT", "PLACE_STUDIO"],
                    exercises: {},
                  },
                ],
              },
              lengths: { MAX_STRENGTH: 30 },
              focus: "PHASE",
            },
          ],
        },
      ],
    } as unknown as TrainingPlanType;

    it("renames the branch tags", () => {
      const result = userWorkoutStoreMigrations[17](
        stateWith(planWithMaxBranch),
      );
      expect(
        result.trainingPlan?.sections[0].trainings[0].skills.MAX_STRENGTH?.[0]
          .tags,
      ).toEqual(["SKILL_MAX_STRENGTH", "PLACE_STUDIO"]);
    });

    it("keeps the workout data", () => {
      const state = stateWith(planWithMaxBranch);
      const result = userWorkoutStoreMigrations[17](state);
      expect(result.workoutData).toBe(state.workoutData);
    });

    it("leaves a missing plan missing", () => {
      const result = userWorkoutStoreMigrations[17](stateWith(null));
      expect(result.trainingPlan).toBeNull();
    });
  });

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
