import type {
  GenderTag,
  IntensityData,
} from "@/features/training/models/Intensity";
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import {
  getResetDuration,
  getResetRepetition,
} from "@/features/training/utils/weightAdjustmentUtils";
import {
  getExerciseStartValue,
  getExerciseTargetValue,
} from "@/features/training/utils/workoutUtils";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import TrainingGenerator, { getIntensityBySkill } from "./TrainingGenerator";

const GENDERS: GenderTag[] = ["m", "w", "k"];
const LEVELS: TrainingLevelType[] = [
  "beginner",
  "intermediate",
  "advanced",
  "professional",
];

const STANDARD_SKILLS: SkillCode[] = [
  "SWR1",
  "SWR1KG",
  "SWR2",
  "SWR2KG",
  "SA",
  "SAKG",
  "SK",
  "SKKG",
  "BAS",
  "GKS",
  "GKSKG",
  "PREV",
  "PREVKNEE",
];

const HYPERTROPHY_SKILLS: SkillCode[] = ["SWR1", "SWR1KG", "SWR2", "SWR2KG"];

const everyCombination = <T>(values: T[]) =>
  values.flatMap((value) =>
    GENDERS.flatMap((gender) =>
      LEVELS.map((level) => [value, gender, level] as const),
    ),
  );

const authoredValues = (start: string, target: string) => ({
  startValue: { default: { default: start }, m: { default: start } },
  targetValue: { default: { default: target }, m: { default: target } },
});

const createExercise = (
  mode: "repetition" | "duration",
  withWeights: boolean,
  values: ExerciseType["values"] = {},
): ExerciseType => ({
  id: "1",
  name: "Test Exercise",
  displayName: "Test Exercise",
  description: "Test Description",
  picture: "test.jpg",
  video: "test.mp4",
  level: { m: 1, w: 1 },
  tags: [
    "REGION_UPPER_BODY",
    "SIDE_BOTH",
    ...(withWeights ? ["EQ_TYPE_WEIGHTS"] : []),
  ],
  isAdvanceByReps: mode === "repetition",
  isAdvanceByDuration: mode === "duration",
  isJump: false,
  values,
});

describe("standard progression config: ladder steps", () => {
  const generator = new TrainingGenerator();

  it.each(everyCombination(STANDARD_SKILLS))(
    "%s for gender %s and level %s uses one or two ladder steps",
    (skill, gender, level) => {
      const adjustment = generator.getAdjustmentByUserData(
        getIntensityBySkill(skill),
        gender,
        level,
      );

      expect(adjustment.repetition).toEqual({
        SUCCEEDED: 1,
        TOO_EASY: 2,
        TOO_HARD: -2,
      });
      if (adjustment.duration) {
        expect(adjustment.duration).toEqual({
          SUCCEEDED: 5,
          TOO_EASY: 10,
          TOO_HARD: -10,
        });
      }
    },
  );
});

