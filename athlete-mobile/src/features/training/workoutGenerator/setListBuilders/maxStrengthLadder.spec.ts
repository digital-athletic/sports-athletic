import { generateAthleteWithMaxValues } from "@test/factories/athlete";
import { generateSquatStoredProgress } from "@test/factories/storedExerciseData";
import { generateSquatExercise } from "@test/factories/valueExercise";
import type {
  ExerciseDifficultyType,
  LevelTag,
} from "@/constants/workoutConstants";
import type { ExerciseProgressSourceType } from "@/features/training/models/ExerciseProgress";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import type {
  MaxTrainingRepsEntry,
  SkillCode,
} from "@/schemas/generator.schema";
import type { MaxForceRepetitionsDataType } from "@/schemas/sync.schema";
import type { UserType } from "@/schemas/user.schema";
import {
  readMaxTrainingRepetitions,
  readMaxTrainingWeights,
} from "./maxStrengthLadder";

/**
 * Reads the working sets of the squat in the given skill, without the
 * warm-up sets.
 *
 * readWorkingSets(generateAthleteWithMaxValues({ level: "ADVANCED" }), null)
 * → [{ level: "MEDIUM", repetitions: 5, weightPercentage: 70 }, ...]
 */
const readWorkingSets = (
  athlete: UserType,
  storedProgress: ExerciseProgressSourceType | null,
  skill: SkillCode = "MAX_STRENGTH",
): MaxTrainingRepsEntry[] =>
  readMaxTrainingRepetitions(
    athlete,
    readMaxTrainingWeights(
      generateSquatExercise(),
      athlete,
      storedProgress,
      skill,
    ),
  ).filter((entry) => entry.level !== "WARMUP");

/**
 * Writes each working set as weight percentage times repetitions.
 *
 * describeSets([{ level: "MEDIUM", repetitions: 5, weightPercentage: 70 }])
 * → ["70x5"]
 */
const describeSets = (sets: MaxTrainingRepsEntry[]) =>
  sets.map((entry) => `${entry.weightPercentage}x${entry.repetitions}`);

/**
 * Describes the working sets after the given stored data and feedback.
 *
 * describeNextSets(generateAthleteWithMaxValues({ level: "ADVANCED" }), { nextWeightPercentage: 77.5, ... }, "SUCCEEDED")
 * → ["70x6", "75x5", "77.5x5"]
 */
const describeNextSets = (
  athlete: UserType,
  values: Partial<UserExerciseDataType>,
  difficulty: ExerciseDifficultyType,
) =>
  describeSets(
    readWorkingSets(athlete, generateSquatStoredProgress(values, difficulty)),
  );

// Stores a working set the way the completion of the last set does.
const convertToStoredSet = ({
  level,
  repetitions,
  weightPercentage,
}: MaxTrainingRepsEntry): MaxForceRepetitionsDataType => {
  if (level !== "EASY" && level !== "MEDIUM" && level !== "HARD") {
    throw new Error(`Unexpected buffer ${level}`);
  }
  return { level, repetitions, weightPercentage };
};

/**
 * Runs sessions with the same feedback. Each row lists one session, each
 * column one working set.
 *
 * runSessions(generateAthleteWithMaxValues({ level: "ADVANCED" }), 2, "TOO_EASY")
 * → [["70x5", "72.5x2", "75x2"], ["70x6", "72.5x5", "75x5"]]
 */
const runSessions = (
  athlete: UserType,
  sessions: number,
  difficulty: ExerciseDifficultyType,
): string[][] => {
  const rows: string[][] = [];
  let storedProgress: ExerciseProgressSourceType | null = null;
  for (let session = 0; session < sessions; session++) {
    const sets = readWorkingSets(athlete, storedProgress);
    rows.push(describeSets(sets));
    storedProgress = generateSquatStoredProgress(
      { maxFRepetitions: sets.map(convertToStoredSet) },
      difficulty,
    );
  }
  return rows;
};

/**
 * Reads one working set across all sessions.
 *
 * readColumn([["70x5", "72.5x2"], ["70x6", "72.5x5"]], 1)
 * → ["72.5x2", "72.5x5"]
 */
const readColumn = (rows: string[][], set: number) =>
  rows.map((row) => row[set]);

/**
 * A set stays at its final value, so a ladder pads with its last step.
 *
 * padLadder(["70x5", "70x6"], 4)
 * → ["70x5", "70x6", "70x6", "70x6"]
 */
const padLadder = (ladder: string[], length: number) => [
  ...ladder,
  ...Array<string>(length - ladder.length).fill(ladder[ladder.length - 1]),
];

