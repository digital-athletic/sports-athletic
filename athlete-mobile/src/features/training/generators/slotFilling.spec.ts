import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import {
  buildPlanUser,
  generateBottleBranch,
  generatePlanWorkoutForWeekday,
  generatePreventionBranch,
  importTrees,
  nextWeek,
  today,
} from "@test/factories/planWorkout";

describe.each([false, true])("AIWL generator flag %s", (flagEnabled) => {
  setUpAiwlGeneratorFlag(flagEnabled);

  describe("generatePlanWorkout: slots that cannot be refilled", () => {
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

  describe("generatePlanWorkout: blocked zone 5 cardio", () => {
    it("resolves the replacement run to its exercise", () => {
      const user = buildPlanUser({
        weekday: 3,
        temporalData: [
          { date: today, expiration: nextWeek, tag: "QUADRICEPS" },
        ],
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
});

// These cases hand the generator a reduced skill tree map to make a refill
// impossible. Only the old path reads the map it is given; the AIWL path reads
// the registry through the branch lookup index, so they stay flag off.
describe("generatePlanWorkout: slots that cannot be refilled from the given trees", () => {
  setUpAiwlGeneratorFlag(false);

  it("aborts when no skill of the session can be filled", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        WU: [generateBottleBranch("901", "SKILL_WARM_UP")],
        SWR1: [generateBottleBranch("68", "SKILL_HYPERTROPHY")],
      },
      lengths: { SWR1: 10 },
    });
    expect(() =>
      generatePlanWorkoutForWeekday(user, {
        skillTrees: importTrees("CARDIO_4", "CARDIO_5"),
      }),
    ).toThrow(
      expect.objectContaining({ type: "NO_EXERCISES", subtype: "EQUIPMENT" }),
    );
  });

  it("drops a prevention skill whose slots only refill from another prevention region", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        PREVKNEE: [
          {
            ...generatePreventionBranch("800", "KNEE", "EQ_BOTTLE"),
            exercises: generatePreventionBranch("800", "KNEE", "EQ_BOTTLE")
              .levels,
          },
        ],
      },
      lengths: { PREVKNEE: 10 },
    });
    user.workoutData!.tags = {
      ...user.workoutData!.tags,
      PAIN: ["KNEE_LEFT", "SHOULDER_LEFT"],
    };
    const shoulderOnly = generatePreventionBranch(
      "810",
      "SHOULDER",
      "EQ_TYPE_KG",
    );

    const result = generatePlanWorkoutForWeekday(user, {
      skillTrees: {
        ...importTrees("WU", "CARDIO_4", "CARDIO_5"),
        PREV: {},
        PREVKG: { "810": shoulderOnly },
      },
    });

    expect(result.filter((entry) => entry.skill?.startsWith("PREV"))).toEqual(
      [],
    );
  });
});
