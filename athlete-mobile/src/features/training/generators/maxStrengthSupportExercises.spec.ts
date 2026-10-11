import { getExerciseById } from "@/data/exerciseRegistry";
import { WorkoutConstants } from "@/constants/workoutConstants";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { TemporalDataType } from "@/features/training/models/TemporalData";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserType } from "@/schemas/user.schema";
import TrainingGenerator from "./TrainingGenerator";

const exerciseById = (id: string): ExerciseType => {
  const found = getExerciseById(id);
  if (!found) throw new Error(`Exercise ${id} missing from the registry`);
  return found;
};

// Barbell back squat: primary muscles glutes, hamstrings, quadriceps, lower back.
const squat = exerciseById("26");

const supportExercise = (
  id: string,
  muscle: string,
  region: string,
  isAdvanceByReps = false,
): ExerciseType => ({
  ...exerciseById("137"),
  id,
  tags: [
    "EQ_TYPE_KG",
    `MUSCLE_${muscle}`,
    `REGION_${region}`,
    "SIDE_BOTH",
    "SKILL_SUPPORT",
  ],
  isAdvanceByReps,
  isAdvanceByDuration: !isAdvanceByReps,
});

const userWithLevel = (level: string, birthday = "1990-01-01"): UserType => ({
  userId: "test-user-id",
  personalData: { gender: "MALE", birthday },
  workoutData: {
    tags: { LEVEL: [level] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
});

const generate = (
  user: UserType,
  supportExercises: ExerciseType[],
  temporalData: TemporalDataType[] = [],
): GeneratedSetListEntry[] =>
  new TrainingGenerator().getSetListFromExercisePairs(
    [{ first: { branchId: "b1", branchTags: [], exerciseId: squat.id } }],
    { skill: "MAX_KRAFT", length: 0 },
    {},
    user,
    "HOME",
    [],
    [squat, ...supportExercises],
    4,
    temporalData,
    {},
  );

// The entries between two working sets, skipping the two warm-up sets.
const breaksOf = (setList: GeneratedSetListEntry[]) => {
  const liftIndexes = setList
    .map((entry, index) => (entry.exerciseId === squat.id ? index : -1))
    .filter((index) => index > -1)
    .slice(2);
  return liftIndexes
    .slice(0, -1)
    .map((start, i) => setList.slice(start + 1, liftIndexes[i + 1]));
};

const supportIdsOf = (entries: GeneratedSetListEntry[]) =>
  entries
    .filter((entry) => entry.exerciseId !== PAUSE_EXERCISE_ID)
    .map((entry) => entry.exerciseId);

describe("TrainingGenerator: max strength support exercises", () => {
  it("skips support exercises for a sore region", () => {
    const sore: TemporalDataType = {
      date: "2026-01-01",
      expiration: "2099-01-01",
      tag: "CHEST",
    };
    const setList = generate(
      userWithLevel("ADVANCED"),
      [
        supportExercise("s1", "CHEST", "UPPER_BODY"),
        supportExercise("s2", "RECTUS_ABDOMINIS", "CORE"),
      ],
      [sore],
    );

    expect(setList.some((entry) => entry.exerciseId === "s1")).toBe(false);
  });

  it("skips support exercises that train a primary muscle of the main lift", () => {
    const setList = generate(userWithLevel("ADVANCED"), [
      supportExercise("s1", "QUADRICEPS", "LOWER_BODY"),
    ]);

    expect(setList.some((entry) => entry.exerciseId === "s1")).toBe(false);
  });

  it("uses 8 repetitions for a support exercise advanced by reps", () => {
    const setList = generate(userWithLevel("ADVANCED"), [
      supportExercise("s1", "RECTUS_ABDOMINIS", "CORE", true),
    ]);
    const supportSets = setList.filter((entry) => entry.exerciseId === "s1");

    expect(supportSets.length).toBeGreaterThan(0);
    for (const entry of supportSets) expect(entry.repetition).toBe(8);
  });

  it.each([
    ["ADVANCED", [30, 60, 30]],
    ["PROFESSIONAL", [30, 60, 90]],
  ])("%s: rests between the support sets", (level, rests) => {
    const setList = generate(userWithLevel(level), [
      supportExercise("s1", "RECTUS_ABDOMINIS", "CORE"),
      supportExercise("s2", "CHEST", "UPPER_BODY"),
      supportExercise("s3", "UPPER_BACK", "UPPER_BODY"),
    ]);
    const firstBreak = breaksOf(setList)[0];

    expect(
      firstBreak
        .filter((entry) => entry.exerciseId === PAUSE_EXERCISE_ID)
        .map((entry) => entry.duration),
    ).toEqual(rests);
  });

  it("leaves the remaining breaks empty once the pool runs out", () => {
    const setList = generate(userWithLevel("ADVANCED"), [
      supportExercise("s1", "RECTUS_ABDOMINIS", "CORE"),
    ]);
    const breaks = breaksOf(setList);

    expect(breaks).toHaveLength(2);
    expect(supportIdsOf(breaks[0])).toEqual(["s1", "s1"]);
    expect(supportIdsOf(breaks[1])).toEqual([]);
    expect(breaks[1].map((entry) => entry.duration)).toEqual([180]);
  });

  it("leaves every break empty when no support exercise fits", () => {
    const setList = generate(userWithLevel("PROFESSIONAL"), [
      supportExercise("s1", "QUADRICEPS", "LOWER_BODY"),
    ]);
    const breaks = breaksOf(setList);

    expect(breaks).toHaveLength(3);
    for (const entries of breaks) {
      expect(entries.map((entry) => entry.duration)).toEqual([240]);
    }
  });
});

describe("TrainingGenerator: max strength repetition table", () => {
  const seventeenYearsAgo = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 17);
    return date.toISOString().slice(0, 10);
  };

  it("gives athletes from 16 one table that reaches 90% for Pro", () => {
    const tables =
      WorkoutConstants.MAX_KRAFT_REPETITIONS_PER_AGE_LEVEL_AND_WEIGHT;

    expect(tables.ADOLESCENT).toEqual(tables.ADULT);
    expect(tables.ADOLESCENT?.PROFESSIONAL?.HARD?.[90]).toBe(2);
  });

  it("gives an adolescent Pro 2 repetitions at 90% in the hardest column", () => {
    const reps = new TrainingGenerator().getMaxTrainingReps(
      userWithLevel("PROFESSIONAL", seventeenYearsAgo()),
      {
        trainingWeights: [75, 80, 85, 90],
        levels: ["HARD", "HARD", "HARD", "HARD"],
      },
    );

    expect(reps.at(-1)?.repetitions).toBe(2);
  });

  it("Pro: an empty buffer at 90% falls back to the 10% buffer", () => {
    const reps = new TrainingGenerator().getMaxTrainingReps(
      userWithLevel("PROFESSIONAL"),
      {
        trainingWeights: [75, 80, 85, 90],
        levels: ["EASY", "EASY", "EASY", "EASY"],
      },
    );

    expect(reps.at(-1)).toEqual({
      level: "MEDIUM",
      repetitions: 1,
      weightPercentage: 90,
    });
  });
});
