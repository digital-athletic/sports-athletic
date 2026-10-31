import { WorkoutConstants } from "@/constants/workoutConstants";
import {
  estimateExerciseSeconds,
  estimateMaxStrengthExerciseSeconds,
  estimateSkillSeconds,
} from "./durationEstimate";

describe("durationEstimate: max strength", () => {
  it("adds warm up, working, support and closing seconds for a professional exercise", () => {
    // Warm up: (6 + 5) reps x 4 s + 2 x 60 s rest = 164 s
    // Working at the start of the ladder: (3 + 3 + 2 + 2) reps x 4 s = 40 s
    // 3 gaps: (2 x max(8 x 4 s, 30 s) + 30 + 60 + 90) s = 244 s each, 732 s
    // Last set: 120 s rest
    // (164 + 40 + 732 + 120) s = 1056 s, x 1.1 = 1161.6 s
    expect(
      estimateMaxStrengthExerciseSeconds(WorkoutConstants.LEVELS.PROFESSIONAL),
    ).toBeCloseTo(1161.6);
  });

  it("adds warm up, working, support and closing seconds for an advanced exercise", () => {
    // Warm up: (6 + 5) reps x 4 s + 2 x 60 s rest = 164 s
    // Working at the start of the ladder: (5 + 2 + 2) reps x 4 s = 36 s
    // 2 gaps: (2 x max(8 x 4 s, 30 s) + 30 + 60 + 30) s = 184 s each, 368 s
    // Last set: 120 s rest
    // (164 + 36 + 368 + 120) s = 688 s, x 1.1 = 756.8 s
    expect(
      estimateMaxStrengthExerciseSeconds(WorkoutConstants.LEVELS.ADVANCED),
    ).toBeCloseTo(756.8);
  });

  it("counts each max strength exercise of a skill in full", () => {
    const single = estimateSkillSeconds({
      skill: "MAX",
      level: WorkoutConstants.LEVELS.PROFESSIONAL,
      exerciseCount: 1,
      minutes: 15,
    });

    expect(
      estimateSkillSeconds({
        skill: "MAX",
        level: WorkoutConstants.LEVELS.PROFESSIONAL,
        exerciseCount: 2,
        minutes: 15,
      }),
    ).toBeCloseTo(2 * single);
  });
});

describe("durationEstimate: standard exercise", () => {
  it("counts the duration of a timed set instead of repetitions", () => {
    // 2 sets x 30 s + 1 rest of 10 s + closing rest of 10 s = 80 s, x 1.1 = 88 s
    expect(
      estimateExerciseSeconds({
        sets: 2,
        restBetweenSetsSeconds: 10,
        closingRestSeconds: 10,
        work: { durationSeconds: 30 },
      }),
    ).toBeCloseTo(88);
  });

  it("counts 4 seconds per repetition for a repetition set", () => {
    // 3 sets x 10 reps x 4 s + 2 rests of 60 s + closing rest of 90 s = 330 s, x 1.1 = 363 s
    expect(
      estimateExerciseSeconds({
        sets: 3,
        restBetweenSetsSeconds: 60,
        closingRestSeconds: 90,
        work: { repetitions: 10 },
      }),
    ).toBeCloseTo(363);
  });
});