describe("standard progression config: hypertrophy range", () => {
  const generator = new TrainingGenerator();

  const cases = [
    ["repetition", true, 8, 12],
    ["repetition", false, 8, 12],
    ["duration", true, 30, 50],
    ["duration", false, 30, 60],
  ] as const;

  it.each(
    everyCombination(HYPERTROPHY_SKILLS).flatMap(([skill, gender, level]) =>
      cases.map(([mode, withWeights, start, target]) => ({
        skill,
        gender,
        level,
        mode,
        withWeights,
        start,
        target,
      })),
    ),
  )(
    "$skill for gender $gender and level $level resolves $mode with weights $withWeights to $start up to $target",
    ({ skill, gender, level, mode, withWeights, start, target }) => {
      const exercise = createExercise(mode, withWeights, {
        [mode]: authoredValues("15", "80"),
      });
      const intensity = getIntensityBySkill(skill, exercise);

      expect(
        getExerciseStartValue(intensity, exercise, mode, level, gender),
      ).toBe(start);
      expect(
        getExerciseTargetValue(intensity, exercise, mode, level, gender),
      ).toBe(target);
    },
  );

  it("weighted exercise under skill SWR2KG reads the SWR2 config", () => {
    const exercise = createExercise("duration", true);
    const intensity = getIntensityBySkill("SWR2KG", exercise);

    expect(intensity).toBe(getIntensityBySkill("SWR2"));
    expect(
      getExerciseTargetValue(intensity, exercise, "duration", "advanced", "m"),
    ).toBe(50);
  });

  it("bodyweight exercise under skill SWR1 reads the SWR2KG config", () => {
    const exercise = createExercise("duration", false);
    const intensity = getIntensityBySkill("SWR1", exercise);

    expect(intensity).toBe(getIntensityBySkill("SWR2KG"));
    expect(
      getExerciseTargetValue(intensity, exercise, "duration", "advanced", "m"),
    ).toBe(60);
  });

  it("ignores authored exercise repetitions only while the flag is set", () => {
    const exercise = createExercise("repetition", true, {
      repetition: authoredValues("15", "20"),
    });
    const intensity = getIntensityBySkill("SWR2", exercise);
    const withoutFlag: IntensityData = {
      ...intensity,
      overridesExerciseRepsAndDuration: false,
    };

    expect(intensity.overridesExerciseRepsAndDuration).toBe(true);
    expect(
      getExerciseStartValue(intensity, exercise, "repetition", "advanced", "m"),
    ).toBe(8);
    expect(
      getExerciseTargetValue(
        intensity,
        exercise,
        "repetition",
        "advanced",
        "m",
      ),
    ).toBe(12);
    expect(
      getExerciseStartValue(
        withoutFlag,
        exercise,
        "repetition",
        "advanced",
        "m",
      ),
    ).toBe(15);
    expect(
      getExerciseTargetValue(
        withoutFlag,
        exercise,
        "repetition",
        "advanced",
        "m",
      ),
    ).toBe(20);
  });

  it("reads repetition and duration from the config start and target", () => {
    const base = getIntensityBySkill("SWR2");
    const intensity: IntensityData = {
      ...base,
      startValue: {
        ...base.startValue,
        repetition: { default: { default: 6 } },
        duration: { default: { default: 20 }, m: { advanced: 25 } },
      },
      targetValue: {
        ...base.targetValue,
        repetition: { default: { default: 10 } },
        duration: { default: { default: 40 }, m: { advanced: 45 } },
      },
    };
    const repsExercise = createExercise("repetition", true, {
      repetition: authoredValues("15", "20"),
    });
    const durationExercise = createExercise("duration", true, {
      duration: authoredValues("40", "80"),
    });

    expect(
      getExerciseStartValue(
        intensity,
        repsExercise,
        "repetition",
        "advanced",
        "m",
      ),
    ).toBe(6);
    expect(
      getExerciseTargetValue(
        intensity,
        repsExercise,
        "repetition",
        "advanced",
        "m",
      ),
    ).toBe(10);
    expect(
      getExerciseStartValue(
        intensity,
        durationExercise,
        "duration",
        "advanced",
        "m",
      ),
    ).toBe(25);
    expect(
      getExerciseTargetValue(
        intensity,
        durationExercise,
        "duration",
        "advanced",
        "w",
      ),
    ).toBe(40);
  });

  it("starts a new exercise at the hypertrophy start despite authored values", () => {
    const exercise = createExercise("repetition", true, {
      repetition: authoredValues("10", "15"),
    });

    const values = generator.getExerciseValues(
      null,
      exercise,
      getIntensityBySkill("SWR2"),
      "m",
      "advanced",
      DEFAULT_MAX_VALUES,
    );

    expect(values.repetition).toBe(8);
  });

  it("starts a reset record at the start values", () => {
    const exercise = createExercise("repetition", true, {
      repetition: authoredValues("10", "15"),
    });
    const valuesFor = (record: { branchId: string } | null) =>
      generator.getExerciseValues(
        record && { exerciseId: "1", skill: "SWR2", ...record },
        exercise,
        getIntensityBySkill("SWR2"),
        "m",
        "advanced",
        DEFAULT_MAX_VALUES,
      );

    const values = valuesFor({ branchId: "77" });

    expect(values).toEqual(valuesFor(null));
    expect(values.repetition).toBe(8);
  });

  it.each([
    ["repetition", true, 18, 12],
    ["repetition", false, 5, 8],
    ["duration", true, 70, 50],
    ["duration", false, 70, 60],
    ["duration", false, 20, 30],
  ] as const)(
    "clamps a stored %s value with weights %s from %i to %i",
    (mode, withWeights, stored, expected) => {
      const exercise = createExercise(mode, withWeights);

      const values = generator.getExerciseValues(
        { exerciseId: "1", skill: "SWR2", [mode]: stored },
        exercise,
        getIntensityBySkill(withWeights ? "SWR2" : "SWR2KG"),
        "m",
        "advanced",
        DEFAULT_MAX_VALUES,
      );

      expect(values[mode]).toBe(expected);
    },
  );

  it("stops TOO_EASY at the hypertrophy target despite a higher authored target", () => {
    const exercise = createExercise("repetition", false, {
      repetition: authoredValues("12", "20"),
    });

    const values = generator.adjustExerciseValues(
      { repetition: 11, weightType: "weightAbsolute" },
      null,
      exercise,
      getIntensityBySkill("SWR2KG"),
      "m",
      "advanced",
      "TOO_EASY",
    );

    expect(values.repetition).toBe(12);
  });

  it("resets to the hypertrophy start after a weight increase", () => {
    const intensity = getIntensityBySkill("SWR2");
    const repsExercise = createExercise("repetition", true, {
      repetition: authoredValues("12", "20"),
    });
    const durationExercise = createExercise("duration", true, {
      duration: authoredValues("40", "80"),
    });

    expect(getResetRepetition(repsExercise, intensity, "m", "advanced")).toBe(
      8,
    );
    expect(getResetDuration(durationExercise, intensity, "m", "advanced")).toBe(
      30,
    );
  });
});