describe("maxStrengthLadder: first session", () => {
  it.each<[LevelTag, string[]]>([
    ["PROFESSIONAL", ["75x3", "77.5x3", "80x2", "80x2"]],
    ["ADVANCED", ["70x5", "72.5x2", "75x2"]],
  ])(
    "starts every %s set at the first step of its own ladder",
    (level, expected) => {
      expect(
        describeSets(
          readWorkingSets(generateAthleteWithMaxValues({ level }), null),
        ),
      ).toEqual(expected);
    },
  );

  it("lists the two warm-up sets before the working sets", () => {
    const entries = readMaxTrainingRepetitions(
      generateAthleteWithMaxValues({ level: "ADVANCED" }),
      readMaxTrainingWeights(
        generateSquatExercise(),
        generateAthleteWithMaxValues({ level: "ADVANCED" }),
        null,
        "MAX_STRENGTH",
      ),
    );

    expect(entries.slice(0, 2)).toEqual([
      { level: "WARMUP", repetitions: 6 },
      { level: "WARMUP", repetitions: 5 },
    ]);
    expect(entries[2]).toEqual({
      level: "MEDIUM",
      repetitions: 5,
      weightPercentage: 70,
    });
  });
});

describe("maxStrengthLadder: ladders on succeeded", () => {
  it("Pro: each set follows its own ladder", () => {
    const rows = runSessions(
      generateAthleteWithMaxValues({ level: "PROFESSIONAL" }),
      14,
      "SUCCEEDED",
    );
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

    ladders.forEach((ladder, set) => {
      expect(readColumn(rows, set)).toEqual(padLadder(ladder, rows.length));
    });
  });

  it("Advanced: each set follows its own ladder", () => {
    const rows = runSessions(
      generateAthleteWithMaxValues({ level: "ADVANCED" }),
      10,
      "SUCCEEDED",
    );
    const ladders = [
      ["70x5", "70x6"],
      ["72.5x2", "72.5x3", "72.5x5", "75x2", "75x3", "75x5"],
      [
        ...["75x2", "75x3", "75x5", "77.5x2", "77.5x3", "77.5x5"],
        ...["80x1", "80x2", "80x3"],
      ],
    ];

    ladders.forEach((ladder, set) => {
      expect(readColumn(rows, set)).toEqual(padLadder(ladder, rows.length));
    });
  });
});

describe("maxStrengthLadder: feedback", () => {
  const professional = generateAthleteWithMaxValues({ level: "PROFESSIONAL" });

  it("Advanced: too easy moves each set two steps and stops at its maximum weight", () => {
    expect(
      runSessions(
        generateAthleteWithMaxValues({ level: "ADVANCED" }),
        4,
        "TOO_EASY",
      ),
    ).toEqual([
      ["70x5", "72.5x2", "75x2"],
      ["70x6", "72.5x5", "75x5"],
      ["70x6", "75x3", "77.5x3"],
      ["70x6", "75x5", "80x1"],
    ]);
  });

  it("Advanced: too hard lowers each set by 2.5 down to the 65% floor", () => {
    expect(
      runSessions(
        generateAthleteWithMaxValues({ level: "ADVANCED" }),
        5,
        "TOO_HARD",
      ),
    ).toEqual([
      ["70x5", "72.5x2", "75x2"],
      ["67.5x5", "70x3", "72.5x2"],
      ["65x5", "67.5x3", "70x3"],
      ["65x5", "65x3", "67.5x3"],
      ["65x5", "65x3", "65x3"],
    ]);
  });

  it("Pro: keeps the buffer of every set apart without feedback", () => {
    const maxFRepetitions: MaxForceRepetitionsDataType[] = [
      { level: "MEDIUM", repetitions: 5, weightPercentage: 72.5 },
      { level: "HARD", repetitions: 6, weightPercentage: 77.5 },
      { level: "EASY", repetitions: 1, weightPercentage: 82.5 },
      { level: "MEDIUM", repetitions: 2, weightPercentage: 85 },
    ];

    expect(describeNextSets(professional, { maxFRepetitions }, null)).toEqual([
      "72.5x5",
      "77.5x6",
      "82.5x1",
      "85x2",
    ]);
  });

  it("Pro: too hard keeps the buffer of every set and moves an empty buffer up", () => {
    const maxFRepetitions: MaxForceRepetitionsDataType[] = [
      { level: "HARD", repetitions: 6, weightPercentage: 75 },
      { level: "HARD", repetitions: 6, weightPercentage: 77.5 },
      { level: "HARD", repetitions: 5, weightPercentage: 80 },
      { level: "HARD", repetitions: 5, weightPercentage: 80 },
    ];
    const sets = readWorkingSets(
      professional,
      generateSquatStoredProgress({ maxFRepetitions }, "TOO_HARD"),
    );

    expect(describeSets(sets)).toEqual(["72.5x5", "75x6", "77.5x6", "77.5x6"]);
    expect(sets[0].level).toBe("MEDIUM");
  });

  it("Pro: a set completed at 72.5% in the fallback buffer opens 75% in the first buffer", () => {
    const atFallback: MaxForceRepetitionsDataType = {
      level: "MEDIUM",
      repetitions: 5,
      weightPercentage: 72.5,
    };

    expect(
      describeNextSets(
        professional,
        { maxFRepetitions: [atFallback, atFallback, atFallback, atFallback] },
        "SUCCEEDED",
      ),
    ).toEqual(["75x3", "75x3", "75x3", "75x3"]);
  });

  it("Pro: a fallback in the last set does not move the lower sets past their next step", () => {
    const maxFRepetitions: MaxForceRepetitionsDataType[] = [
      { level: "EASY", repetitions: 3, weightPercentage: 75 },
      { level: "EASY", repetitions: 2, weightPercentage: 80 },
      { level: "EASY", repetitions: 1, weightPercentage: 85 },
      { level: "MEDIUM", repetitions: 1, weightPercentage: 87.5 },
    ];

    expect(
      describeNextSets(professional, { maxFRepetitions }, "SUCCEEDED"),
    ).toEqual(["75x5", "80x3", "85x2", "87.5x2"]);
  });
});

