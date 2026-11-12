import { drawTrainingDay } from "./trainingDayDraw";

describe("trainingDayDraw: share allocation", () => {
  it("gives every skill its start share when the start shares fill the budget", () => {
    const shares = drawTrainingDay({
      skills: [
        { skill: "A", startSeconds: 600, capSeconds: 1800 },
        { skill: "B", startSeconds: 600, capSeconds: 1800 },
      ],
      budgetSeconds: 1200,
    });

    expect(shares).toEqual([
      { skill: "A", seconds: 600 },
      { skill: "B", seconds: 600 },
    ]);
  });

  it("gives the leftover seconds to the fillFirst skill up to its cap before the other skills", () => {
    // Start shares use 1200 of 2400 s. B takes all 1200 s up to its cap of 1800 s.
    const shares = drawTrainingDay({
      skills: [
        { skill: "A", startSeconds: 600, capSeconds: 1800 },
        { skill: "B", startSeconds: 600, capSeconds: 1800 },
      ],
      budgetSeconds: 2400,
      fillFirst: "B",
    });

    expect(shares).toEqual([
      { skill: "A", seconds: 600 },
      { skill: "B", seconds: 1800 },
    ]);
  });

  it("gives the leftover seconds to the first skill in priority order up to its cap before the next skill", () => {
    // Start shares use 1200 of 2700 s. A takes 1200 s up to its cap, B the last 300 s.
    const shares = drawTrainingDay({
      skills: [
        { skill: "A", startSeconds: 600, capSeconds: 1800 },
        { skill: "B", startSeconds: 600, capSeconds: 1800 },
      ],
      budgetSeconds: 2700,
    });

    expect(shares).toEqual([
      { skill: "A", seconds: 1800 },
      { skill: "B", seconds: 900 },
    ]);
  });

  it("gives no seconds back when a start share lies above its cap", () => {
    // A starts at 220 s above its cap of 180 s and keeps 220 s; B takes only
    // the 80 s leftover of the 900 s budget.
    const shares = drawTrainingDay({
      skills: [
        { skill: "A", startSeconds: 220, capSeconds: 180 },
        { skill: "B", startSeconds: 600, capSeconds: 1800 },
      ],
      budgetSeconds: 900,
    });

    expect(shares).toEqual([
      { skill: "A", seconds: 220 },
      { skill: "B", seconds: 680 },
    ]);
  });

  it("gives every skill its start share when the start shares exceed the budget", () => {
    const shares = drawTrainingDay({
      skills: [
        { skill: "A", startSeconds: 600, capSeconds: 1800 },
        { skill: "B", startSeconds: 600, capSeconds: 1800 },
      ],
      budgetSeconds: 300,
    });

    expect(shares).toEqual([
      { skill: "A", seconds: 600 },
      { skill: "B", seconds: 600 },
    ]);
  });
});