describe("durationEstimate: standard skill", () => {
  const advanced = WorkoutConstants.LEVELS.ADVANCED;

  it("counts the longer start of the weighted and the bodyweight intensity config", () => {
    // GKS and GKSKG both start at 8 reps x 4 s = 32 s, longer than 30 s.
    // 2 sets x 32 s + 1 rest of 90 s + closing rest of 90 s = 244 s, x 1.1 = 268.4 s
    expect(
      estimateSkillSeconds({
        skill: "GKS",
        level: advanced,
        exerciseCount: 1,
        minutes: 10,
      }),
    ).toBeCloseTo(268.4);
  });

  it("counts the start value of a prevention pair and ignores its target value", () => {
    // PREV starts at 40 s (10 reps x 4 s = 40 s); the estimate ignores its target of 60 s.
    // A round: 40 s + 30 s within superset + 40 s = 110 s.
    // 2 rounds with 1 rest of 30 s and a closing rest of 60 s:
    // (220 + 30 + 60) s = 310 s, x 1.1 = 341 s
    expect(
      estimateSkillSeconds({
        skill: "PREVKNEE",
        level: advanced,
        exerciseCount: 2,
        minutes: 10,
      }),
    ).toBeCloseTo(341);
  });

  it("adds no warm up set to WUSKSA", () => {
    // WUSKSA starts at 12 reps x 4 s = 48 s in 1 set with a closing rest of 30 s.
    // (48 + 30) s = 78 s, x 1.1 = 85.8 s
    expect(
      estimateSkillSeconds({
        skill: "WUSKSA",
        level: advanced,
        exerciseCount: 1,
        minutes: 10,
      }),
    ).toBeCloseTo(85.8);
  });

  it("counts a 60 second rest after the warm up set of a single hypertrophy exercise", () => {
    // SWR2 start: 8 reps x 4 s = 32 s.
    // Warm up set: 32 s + 60 s rest. Set 1: 32 s + 90 s rest.
    // Set 2: 32 s + closing rest of 90 s.
    // (92 + 122 + 122) s = 336 s, x 1.1 = 369.6 s
    expect(
      estimateSkillSeconds({
        skill: "SWR2",
        level: advanced,
        exerciseCount: 1,
        minutes: 10,
      }),
    ).toBeCloseTo(369.6);
  });

  it("counts the rest between sets after the warm up set of a single explosive power exercise", () => {
    // SK start: 4 reps x 4 s = 16 s. Warm up set: 16 s + 180 s rest.
    // Set 1: 16 s + 180 s rest. Set 2: 16 s + closing rest of 180 s.
    // (196 + 196 + 196) s = 588 s, x 1.1 = 646.8 s
    expect(
      estimateSkillSeconds({
        skill: "SK",
        level: advanced,
        exerciseCount: 1,
        minutes: 10,
      }),
    ).toBeCloseTo(646.8);
  });

  it("adds the warm up set as one more round of a superset pair", () => {
    // SWR2 start: 32 s. A round: 32 s + 30 s within superset + 32 s = 94 s.
    // 3 rounds (warm up set and 2 sets) with 2 rests of 30 s and a closing
    // rest of 90 s: (282 + 60 + 90) s = 432 s, x 1.1 = 475.2 s
    expect(
      estimateSkillSeconds({
        skill: "SWR2",
        level: advanced,
        exerciseCount: 2,
        minutes: 10,
      }),
    ).toBeCloseTo(475.2);
  });

  it("adds the afterBlock of the catalog once for a block of several exercises", () => {
    // WUSPEZIAL: 50 s start set, rests of 10 s, afterBlock of 30 s.
    // Pair: (50 + 10 + 50 + 10) s = 120 s. Single: (50 + 10) s = 60 s.
    // Block closing: (30 - 10) s = 20 s.
    // (120 + 60 + 20) s = 200 s, x 1.1 = 220 s
    expect(
      estimateSkillSeconds({
        skill: "WUSPEZIAL",
        level: advanced,
        exerciseCount: 3,
        minutes: 3,
      }),
    ).toBeCloseTo(220);
  });

  it("ends the last exercise with the catalog afterBlock rest when that rest is longer", () => {
    // WUSPEZIAL: 50 s start set, rests of 10 s, afterBlock of 30 s.
    // (50 + 30) s = 80 s, x 1.1 = 88 s
    expect(
      estimateSkillSeconds({
        skill: "WUSPEZIAL",
        level: advanced,
        exerciseCount: 1,
        minutes: 3,
      }),
    ).toBeCloseTo(88);
  });

  it("pairs an even exercise count into supersets of two", () => {
    // MOB has no progression and starts at 50 s like the default intensity config.
    // MOB pair: 50 s + 10 s within superset + 50 s + closing rest of 10 s = 120 s
    // 2 pairs x 120 s = 240 s, x 1.1 = 264 s
    expect(
      estimateSkillSeconds({
        skill: "MOB",
        level: advanced,
        exerciseCount: 4,
        minutes: 10,
      }),
    ).toBeCloseTo(264);
  });

  it("counts the last exercise of an odd exercise count as a single", () => {
    // 1 pair of 120 s + 1 single of (50 + 10) s = 180 s, x 1.1 = 198 s
    expect(
      estimateSkillSeconds({
        skill: "MOB",
        level: advanced,
        exerciseCount: 3,
        minutes: 10,
      }),
    ).toBeCloseTo(198);
  });
});

describe("durationEstimate: cardio", () => {
  it("returns the minutes of a cardio skill as seconds without transition overhead", () => {
    // 12 min x 60 s = 720 s
    expect(
      estimateSkillSeconds({
        skill: "CARDIO_2",
        level: WorkoutConstants.LEVELS.ADVANCED,
        exerciseCount: 1,
        minutes: 12,
      }),
    ).toBe(720);
  });
});
