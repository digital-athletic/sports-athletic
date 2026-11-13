import { readPlanFormat, type TrainingPlanType } from "./TrainingPlan";

const plan: TrainingPlanType = { start: "2026-10-05", sections: [] };

describe("readPlanFormat", () => {
  it("counts a plan without a format as a legacy plan", () => {
    expect(readPlanFormat(plan)).toBe("legacy");
  });

  it("reads the format a legacy plan stores", () => {
    expect(readPlanFormat({ ...plan, format: "legacy" })).toBe("legacy");
  });

  it("reads the format an AIWL plan stores", () => {
    expect(readPlanFormat({ ...plan, format: "aiwl" })).toBe("aiwl");
  });
});
