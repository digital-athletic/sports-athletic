import {
  findCatalogExerciseById,
  generateValueExercise,
} from "@test/factories/valueExercise";
import { loadIntensityConfig } from "@/data/loadIntensityConfig";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import type { GenderTag } from "@/features/training/models/Intensity";
import { readExerciseValues } from "./exerciseValues";
import { readSkillIntensity } from "./skillIntensity";

const GENDERS: GenderTag[] = ["m", "w", "k"];
const LEVELS = ["beginner", "intermediate", "advanced", "professional"];

/**
 * Reads the start duration of a new exercise under the speed warm-up skill.
 *
 * readSpeedWarmUpDuration("721", "m", "advanced")
 * → 30
 */
const readSpeedWarmUpDuration = (
  exerciseId: string,
  gender: GenderTag,
  level: string,
) =>
  readExerciseValues(
    {
      intensity: loadIntensityConfig("WUSKSA"),
      exercise: findCatalogExerciseById(exerciseId),
      gender,
      level,
    },
    null,
    loadSkillCatalog(),
    "WUSKSA",
  ).duration;

describe("catalogValueLookup: empty gender values", () => {
  it.each(GENDERS.flatMap((g) => LEVELS.map((l) => [g, l] as const)))(
    "ladder exercise 721 starts at 30 seconds for gender %s and level %s",
    (gender, level) => {
      expect(readSpeedWarmUpDuration("721", gender, level)).toBe(30);
    },
  );

  it.each(
    ["433", "434"].flatMap((id) =>
      GENDERS.flatMap((g) => LEVELS.map((l) => [id, g, l] as const)),
    ),
  )(
    "fast push-ups %s start at 15 seconds for gender %s and level %s",
    (id, gender, level) => {
      expect(readSpeedWarmUpDuration(id, gender, level)).toBe(15);
    },
  );
});

describe("catalogValueLookup: plyometrics", () => {
  it.each(["PLYO_HIGH", "PLYO_MEDIUM"] as const)(
    "%s uses 4 up to 12 repetitions",
    (skill) => {
      const intensity = readSkillIntensity(loadSkillCatalog(), skill);

      expect(intensity.startValue.repetition?.default?.default).toBe(4);
      expect(intensity.targetValue.repetition?.default?.default).toBe(12);
      expect(
        readExerciseValues(
          {
            intensity,
            exercise: generateValueExercise("repetition"),
            gender: "m",
            level: "advanced",
          },
          null,
          loadSkillCatalog(),
          skill,
        ).repetition,
      ).toBe(4);
    },
  );
});
