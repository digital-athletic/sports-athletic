import { getWorkingSetMaxFReps } from "./maxFRepetitionsUtils";

describe("getWorkingSetMaxFReps: skill separation", () => {
  it("returns working set entries only from rows of the given skill", () => {
    // Exercise 900 under MAX and MAX_STRENGTH: each row holds its own ladder
    const exerciseList = [
      {
        exerciseId: "900",
        skill: "MAX" as const,
        maxFRepetitions: [
          { level: "WARMUP" as const, repetitions: 3 },
          { level: "EASY" as const, repetitions: 5 },
        ],
      },
      {
        exerciseId: "900",
        skill: "MAX_STRENGTH" as const,
        maxFRepetitions: [{ level: "HARD" as const, repetitions: 2 }],
      },
    ];

    const result = getWorkingSetMaxFReps(exerciseList, "900", "MAX_STRENGTH");

    expect(result).toEqual([{ level: "HARD", repetitions: 2 }]);
  });
});