describe("maxStrengthLadder: stored entries of another shape", () => {
  it("Advanced to Pro: starts the Pro ladder at its first step", () => {
    const maxFRepetitions: MaxForceRepetitionsDataType[] = [
      { level: "HARD", repetitions: 6, weightPercentage: 70 },
      { level: "HARD", repetitions: 5, weightPercentage: 75 },
      { level: "HARD", repetitions: 5, weightPercentage: 77.5 },
    ];

    expect(
      describeNextSets(
        generateAthleteWithMaxValues({ level: "PROFESSIONAL" }),
        { nextWeightPercentage: 77.5, maxFRepetitions },
        "SUCCEEDED",
      ),
    ).toEqual(["75x3", "77.5x3", "80x2", "80x2"]);
  });

  it("Pro to Advanced: starts the Advanced ladder at its first step", () => {
    const maxFRepetitions: MaxForceRepetitionsDataType[] = [
      { level: "HARD", repetitions: 6, weightPercentage: 75 },
      { level: "HARD", repetitions: 5, weightPercentage: 80 },
      { level: "HARD", repetitions: 3, weightPercentage: 85 },
      { level: "HARD", repetitions: 2, weightPercentage: 90 },
    ];

    expect(
      describeNextSets(
        generateAthleteWithMaxValues({ level: "ADVANCED" }),
        { nextWeightPercentage: 90, maxFRepetitions },
        "SUCCEEDED",
      ),
    ).toEqual(["70x5", "72.5x2", "75x2"]);
  });

  it("Advanced: reads the stored single entry of the last set", () => {
    expect(
      describeNextSets(
        generateAthleteWithMaxValues({ level: "ADVANCED" }),
        {
          nextWeightPercentage: 77.5,
          maxFRepetitions: [{ level: "MEDIUM", repetitions: 3 }],
        },
        "SUCCEEDED",
      ),
    ).toEqual(["70x6", "75x5", "77.5x5"]);
  });

  it.each([
    ["EASY", "TOO_EASY", "HARD"],
    ["MEDIUM", "TOO_EASY", "EASY"],
    ["HARD", "TOO_EASY", "MEDIUM"],
    ["EASY", "SUCCEEDED", "MEDIUM"],
    ["MEDIUM", "SUCCEEDED", "HARD"],
    ["HARD", "SUCCEEDED", "EASY"],
    ["EASY", "TOO_HARD", "EASY"],
    ["MEDIUM", "TOO_HARD", "MEDIUM"],
    ["HARD", "TOO_HARD", "HARD"],
  ] as const)(
    "moves a stored last set at buffer %s with feedback %s to %s",
    (lastLevel, difficulty, expected) => {
      const weights = readMaxTrainingWeights(
        generateSquatExercise(),
        generateAthleteWithMaxValues({ level: "BEGINNER" }),
        generateSquatStoredProgress(
          {
            nextWeightPercentage: 75,
            maxFRepetitions: [{ level: lastLevel, repetitions: 3 }],
          },
          difficulty,
        ),
        "MAX_STRENGTH",
      );

      expect(weights.levels.at(-1)).toBe(expected);
    },
  );
});

describe("maxStrengthLadder: progress per skill", () => {
  it("starts a MAX block at the first step when MAX_STRENGTH wrote the record", () => {
    const advanced = generateAthleteWithMaxValues({ level: "ADVANCED" });
    const firstSession = readWorkingSets(advanced, null).map(
      convertToStoredSet,
    );
    const storedProgress = generateSquatStoredProgress(
      { maxFRepetitions: firstSession, nextWeightPercentage: 75 },
      "TOO_EASY",
    );

    expect(
      describeSets(readWorkingSets(advanced, storedProgress, "MAX")),
    ).toEqual(["70x5", "72.5x2", "75x2"]);
  });
});

describe("maxStrengthLadder: buffer table", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T00:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("gives a child without a buffer table the fallback repetitions", () => {
    const child = generateAthleteWithMaxValues({
      level: "ADVANCED",
      birthday: "2018-05-01",
    });

    expect(describeSets(readWorkingSets(child, null))).toEqual([
      "70x6",
      "72.5x6",
      "75x6",
    ]);
  });
});
