import {
  generateAuthoredValues,
  generateValueExercise,
} from "@test/factories/valueExercise";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { GenderTag } from "@/features/training/models/Intensity";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import { readExerciseValues } from "./exerciseValues";
import { readFeedbackAdjustment } from "./feedbackAdjustment";
import { readSkillIntensity } from "./skillIntensity";
import {
  readExerciseStartValue,
  readExerciseTargetValue,
} from "./startAndTargetValues";

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

const advancedMan = { gender: "m", level: "advanced" } as const;

/**
 * Lists a skill, gender and level for every combination of the three.
 *
 * listEveryCombination(["SK"]).length
 * → 12
 */
const listEveryCombination = <T>(values: T[]) =>
  values.flatMap((value) =>
    GENDERS.flatMap((gender) =>
      LEVELS.map((level) => [value, gender, level] as const),
    ),
  );

/**
 * Reads the start and target of one value for a skill and an exercise that
 * advances by the given mode.
 *
 * readSkillRange("SWR2", "duration", { withWeights: true, athlete: { gender: "m", level: "advanced" } })
 * → { start: 30, target: 50 }
 */
const readSkillRange = (
  skill: SkillCode,
  mode: "repetition" | "duration",
  {
    withWeights,
    athlete,
    authored,
  }: {
    withWeights: boolean;
    athlete: { gender: GenderTag; level: TrainingLevelType };
    authored?: { start: string; target: string };
  },
) => {
  const exercise = generateValueExercise(mode, {
    withWeights,
    values: authored
      ? { [mode]: generateAuthoredValues(authored.start, authored.target) }
      : {},
  });
  const intensity = readSkillIntensity(loadSkillCatalog(), skill, exercise);
  return {
    start: readExerciseStartValue(intensity, exercise, mode, athlete),
    target: readExerciseTargetValue(intensity, exercise, mode, athlete),
  };
};

describe("standardProgressionConfig: ladder steps", () => {
  it.each(listEveryCombination(STANDARD_SKILLS))(
    "%s for gender %s and level %s uses one or two ladder steps",
    (skill, gender, level) => {
      const adjustment = readFeedbackAdjustment(
        readSkillIntensity(loadSkillCatalog(), skill),
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

describe("standardProgressionConfig: hypertrophy range", () => {
  const cases = [
    ["repetition", true, 8, 12],
    ["repetition", false, 8, 12],
    ["duration", true, 30, 50],
    ["duration", false, 30, 60],
  ] as const;

  it.each(
    listEveryCombination(HYPERTROPHY_SKILLS).flatMap(([skill, gender, level]) =>
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
      expect(
        readSkillRange(skill, mode, {
          withWeights,
          athlete: { gender, level },
          authored: { start: "15", target: "80" },
        }),
      ).toEqual({ start, target });
    },
  );
});

describe("standardProgressionConfig: explosive power repetitions", () => {
  it.each(["m", "w"] as const)(
    "SK with adjustable weight for gender %s uses 4 up to 6 repetitions",
    (gender) => {
      const exercise = generateValueExercise("repetition", {
        withWeights: true,
      });
      const intensity = readSkillIntensity(loadSkillCatalog(), "SK", exercise);
      const athlete = { gender, level: "advanced" } as const;

      expect(
        readExerciseStartValue(intensity, exercise, "repetition", athlete),
      ).toBe(4);
      expect(
        readExerciseTargetValue(intensity, exercise, "repetition", athlete),
      ).toBe(6);
      expect(
        readExerciseValues(
          { intensity, exercise, ...athlete },
          null,
          loadSkillCatalog(),
        ).repetition,
      ).toBe(4);
    },
  );

  it.each(
    (["SKKG", "SAKG"] as const).flatMap((skill) =>
      (["m", "w"] as const).map((gender) => [skill, gender] as const),
    ),
  )(
    "%s without adjustable weight for gender %s uses 4 up to 6 repetitions",
    (skill, gender) => {
      expect(
        readSkillRange(skill, "repetition", {
          withWeights: false,
          athlete: { gender, level: "advanced" },
        }),
      ).toEqual({ start: 4, target: 6 });
    },
  );
});

describe("standardProgressionConfig: full body stability and prevention", () => {
  const cases = [
    ["repetition", true, 8, 12],
    ["repetition", false, 8, 12],
    ["duration", true, 30, 50],
    ["duration", false, 30, 60],
  ] as const;

  it.each(
    cases.flatMap(([mode, withWeights, start, target]) =>
      GENDERS.flatMap((gender) =>
        LEVELS.map((level) => ({
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
    "GKS for gender $gender and level $level falls back to $start up to $target for $mode with weights $withWeights without authored values",
    ({ mode, withWeights, start, target, gender, level }) => {
      expect(
        readSkillRange("GKS", mode, {
          withWeights,
          athlete: { gender, level },
        }),
      ).toEqual({ start, target });
    },
  );

  it.each(
    (["GKS", "PREVKNEE"] as const).flatMap((skill) =>
      (["repetition", "duration"] as const).flatMap((mode) =>
        [true, false].map((withWeights) => ({ skill, mode, withWeights })),
      ),
    ),
  )(
    "$skill resolves $mode with weights $withWeights to the authored values",
    ({ skill, mode, withWeights }) => {
      expect(
        readSkillRange(skill, mode, {
          withWeights,
          athlete: advancedMan,
          authored: { start: "20", target: "80" },
        }),
      ).toEqual({ start: 20, target: 80 });
    },
  );

  it.each(
    (["GKS", "PREVKNEE"] as const).flatMap((skill) =>
      [true, false].map((withWeights) => ({ skill, withWeights })),
    ),
  )(
    "$skill with weights $withWeights has no weight in percent of F-Max to fall back on",
    ({ skill, withWeights }) => {
      const intensity = readSkillIntensity(
        loadSkillCatalog(),
        skill,
        generateValueExercise("repetition", { withWeights }),
      );

      expect(intensity.startValue.weight).toBeUndefined();
      expect(intensity.targetValue.weight).toBeUndefined();
    },
  );
});
