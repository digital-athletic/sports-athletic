import { getExerciseById } from "@/data/exerciseRegistry";
import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { GenderTag } from "@/features/training/models/Intensity";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  getExerciseStartValue,
  getExerciseTargetValue,
} from "@/features/training/utils/workoutUtils";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserType } from "@/schemas/user.schema";
import {
  importTree,
  importTrees,
} from "../../../../test/factories/planWorkout";
import TrainingGenerator, { getIntensityBySkill } from "./TrainingGenerator";

const exerciseById = (id: string): ExerciseType => {
  const found = getExerciseById(id);
  if (!found) throw new Error(`Exercise ${id} missing from the registry`);
  return found;
};

const CARDIO_2_RUN = "42";
const SPRINT_RUN = "40";

const userWithLevel = (level: string): UserType => ({
  userId: "test-user-id",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: [level] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
});

const generate = (
  skill: SkillCode,
  minutes: number,
  options: {
    exerciseId?: string;
    level?: string;
    userExerciseData?: Record<string, UserExerciseDataType>;
  } = {},
): GeneratedSetListEntry[] => {
  const exerciseId = options.exerciseId ?? CARDIO_2_RUN;
  return new TrainingGenerator().getSetListFromExercisePairs(
    [{ first: { branchId: "b1", branchTags: [], exerciseId } }],
    { skill, length: minutes },
    importTrees("CARDIO_4", "CARDIO_5"),
    userWithLevel(options.level ?? "ADVANCED"),
    "STUDIO",
    [],
    [exerciseById(exerciseId)],
    1,
    [],
    options.userExerciseData ?? {},
  );
};

const totalSeconds = (setList: GeneratedSetListEntry[]) =>
  setList.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);

const workIntervals = (setList: GeneratedSetListEntry[], exerciseId: string) =>
  setList.filter((entry) => entry.exerciseId === exerciseId);

// Warm-up and filler share the zone-4 exercise; the warm-up leads the block.
const zoneFourEntries = (setList: GeneratedSetListEntry[]) => {
  const zoneFourId = setList[0].exerciseId;
  return setList.filter((entry) => entry.exerciseId === zoneFourId);
};

describe("cardio block: interval count", () => {
  it("emits only the complete intervals that fit into the minute budget", () => {
    const setList = generate("CARDIO_2", 3);

    expect(workIntervals(setList, CARDIO_2_RUN)).toHaveLength(1);
    expect(totalSeconds(setList)).toBe(180);
  });

  it("uses the authored start count and ignores stored cardio values", () => {
    const setList = generate("CARDIO_2", 30, {
      userExerciseData: {
        [CARDIO_2_RUN]: {
          exerciseId: CARDIO_2_RUN,
          skill: "CARDIO_2",
          repetition: 9,
          feedback: { difficulty: "TOO_EASY" },
        },
      },
    });

    expect(workIntervals(setList, CARDIO_2_RUN)).toHaveLength(4);
  });
});

describe("cardio block: zone four warm-up and filler", () => {
  it("shortens the warm-up to the time left after the intervals", () => {
    const setList = generate("CARDIO_2", 10);

    expect(setList[0].duration).toBe(120);
    expect(zoneFourEntries(setList)).toHaveLength(1);
    expect(totalSeconds(setList)).toBe(600);
  });

  it("uses exactly five minutes left as warm-up", () => {
    const setList = generate("CARDIO_2", 13);

    expect(setList[0].duration).toBe(300);
    expect(zoneFourEntries(setList)).toHaveLength(1);
    expect(totalSeconds(setList)).toBe(780);
  });

  it("adds a filler of exactly one minute", () => {
    const setList = generate("CARDIO_2", 14);

    expect(setList[0].duration).toBe(300);
    expect(setList[setList.length - 1].duration).toBe(60);
    expect(zoneFourEntries(setList)).toHaveLength(2);
    expect(totalSeconds(setList)).toBe(840);
  });

  it("discards a filler remainder below one minute", () => {
    const setList = generate("CARDIO_1_SHORT", 10, {
      exerciseId: SPRINT_RUN,
      level: "BEGINNER",
    });

    expect(workIntervals(setList, SPRINT_RUN)).toHaveLength(3);
    expect(zoneFourEntries(setList)).toHaveLength(1);
    expect(totalSeconds(setList)).toBe(570);
  });
});

describe("cardio block: closing pause", () => {
  it.each([3, 14, 30])(
    "ends an interval block of %i minutes without a pause",
    (minutes) => {
      const setList = generate("CARDIO_2", minutes);

      expect(
        setList.some((entry) => entry.exerciseId === PAUSE_EXERCISE_ID),
      ).toBe(false);
      expect(totalSeconds(setList)).toBeLessThanOrEqual(minutes * 60);
    },
  );

  it.each<SkillCode>(["CARDIO_4", "CARDIO_5"])(
    "emits one %s run over the full budget",
    (skill) => {
      const setList = generate(skill, 30);

      expect(setList).toHaveLength(1);
      expect(setList[0].duration).toBe(1800);
    },
  );
});

const AUTHORED_COUNTS: [SkillCode, TrainingLevelType, number, number][] = [
  ["CARDIO_1_SHORT", "beginner", 3, 5],
  ["CARDIO_1_SHORT", "advanced", 4, 6],
  ["CARDIO_1_SHORT", "professional", 5, 8],
  ["CARDIO_1_LAKTAT", "beginner", 2, 4],
  ["CARDIO_1_LAKTAT", "advanced", 3, 5],
  ["CARDIO_1_LAKTAT", "professional", 3, 6],
  ["CARDIO_2", "beginner", 3, 7],
  ["CARDIO_2", "advanced", 4, 8],
  ["CARDIO_2", "professional", 5, 10],
  ["CARDIO_3", "beginner", 3, 6],
  ["CARDIO_3", "advanced", 4, 8],
  ["CARDIO_3", "professional", 5, 8],
];

const treeExercises = (skill: SkillCode): ExerciseType[] => {
  const ids = new Set(
    Object.values(importTree(skill)).flatMap((branch) =>
      Object.values(branch.levels).map((level) => level.exerciseId),
    ),
  );
  return [...ids]
    .map((id) => getExerciseById(id))
    .filter((exercise): exercise is ExerciseType => !!exercise);
};

describe("cardio block: authored start and target counts", () => {
  it.each(AUTHORED_COUNTS)(
    "%s intensity at level %s starts at %i and targets %i",
    (skill, level, start, target) => {
      const intensity = getIntensityBySkill(skill);
      const key = level === "beginner" ? "default" : level;

      expect(intensity.startValue.repetition?.default?.[key]).toBe(start);
      expect(intensity.targetValue.repetition?.default?.[key]).toBe(target);
    },
  );

  it.each(AUTHORED_COUNTS)(
    "%s exercises at level %s start at %i and target %i",
    (skill, level, start, target) => {
      const intensity = getIntensityBySkill(skill);
      const genders: GenderTag[] = ["m", "w", "k"];
      const counts = treeExercises(skill).flatMap((exercise) =>
        genders.map((gender) => ({
          id: exercise.id,
          gender,
          start: getExerciseStartValue(
            intensity,
            exercise,
            "repetition",
            level,
            gender,
          ),
          target: getExerciseTargetValue(
            intensity,
            exercise,
            "repetition",
            level,
            gender,
          ),
        })),
      );

      expect(counts.length).toBeGreaterThan(0);
      expect(
        counts
          .filter((count) => count.start !== start || count.target !== target)
          .map(
            (count) =>
              `${count.id} ${count.gender} ${count.start}/${count.target}`,
          ),
      ).toEqual([]);
    },
  );
});
