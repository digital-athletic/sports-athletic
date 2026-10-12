import { SharedConstants } from "@/constants/sharedConstants";
import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { planStartDateFor } from "./planStartDate";

const DAY = SharedConstants.TIME_IN_MS.DAY;
const today = new Date(2026, 9, 12, 10);

const plan = {
  start: "2026-08-03",
  sections: [],
} as unknown as TrainingPlanType;

const workoutDaysAgo = (days: number) => [today.getTime() - days * DAY];

describe("planStartDateFor", () => {
  it("keeps the start of the existing plan for the same season phase", () => {
    const start = planStartDateFor({
      trainingPlan: plan,
      sameSeasonPhase: true,
      workoutTimestamps: workoutDaysAgo(3),
      today,
    });
    expect(start).toEqual(new Date(2026, 7, 3));
  });

  it("starts from today for a changed season phase", () => {
    const start = planStartDateFor({
      trainingPlan: plan,
      sameSeasonPhase: false,
      workoutTimestamps: workoutDaysAgo(3),
      today,
    });
    expect(start).toEqual(today);
  });

  it("starts from today after a training gap of more than 21 days", () => {
    const start = planStartDateFor({
      trainingPlan: plan,
      sameSeasonPhase: true,
      workoutTimestamps: workoutDaysAgo(22),
      today,
    });
    expect(start).toEqual(today);
  });

  it("starts from today without an existing plan", () => {
    const start = planStartDateFor({
      trainingPlan: undefined,
      sameSeasonPhase: false,
      workoutTimestamps: [],
      today,
    });
    expect(start).toEqual(today);
  });
});
