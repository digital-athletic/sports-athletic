import type { ExerciseDifficultyType } from "@/constants/workoutConstants";
import { getExerciseById } from "@/data/exerciseRegistry";
import {
  DEFAULT_MAX_VALUE,
  DEFAULT_MAX_VALUES,
} from "@/features/training/models/MaxValues";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import type { UserType } from "@/schemas/user.schema";
import TrainingGenerator from "./TrainingGenerator";

const exerciseById = (id: string): ExerciseType => {
  const found = getExerciseById(id);
  if (!found) throw new Error(`Exercise ${id} missing from the registry`);
  return found;
};

// Barbell back squat; with an F-Max of 100 kg every kg value equals its percentage.
const squat = exerciseById("26");
const exercisePool = [squat, exerciseById("137")];

const userWithLevel = (level: string): UserType => ({
  userId: "ladder-test",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: [level] },
    maxValues: {
      ...DEFAULT_MAX_VALUES,
      kneeDominant: { ...DEFAULT_MAX_VALUE, barbell: 100 },
    },
  },
  temporalData: [],
});

type Progress = Record<string, UserExerciseDataType>;

const generate = (user: UserType, progress: Progress) =>
  new TrainingGenerator().getSetListFromExercisePairs(
    [{ first: { branchId: "b1", branchTags: [], exerciseId: squat.id } }],
    { skill: "MAX_KRAFT", length: 0 },
    {},
    user,
    "HOME",
    [],
    exercisePool,
    4,
    [],
    progress,
  );

const workingSets = (setList: GeneratedSetListEntry[]) =>
  setList.filter(
    (entry) =>
      entry.exerciseId === squat.id && entry.repetitionMAX?.level !== "WARMUP",
  );

const describeSets = (setList: GeneratedSetListEntry[]) =>
  workingSets(setList).map((entry) => `${entry.weight}x${entry.repetition}`);

const toStoredRepetition = (
  entry: GeneratedSetListEntry,
): MaxForceRepetitionsDataType => {
  const level = entry.repetitionMAX?.level;
  if (level !== "EASY" && level !== "MEDIUM" && level !== "HARD") {
    throw new Error(`Unexpected buffer ${level}`);
  }
  return { ...entry.repetitionMAX, level, repetitions: entry.repetition ?? 0 };
};

// Stores the working sets the way the completion of the last set does.
const progressAfter = (
  setList: GeneratedSetListEntry[],
  difficulty: ExerciseDifficultyType,
): Progress => ({
  [squat.id]: {
    exerciseId: squat.id,
    skill: "MAX_KRAFT",
    maxFRepetitions: workingSets(setList).map(toStoredRepetition),
    feedback: { difficulty },
  },
});

// Each row lists one session, each column one working set.
const runSessions = (
  user: UserType,
  sessions: number,
  difficulty: ExerciseDifficultyType,
): string[][] => {
  const rows: string[][] = [];
  let progress: Progress = {};
  for (let session = 0; session < sessions; session++) {
    const setList = generate(user, progress);
    rows.push(describeSets(setList));
    progress = progressAfter(setList, difficulty);
  }
  return rows;
};

const column = (rows: string[][], set: number) => rows.map((row) => row[set]);

// Pads a ladder with its final step, since a set stays at its final value.
const padded = (ladder: string[], length: number) => [
  ...ladder,
  ...Array<string>(length - ladder.length).fill(ladder[ladder.length - 1]),
];

