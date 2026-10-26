import {
  buildPlanUser,
  importTrees,
  nextWeek,
  noExerciseData,
  realExercises,
  today,
} from "../../../../test/factories/planWorkout";
import TrainingGenerator from "./TrainingGenerator";

const bottleBranch = (branchId: string, skillTag: string) => ({
  branchId,
  tags: [
    "EQ_BOTTLE",
    "EQ_TYPE_EQUIPMENT",
    "PLACE_HALL",
    "REGION_CORE",
    skillTag,
  ],
  exercises: {
    "1": { exerciseId: "223" },
    "2": { exerciseId: "224" },
    "3": { exerciseId: "224" },
  },
});

describe("generatePlanWorkout: slots that cannot be refilled", () => {
  it("drops the skill and keeps the rest of the session", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: { SWR1: [bottleBranch("68", "SKILL_HYPERTROPHY")] },
      lengths: { SWR1: 10 },
    });
    const result = new TrainingGenerator().generatePlanWorkout(
      "PLAN",
      user,
      "HALL",
      realExercises,
      importTrees("WU", "CARDIO_4", "CARDIO_5"),
      1,
      [],
      undefined,
      0,
      noExerciseData,
    );
    expect(result.some((entry) => entry.skill === "WU")).toBe(true);
  });

  it("aborts when no skill of the session can be filled", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        WU: [bottleBranch("901", "SKILL_WARM_UP")],
        SWR1: [bottleBranch("68", "SKILL_HYPERTROPHY")],
      },
      lengths: { SWR1: 10 },
    });
    expect(() =>
      new TrainingGenerator().generatePlanWorkout(
        "PLAN",
        user,
        "HALL",
        realExercises,
        importTrees("CARDIO_4", "CARDIO_5"),
        1,
        [],
        undefined,
        0,
        noExerciseData,
      ),
    ).toThrow(
      expect.objectContaining({ type: "NO_EXERCISES", subtype: "EQUIPMENT" }),
    );
  });
});

describe("generatePlanWorkout: prevention replacements", () => {
  const preventionBranch = (
    branchId: string,
    region: string,
    equipment: string,
  ) => ({
    tags: [
      `PREVENTION_${region}`,
      "SKILL_PREVENTION",
      "REGION_LOWER_BODY",
      equipment,
    ],
    levels: {
      "1": { exerciseId: "431" },
      "2": { exerciseId: "432" },
      "3": { exerciseId: "432" },
    },
    branchId,
  });

  it("drops a prevention skill whose slots only refill from another prevention region", () => {
    const user = buildPlanUser({
      weekday: 1,
      skills: {
        PREVKNEE: [
          {
            ...preventionBranch("800", "KNEE", "EQ_BOTTLE"),
            exercises: preventionBranch("800", "KNEE", "EQ_BOTTLE").levels,
          },
        ],
      },
      lengths: { PREVKNEE: 10 },
    });
    user.workoutData!.tags = {
      ...user.workoutData!.tags,
      PAIN: ["KNEE_LEFT", "SHOULDER_LEFT"],
    };
    const shoulderOnly = preventionBranch("810", "SHOULDER", "EQ_TYPE_KG");

    const result = new TrainingGenerator().generatePlanWorkout(
      "PLAN",
      user,
      "HALL",
      realExercises,
      {
        ...importTrees("WU", "CARDIO_4", "CARDIO_5"),
        PREV: {},
        PREVKG: { "810": shoulderOnly },
      },
      1,
      [],
      undefined,
      0,
      noExerciseData,
    );

    expect(result.filter((entry) => entry.skill?.startsWith("PREV"))).toEqual(
      [],
    );
  });
});

describe("generatePlanWorkout: blocked zone 5 cardio", () => {
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
    const result = new TrainingGenerator().generatePlanWorkout(
      "PLAN",
      user,
      "STUDIO",
      realExercises,
      importTrees("WU", "CARDIO_4", "CARDIO_5"),
      3,
      ["TREADMILL"],
      undefined,
      0,
      noExerciseData,
    );
    const cardio = result.filter((entry) => entry.skill === "CARDIO_5");
    expect(cardio.map((entry) => entry.exerciseId)).toEqual(["39"]);
  });
});
