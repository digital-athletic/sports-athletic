import type { GenderTag } from "@/features/training/models/Intensity";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import { getExerciseStartValue } from "@/features/training/utils/workoutUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import TrainingGenerator, { getIntensityBySkill } from "./TrainingGenerator";

const GENDERS: GenderTag[] = ["m", "w", "k"];
const LEVELS = ["beginner", "intermediate", "advanced", "professional"];

const catalogExercise = (id: string): ExerciseType => {
  const found = (ExercisesData as unknown as ExerciseType[]).find(
    (e) => e.id === id,
  );
  if (!found) throw new Error(`Exercise ${id} missing from Exercises.json`);
  return found;
};

const createExercise = (
  mode: "repetition" | "duration",
  values: ExerciseType["values"] = {},
): ExerciseType => ({
  id: "1",
  name: "Test Exercise",
  displayName: "Test Exercise",
  description: "Test Description",
  picture: "test.jpg",
  video: "test.mp4",
  level: { m: 1, w: 1 },
  tags: ["REGION_UPPER_BODY", "SIDE_BOTH"],
  isAdvanceByReps: mode === "repetition",
  isAdvanceByDuration: mode === "duration",
  isJump: false,
  values,
});

const authored = (start: string, target: string) => ({
  startValue: { default: { default: start } },
  targetValue: { default: { default: target } },
});

describe("catalog value lookup: empty gender values", () => {
  const generator = new TrainingGenerator();

  const startDuration = (
    exercise: ExerciseType,
    skill: SkillCode,
    gender: GenderTag,
    level: string,
  ) =>
    generator.getExerciseValues(
      null,
      exercise,
      getIntensityBySkill(skill),
      gender,
      level,
      DEFAULT_MAX_VALUES,
      skill,
    ).duration;

  it.each(GENDERS.flatMap((g) => LEVELS.map((l) => [g, l] as const)))(
    "ladder exercise 721 starts at 30 seconds for gender %s and level %s",
    (gender, level) => {
      expect(
        startDuration(catalogExercise("721"), "WUSKSA", gender, level),
      ).toBe(30);
    },
  );

  it.each(
    ["433", "434"].flatMap((id) =>
      GENDERS.flatMap((g) => LEVELS.map((l) => [id, g, l] as const)),
    ),
  )(
    "fast push-ups %s start at 15 seconds for gender %s and level %s",
    (id, gender, level) => {
      expect(startDuration(catalogExercise(id), "WUSKSA", gender, level)).toBe(
        15,
      );
    },
  );

  it("falls back to the default entry when the gender value is an empty string", () => {
    const exercise = createExercise("duration", {
      duration: {
        startValue: { default: { default: 25 }, m: { default: "" } },
        targetValue: { default: { default: 25 } },
      },
    });

    expect(startDuration(exercise, "SA", "m", "advanced")).toBe(25);
  });

  it("falls back to the default entry when the gender value is null", () => {
    const exercise = createExercise("duration", {
      duration: {
        startValue: { default: { default: 25 }, m: { default: null } },
        targetValue: { default: { default: 25 } },
      },
    } as unknown as ExerciseType["values"]);

    expect(startDuration(exercise, "SA", "m", "advanced")).toBe(25);
  });

  it("resolves an empty gender value through getExerciseStartValue", () => {
    const exercise = catalogExercise("721");

    expect(
      getExerciseStartValue(
        getIntensityBySkill("WUSKSA"),
        exercise,
        "duration",
        "advanced",
        "m",
      ),
    ).toBe(30);
  });
});

describe("speed warm-up: duration cap", () => {
  const generator = new TrainingGenerator();
  const values = (
    exercise: ExerciseType,
    stored: number | null,
  ): number | undefined =>
    generator.getExerciseValues(
      stored === null
        ? null
        : { exerciseId: "1", skill: "WUSKSA", duration: stored },
      exercise,
      getIntensityBySkill("WUSKSA"),
      "m",
      "advanced",
      DEFAULT_MAX_VALUES,
      "WUSKSA",
    ).duration;

  it("defaults to 30 seconds without authored values", () => {
    const intensity = getIntensityBySkill("WUSKSA");

    expect(intensity.startValue.duration?.default?.default).toBe(30);
    expect(values(createExercise("duration"), null)).toBe(30);
  });

  it("caps an authored duration above 30 seconds", () => {
    const exercise = createExercise("duration", {
      duration: authored("45", "60"),
    });

    expect(values(exercise, null)).toBe(30);
  });

  it("keeps an authored duration below 30 seconds", () => {
    const exercise = createExercise("duration", {
      duration: authored("20", "20"),
    });

    expect(values(exercise, null)).toBe(20);
  });

  it("caps a stored duration above 30 seconds", () => {
    expect(values(createExercise("duration"), 50)).toBe(30);
  });
});

describe("plyometrics: default repetitions", () => {
  const generator = new TrainingGenerator();

  it.each(["PLYO_HIGH", "PLYO_MEDIUM"] as const)(
    "%s uses 4 up to 12 repetitions",
    (skill) => {
      const intensity = getIntensityBySkill(skill);

      expect(intensity.startValue.repetition?.default?.default).toBe(4);
      expect(intensity.targetValue.repetition?.default?.default).toBe(12);
      expect(
        generator.getExerciseValues(
          null,
          createExercise("repetition"),
          intensity,
          "m",
          "advanced",
          DEFAULT_MAX_VALUES,
          skill,
        ).repetition,
      ).toBe(4);
    },
  );
});

describe("stored values: clamp to start and target", () => {
  const generator = new TrainingGenerator();
  const stored = (skill: SkillCode, repetition: number) =>
    generator.getExerciseValues(
      { exerciseId: "1", skill, repetition },
      createExercise("repetition", { repetition: authored("4", "8") }),
      getIntensityBySkill(skill),
      "m",
      "advanced",
      DEFAULT_MAX_VALUES,
      skill,
    ).repetition;

  it("clamps explosive power repetitions to the authored target", () => {
    expect(stored("SK", 10)).toBe(8);
  });

  it("clamps explosive power repetitions to the authored start", () => {
    expect(stored("SK", 2)).toBe(4);
  });

  it.each(["WU", "MAX_STRENGTH"] as const)(
    "keeps stored repetitions for %s",
    (skill) => {
      expect(stored(skill, 100)).toBe(100);
    },
  );
});