describe("TrainingGenerator: max strength ladder per working set", () => {
  it("Pro: starts every set at the first step of its own ladder", () => {
    expect(describeSets(generate(userWithLevel("PROFESSIONAL"), {}))).toEqual([
      "75x3",
      "77.5x3",
      "80x2",
      "80x2",
    ]);
  });

  it("Advanced: starts every set at the first step of its own ladder", () => {
    expect(describeSets(generate(userWithLevel("ADVANCED"), {}))).toEqual([
      "70x5",
      "72.5x2",
      "75x2",
    ]);
  });

  describe("Pro: each set follows its own ladder on succeeded", () => {
    const rows = runSessions(userWithLevel("PROFESSIONAL"), 14, "SUCCEEDED");
    const ladders = [
      ["75x3", "75x5", "75x6"],
      ["77.5x3", "77.5x5", "77.5x6", "80x2", "80x3", "80x5"],
      [
        ...["80x2", "80x3", "80x5", "82.5x1", "82.5x2", "82.5x3"],
        ...["85x1", "85x2", "85x3"],
      ],
      [
        ...["80x2", "80x3", "80x5", "82.5x1", "82.5x2", "82.5x3"],
        ...["85x1", "85x2", "85x3", "87.5x1", "87.5x2", "90x1", "90x2"],
      ],
    ];

    it.each([0, 1, 2, 3])("set %i", (set) => {
      expect(column(rows, set)).toEqual(padded(ladders[set], rows.length));
    });
  });

  describe("Advanced: each set follows its own ladder on succeeded", () => {
    const rows = runSessions(userWithLevel("ADVANCED"), 10, "SUCCEEDED");
    const ladders = [
      ["70x5", "70x6"],
      ["72.5x2", "72.5x3", "72.5x5", "75x2", "75x3", "75x5"],
      [
        ...["75x2", "75x3", "75x5", "77.5x2", "77.5x3", "77.5x5"],
        ...["80x1", "80x2", "80x3"],
      ],
    ];

    it.each([0, 1, 2])("set %i", (set) => {
      expect(column(rows, set)).toEqual(padded(ladders[set], rows.length));
    });
  });

  it("Advanced: too easy moves each set two steps and stops at its maximum weight", () => {
    expect(runSessions(userWithLevel("ADVANCED"), 4, "TOO_EASY")).toEqual([
      ["70x5", "72.5x2", "75x2"],
      ["70x6", "72.5x5", "75x5"],
      ["70x6", "75x3", "77.5x3"],
      ["70x6", "75x5", "80x1"],
    ]);
  });

  it("Pro: keeps the buffer of every set apart without feedback", () => {
    const stored: MaxForceRepetitionsDataType[] = [
      { level: "MEDIUM", repetitions: 5, weightPercentage: 72.5 },
      { level: "HARD", repetitions: 6, weightPercentage: 77.5 },
      { level: "EASY", repetitions: 1, weightPercentage: 82.5 },
      { level: "MEDIUM", repetitions: 2, weightPercentage: 85 },
    ];
    const setList = generate(userWithLevel("PROFESSIONAL"), {
      [squat.id]: {
        exerciseId: squat.id,
        skill: "MAX_KRAFT",
        maxFRepetitions: stored,
        feedback: { difficulty: null },
      },
    });

    expect(describeSets(setList)).toEqual([
      "72.5x5",
      "77.5x6",
      "82.5x1",
      "85x2",
    ]);
  });

  it("Pro: too heavy keeps the buffer of every set", () => {
    const setList = generate(userWithLevel("PROFESSIONAL"), {
      [squat.id]: {
        exerciseId: squat.id,
        skill: "MAX_KRAFT",
        maxFRepetitions: [
          { level: "EASY", repetitions: 3, weightPercentage: 75 },
          { level: "MEDIUM", repetitions: 3, weightPercentage: 80 },
          { level: "HARD", repetitions: 3, weightPercentage: 85 },
          { level: "MEDIUM", repetitions: 1, weightPercentage: 90 },
        ],
        feedback: { difficulty: "TOO_HARD" },
      },
    });
    const sets = workingSets(setList);

    expect(sets.map((entry) => entry.repetitionMAX?.level)).toEqual([
      "EASY",
      "MEDIUM",
      "HARD",
      "MEDIUM",
    ]);
    for (let i = 1; i < sets.length; i++) {
      expect(sets[i].weight).toBeGreaterThan(sets[i - 1].weight ?? 0);
    }
  });

  it("Pro: completed at 72.5% in the fallback column opens 75% in the first column", () => {
    // The 5% column is empty at 72.5%, so every set used the 10% column.
    const atFallback: MaxForceRepetitionsDataType = {
      level: "MEDIUM",
      repetitions: 5,
      weightPercentage: 72.5,
    };
    const setList = generate(userWithLevel("PROFESSIONAL"), {
      [squat.id]: {
        exerciseId: squat.id,
        skill: "MAX_KRAFT",
        maxFRepetitions: [atFallback, atFallback, atFallback, atFallback],
        feedback: { difficulty: "SUCCEEDED" },
      },
    });

    expect(describeSets(setList)).toEqual(["75x3", "75x3", "75x3", "75x3"]);
  });

  it("Pro: a fallback in the last set does not move the lower sets past their next step", () => {
    const setList = generate(userWithLevel("PROFESSIONAL"), {
      [squat.id]: {
        exerciseId: squat.id,
        skill: "MAX_KRAFT",
        // The 15% column is empty at 87.5%, so the last set used the 10% column.
        maxFRepetitions: [
          { level: "EASY", repetitions: 3, weightPercentage: 75 },
          { level: "EASY", repetitions: 2, weightPercentage: 80 },
          { level: "EASY", repetitions: 1, weightPercentage: 85 },
          { level: "MEDIUM", repetitions: 1, weightPercentage: 87.5 },
        ],
        feedback: { difficulty: "SUCCEEDED" },
      },
    });

    expect(describeSets(setList)).toEqual(["75x5", "80x3", "85x2", "87.5x2"]);
  });

  it("Advanced: reads the stored single entry of the last set", () => {
    const setList = generate(userWithLevel("ADVANCED"), {
      [squat.id]: {
        exerciseId: squat.id,
        skill: "MAX_KRAFT",
        nextWeightPercentage: 77.5,
        maxFRepetitions: [{ level: "MEDIUM", repetitions: 3 }],
        feedback: { difficulty: "SUCCEEDED" },
      },
    });

    expect(describeSets(setList)).toEqual(["70x6", "75x5", "77.5x5"]);
  });
});
