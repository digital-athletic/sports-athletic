import { readPlanFormat, type TrainingPlanType } from "./TrainingPlan";

const plan: TrainingPlanType = { start: "2026-10-05", sections: [] };

describe("readPlanFormat", () => {
  it("counts a plan without a format as an old plan", () => {
    expect(readPlanFormat(plan)).toBe("old");
  });

  it("reads the format an old plan stores", () => {
    expect(readPlanFormat({ ...plan, format: "old" })).toBe("old");
  });

  it("reads the format an AIWL plan stores", () => {
    expect(readPlanFormat({ ...plan, format: "aiwl" })).toBe("aiwl");
  });
});
