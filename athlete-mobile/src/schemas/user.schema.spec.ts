import { createAiwlTraining } from "@/features/training/utils/testFixtures";
import * as v from "valibot";
import { TrainingPlanSchema, UserTrainingSchema } from "./user.schema";

describe("UserTrainingSchema", () => {
  it("keeps the workout of a training stored as an AIWL workout", () => {
    const training = createAiwlTraining();
    expect(v.parse(UserTrainingSchema, training)).toEqual(training);
  });

  it("keeps the branches and minutes of an old training", () => {
    const training = {
      weekday: 1,
      focus: "PHASE",
      skills: { WU: [{ branchId: "410", tags: [], exercises: {} }] },
      lengths: { WU: 5 },
    };
    expect(v.parse(UserTrainingSchema, training)).toEqual(training);
  });
});

describe("TrainingPlanSchema", () => {
  it("accepts a plan without a format", () => {
    const plan = { start: "2026-10-05", sections: [] };
    expect(v.parse(TrainingPlanSchema, plan)).toEqual(plan);
  });

  it("keeps the format of an AIWL plan", () => {
    const plan = { start: "2026-10-05", format: "aiwl", sections: [] };
    expect(v.parse(TrainingPlanSchema, plan).format).toBe("aiwl");
  });

  it("rejects an unknown format", () => {
    const plan = { start: "2026-10-05", format: "new", sections: [] };
    expect(v.safeParse(TrainingPlanSchema, plan).success).toBe(false);
  });
});