describe("standard progression config: load ranges", () => {
  const generator = new TrainingGenerator();

  it.each([
    ["SWR2", "beginner", 67.5, 75],
    ["SWR2", "advanced", 70, 77.5],
    ["SWR2", "professional", 70, 77.5],
    ["SK", "beginner", 52.5, 65],
    ["SK", "advanced", 55, 67.5],
    ["SK", "professional", 55, 70],
  ] as const)(
    "%s at level %s loads %d up to %d percent of F-Max",
    (skill, level, start, target) => {
      const intensity = getIntensityBySkill(skill);
      const exercise = createExercise("repetition", true);

      for (const gender of ["m", "w"] as const) {
        expect(
          getExerciseStartValue(intensity, exercise, "weight", level, gender),
        ).toBe(start);
        expect(
          getExerciseTargetValue(intensity, exercise, "weight", level, gender),
        ).toBe(target);
        const values = generator.getExerciseValues(
          null,
          exercise,
          intensity,
          gender,
          level,
          DEFAULT_MAX_VALUES,
        );
        expect(values.weight).toBe(start);
        expect(values.weightType).toBe("weightFMax");
      }
    },
  );

  it.each(["m", "w"] as const)(
    "explosive power with adjustable weight for gender %s uses 4 up to 6 reps",
    (gender) => {
      const intensity = getIntensityBySkill("SK");
      const exercise = createExercise("repetition", true);

      expect(
        getExerciseStartValue(
          intensity,
          exercise,
          "repetition",
          "advanced",
          gender,
        ),
      ).toBe(4);
      expect(
        getExerciseTargetValue(
          intensity,
          exercise,
          "repetition",
          "advanced",
          gender,
        ),
      ).toBe(6);
      expect(
        generator.getExerciseValues(
          null,
          exercise,
          intensity,
          gender,
          "advanced",
          DEFAULT_MAX_VALUES,
        ).repetition,
      ).toBe(4);
    },
  );

  it.each(
    (["SKKG", "SAKG"] as const).flatMap((skill) =>
      (["m", "w"] as const).map((gender) => [skill, gender] as const),
    ),
  )(
    "%s without adjustable weight for gender %s uses 4 up to 6 reps",
    (skill, gender) => {
      const intensity = getIntensityBySkill(skill);
      const exercise = createExercise("repetition", false);

      expect(
        getExerciseStartValue(
          intensity,
          exercise,
          "repetition",
          "advanced",
          gender,
        ),
      ).toBe(4);
      expect(
        getExerciseTargetValue(
          intensity,
          exercise,
          "repetition",
          "advanced",
          gender,
        ),
      ).toBe(6);
    },
  );

  it("starts a new exercise at the gender default of the intensity", () => {
    const intensity = {
      ...getIntensityBySkill("SK"),
      startValue: {
        repetition: { default: { default: 3 }, m: { default: 5 } },
      },
    };

    const values = generator.getExerciseValues(
      null,
      createExercise("repetition", false),
      intensity,
      "m",
      "advanced",
      DEFAULT_MAX_VALUES,
    );

    expect(values.repetition).toBe(5);
  });
});

