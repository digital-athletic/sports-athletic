import { getExerciseById } from "@/data/exerciseRegistry";
import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { GenderTag } from "@/features/training/models/Intensity";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import {
  readExerciseStartValue,
  readExerciseTargetValue,
} from "./startAndTargetValues";
import { readSkillIntensity } from "./skillIntensity";

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

const GENDERS: GenderTag[] = ["m", "w", "k"];

/**
 * Lists the exercises that the branches of a cardio skill tree name, each once.
 *
 * listTreeExercises("CARDIO_2") → [the exercises of every level of every CARDIO_2 branch]
 */
const listTreeExercises = (skill: SkillCode): ExerciseType[] => {
  const tree = getAllSkillTrees()[skill];
  if (!tree) throw new Error(`Skill tree ${skill} is missing`);
  const ids = new Set(
    Object.values(tree).flatMap((branch) =>
      Object.values(branch.levels).map((level) => level.exerciseId),
    ),
  );
  return [...ids]
    .map((id) => getExerciseById(id))
    .filter((exercise): exercise is ExerciseType => !!exercise);
};

describe("cardioAuthoredCounts: authored start and target counts", () => {
  it.each(AUTHORED_COUNTS)(
    "%s intensity at level %s starts at %i and targets %i",
    (skill, level, start, target) => {
      const intensity = readSkillIntensity(loadSkillCatalog(), skill);
      const key = level === "beginner" ? "default" : level;

      expect(intensity.startValue.repetition?.default?.[key]).toBe(start);
      expect(intensity.targetValue.repetition?.default?.[key]).toBe(target);
    },
  );

  it.each(AUTHORED_COUNTS)(
    "%s exercises at level %s start at %i and target %i",
    (skill, level, start, target) => {
      const intensity = readSkillIntensity(loadSkillCatalog(), skill);
      const counts = listTreeExercises(skill).flatMap((exercise) =>
        GENDERS.map((gender) => ({
          id: exercise.id,
          gender,
          start: readExerciseStartValue(intensity, exercise, "repetition", {
            gender,
            level,
          }),
          target: readExerciseTargetValue(intensity, exercise, "repetition", {
            gender,
            level,
          }),
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
