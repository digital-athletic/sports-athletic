import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import {
  buildPlanUser,
  generateBottleBranch,
  generatePlanWorkoutForWeekday,
  nextWeek,
  today,
} from "@test/factories/planWorkout";

describe("training day slot filling: slots that cannot be refilled", () => {
  setUpAiwlGeneratorFlag(true);

  it("drops the skill and keeps the rest of the session", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: { SWR1: [generateBottleBranch("68", "SKILL_HYPERTROPHY")] },
      lengths: { SWR1: 10 },
    });
    const result = generatePlanWorkoutForWeekday(user);
    expect(result.some((entry) => entry.skill === "WU")).toBe(true);
  });
});

describe("training day slot filling: blocked zone 5 cardio", () => {
  setUpAiwlGeneratorFlag(true);

  it("resolves the replacement run to its exercise", () => {
    const user = buildPlanUser({
      weekday: 3,
      temporalData: [{ date: today, expiration: nextWeek, tag: "QUADRICEPS" }],
      skills: {
        CARDIO_5: [
          {
            branchId: "576",
            tags: ["REGION_LOWER_BODY", "SKILL_CARDIO_5", "EQ_TREADMILL"],
            exercises: {
              "1": { exerciseId: "39" },
              "2": { exerciseId: "39" },
              "3": { exerciseId: "39" },
            },
          },
        ],
      },
      lengths: { CARDIO_5: 20 },
    });
    const result = generatePlanWorkoutForWeekday(user, {
      weekday: 3,
      place: "STUDIO",
      equipment: ["TREADMILL"],
    });
    const cardio = result.filter((entry) => entry.skill === "CARDIO_5");
    expect(cardio.map((entry) => entry.exerciseId)).toEqual(["39"]);
  });
});
