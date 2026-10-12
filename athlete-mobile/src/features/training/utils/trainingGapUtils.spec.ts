import type { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import {
  daysSinceLastTraining,
  getTrainingGapAction,
  shiftPlanForTrainingGap,
} from "./trainingGapUtils";

const today = new Date(2026, 9, 12);
const daysAgo = (days: number) =>
  new Date(2026, 9, 12 - days, 18, 30).getTime();

const plan = {
  start: "2026-08-03",
  sections: [
    { start: "2026-08-03", numOfWeeks: 4, type: "SWR1", trainings: [] },
    { start: "2026-08-31", numOfWeeks: 6, type: "SWR2", trainings: [] },
  ],
} as unknown as TrainingPlanType;

describe("getTrainingGapAction", () => {
  it.each([0, 1, 7])("changes nothing after %i days", (days) => {
    expect(getTrainingGapAction(days)).toBe("NONE");
  });

  it.each([8, 14, 21])("shifts the plan after %i days", (days) => {
    expect(getTrainingGapAction(days)).toBe("SHIFT");
  });

  it.each([22, 60])("prompts for a new plan after %i days", (days) => {
    expect(getTrainingGapAction(days)).toBe("PROMPT_NEW_PLAN");
  });
});

describe("daysSinceLastTraining", () => {
  it("counts no gap without any workout", () => {
    expect(daysSinceLastTraining([], plan, today)).toBe(0);
  });

  it("counts calendar days since the last workout", () => {
    expect(daysSinceLastTraining([daysAgo(10)], plan, today)).toBe(10);
  });

  it("counts from the latest workout whatever the list order", () => {
    expect(daysSinceLastTraining([daysAgo(3), daysAgo(30)], plan, today)).toBe(
      3,
    );
  });

  it("counts from the day the plan was last shifted when that is later", () => {
    const shifted = { ...plan, gapShiftedOn: "2026-10-09" };
    expect(daysSinceLastTraining([daysAgo(20)], shifted, today)).toBe(3);
  });

  it("counts from the last workout when it is later than the shift", () => {
    const shifted = { ...plan, gapShiftedOn: "2026-09-01" };
    expect(daysSinceLastTraining([daysAgo(2)], shifted, today)).toBe(2);
  });
});

describe("shiftPlanForTrainingGap", () => {
  it("moves every section start forward by the missed weeks", () => {
    const shifted = shiftPlanForTrainingGap(plan, 15, today);
    expect(shifted.sections.map((section) => section.start)).toEqual([
      "2026-08-17",
      "2026-09-14",
    ]);
  });

  it("records the day of the shift so it is not applied again", () => {
    expect(shiftPlanForTrainingGap(plan, 15, today).gapShiftedOn).toBe(
      "2026-10-12",
    );
  });

  it("keeps the stored plan unchanged", () => {
    shiftPlanForTrainingGap(plan, 15, today);
    expect(plan.sections[0].start).toBe("2026-08-03");
  });
});