describe("standard progression config: weight steps", () => {
  const generator = new TrainingGenerator();
  const tooHard = (
    skill: SkillCode,
    weight: number,
    exercise = createExercise("repetition", true),
    maxValues = DEFAULT_MAX_VALUES,
  ) =>
    generator.adjustExerciseValues(
      { repetition: 10, weight, weightType: "weightFMax" },
      null,
      exercise,
      getIntensityBySkill(skill),
      "m",
      "advanced",
      "TOO_HARD",
      maxValues,
    );

  it.each([
    ["SWR2", 70, 68.25],
    ["SWR2", 66, 65],
    ["SK", 52, 50.7],
    ["SK", 51, 50],
  ] as const)(
    "%s lowers %d percent of F-Max on TOO_HARD to %d",
    (skill, weight, expected) => {
      const values = tooHard(skill, weight);

      expect(values.weight).toBeCloseTo(expected);
      expect(values.repetition).toBe(10);
    },
  );

  it("lowers the load to the next real barbell load", () => {
    const exercise = {
      ...createExercise("repetition", true),
      tags: ["EQ_TYPE_WEIGHTS", "EQ_BARBELL", "EXERCISE_DIRECTION_HIP"],
    };
    const maxValues = {
      ...DEFAULT_MAX_VALUES,
      hipHinge: { ...DEFAULT_MAX_VALUES.hipHinge, barbell: 100 },
    };

    const values = tooHard("SWR2", 73.5, exercise, maxValues);

    // 73.5 % of 100 kg rounds to 72.5 kg, 72.5 kg x 0.975 rounds to 70 kg
    expect(values.weight).toBeCloseTo(70);
  });

  it("keeps the authored height of a jump exercise", () => {
    const exercise = { ...createExercise("repetition", false), isJump: true };

    const values = generator.adjustExerciseValues(
      { repetition: 8, height: 20, weightType: "weightAbsolute" },
      null,
      exercise,
      getIntensityBySkill("SWR2KG"),
      "m",
      "advanced",
      "SUCCEEDED",
    );

    expect(values.height).toBe(20);
    expect(values.repetition).toBe(9);
  });
});

describe("standard progression config: full body stability ranges and prevention exercise values", () => {
  const cases = [
    ["GKS", "repetition", true, 8, 12],
    ["GKS", "repetition", false, 8, 12],
    ["GKS", "duration", true, 30, 50],
    ["GKS", "duration", false, 30, 60],
  ] as const;

  it.each(
    cases.flatMap(([skill, mode, withWeights, start, target]) =>
      GENDERS.flatMap((gender) =>
        LEVELS.map((level) => ({
          skill,
          mode,
          withWeights,
          start,
          target,
          gender,
          level,
        })),
      ),
    ),
  )(
    "$skill for gender $gender and level $level resolves $mode with weights $withWeights to $start up to $target over authored values",
    ({ skill, mode, withWeights, start, target, gender, level }) => {
      const exercise = createExercise(mode, withWeights, {
        [mode]: authoredValues("20", "80"),
      });
      const intensity = getIntensityBySkill(skill, exercise);

      expect(
        getExerciseStartValue(intensity, exercise, mode, level, gender),
      ).toBe(start);
      expect(
        getExerciseTargetValue(intensity, exercise, mode, level, gender),
      ).toBe(target);
    },
  );

  it.each(
    (["repetition", "duration"] as const).flatMap((mode) =>
      [true, false].map((withWeights) => ({ mode, withWeights })),
    ),
  )(
    "PREVKNEE resolves $mode with weights $withWeights to the authored values",
    ({ mode, withWeights }) => {
      const exercise = createExercise(mode, withWeights, {
        [mode]: authoredValues("20", "80"),
      });
      const intensity = getIntensityBySkill("PREVKNEE", exercise);

      expect(
        getExerciseStartValue(intensity, exercise, mode, "advanced", "m"),
      ).toBe(20);
      expect(
        getExerciseTargetValue(intensity, exercise, mode, "advanced", "m"),
      ).toBe(80);
    },
  );

  it.each([
    ["GKS", true],
    ["GKS", false],
    ["PREVKNEE", true],
    ["PREVKNEE", false],
  ] as const)(
    "%s with weights %s has no weight in percent of F-Max to fall back on",
    (skill, withWeights) => {
      const intensity = getIntensityBySkill(
        skill,
        createExercise("repetition", withWeights),
      );

      expect(intensity.startValue.weight).toBeUndefined();
      expect(intensity.targetValue.weight).toBeUndefined();
    },
  );
});
