import { generateSkillSteps } from "@test/factories/skillSteps";
import { drawTrainingDay, type SkillSecondsEstimate } from "./trainingDayDraw";

// 600 s (10 min) per exercise, so the estimate of a step equals its table minutes.
const estimate: SkillSecondsEstimate = (_skill, exerciseCount) =>
  exerciseCount * 600;

describe("trainingDayDraw: minute allocation", () => {
  it("gives every skill its smallest step when the smallest steps fill the budget", () => {
    const draw = drawTrainingDay(
      {
        skills: [
          generateSkillSteps({ skill: "A" }),
          generateSkillSteps({ skill: "B" }),
        ],
        budgetMinutes: 20,
      },
      estimate,
    );

    expect(draw).toEqual([
      { skill: "A", stepIndex: 0, stepMinutes: 10 },
      { skill: "B", stepIndex: 0, stepMinutes: 10 },
    ]);
  });

  it("gives the leftover minutes to the fillFirst skill up to its cap before the other skills", () => {
    // Smallest steps use 20 of 40 minutes. B takes the 20 leftover minutes up
    // to its cap of 30, so A keeps 10 minutes.
    const draw = drawTrainingDay(
      {
        skills: [
          generateSkillSteps({ skill: "A" }),
          generateSkillSteps({ skill: "B" }),
        ],
        budgetMinutes: 40,
        fillFirst: "B",
      },
      estimate,
    );

    expect(draw.map(({ skill, stepIndex }) => [skill, stepIndex])).toEqual([
      ["A", 0],
      ["B", 2],
    ]);
  });

  it("gives the leftover minutes to the first skill in priority order up to its cap before the next skill", () => {
    // Smallest steps use 20 of 40 minutes. A takes the 20 leftover minutes up
    // to its cap of 30, so B keeps 10 minutes.
    const draw = drawTrainingDay(
      {
        skills: [
          generateSkillSteps({ skill: "A" }),
          generateSkillSteps({ skill: "B" }),
        ],
        budgetMinutes: 40,
      },
      estimate,
    );

    expect(draw.map(({ skill, stepIndex }) => [skill, stepIndex])).toEqual([
      ["A", 2],
      ["B", 0],
    ]);
  });

  it("takes the step nearest to the minutes of a skill even when the day ends above the budget", () => {
    // A takes 20 leftover minutes up to its cap of 30, B the last 6: 16 minutes
    // lie nearest to the 20 minute step, so the day ends at 50 of 46 minutes.
    const draw = drawTrainingDay(
      {
        skills: [
          generateSkillSteps({ skill: "A" }),
          generateSkillSteps({ skill: "B" }),
        ],
        budgetMinutes: 46,
      },
      estimate,
    );

    expect(draw.map(({ skill, stepIndex }) => [skill, stepIndex])).toEqual([
      ["A", 2],
      ["B", 1],
    ]);
  });

  it("takes the smaller step when the minutes of a skill lie halfway between two steps", () => {
    const draw = drawTrainingDay(
      { skills: [generateSkillSteps({ skill: "A" })], budgetMinutes: 15 },
      estimate,
    );

    expect(draw).toEqual([{ skill: "A", stepIndex: 0, stepMinutes: 10 }]);
  });

  it("compares the cap with the estimated minutes of a skill", () => {
    // 900 s (15 min) per exercise: A gets 15 + 5 minutes up to its cap of 20,
    // which lie nearer to the 15 minute estimate than to the 30 minute one.
    const draw = drawTrainingDay(
      {
        skills: [generateSkillSteps({ skill: "A", maxMinutes: 20 })],
        budgetMinutes: 100,
      },
      (_skill, exerciseCount) => exerciseCount * 900,
    );

    expect(draw).toEqual([{ skill: "A", stepIndex: 0, stepMinutes: 10 }]);
  });

  it("gives every skill its smallest step when the smallest steps exceed the budget", () => {
    const draw = drawTrainingDay(
      {
        skills: [
          generateSkillSteps({ skill: "A" }),
          generateSkillSteps({ skill: "B" }),
        ],
        budgetMinutes: 5,
      },
      estimate,
    );

    expect(draw).toEqual([
      { skill: "A", stepIndex: 0, stepMinutes: 10 },
      { skill: "B", stepIndex: 0, stepMinutes: 10 },
    ]);
  });
});
