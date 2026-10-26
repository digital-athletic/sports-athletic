import { TagGroups } from "@/constants/tagGroups";
import type { GeneratorError } from "@/features/training/models/GeneratorError";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";
import { isEquipmentPartAvailable } from "../../ruleFamilies/equipmentAvailability";
import type {
  BlockHandler,
  BlockHandlerRegistry,
  PrescribedExerciseReference,
} from "../../stages/blockWalk";

// The exercise's own equipment tags decide; branch tags play no part.
const listMissingExerciseEquipment = (
  exercise: ExerciseType,
  equipment: readonly string[],
): string[] => {
  const parts = getTagValues(exercise.tags, TagGroups.EQUIPMENT);
  return parts.filter(
    (part) =>
      !isEquipmentPartAvailable({
        part,
        equipment,
        branchParts: parts,
        exerciseIds: [exercise.id],
      }),
  );
};

/**
 * Resolves the listed exercises from the exercise catalog in list order,
 * whatever the athlete's level, branch levels or used branches. An unknown or
 * duplicate exercise is a template error; an exercise the place cannot equip
 * throws NO_EXERCISES/EQUIPMENT with the missing equipment. No shortened list
 * reaches the set list.
 *
 * handleExercisesBlock({ kind: "exercises", skill: "TEST", exercises: ["25"] }, input, used,
 *   { earlierResults: [], blockPath: "TEST.blocks[1]" })
 * → { status: "prescribed", exercises: [{ source: "exercise", exerciseId: "25" }], usedBranchIds: [] }
 */
export const handleExercisesBlock: BlockHandler<"exercises"> = (
  block,
  input,
  _usedBranches,
  walk,
) => {
  const blockPath = walk?.blockPath ?? block.skill;
  const listed = new Set<string>();
  const exercises = block.exercises.map(
    (exerciseId): PrescribedExerciseReference => {
      if (listed.has(exerciseId)) {
        throw new Error(`${blockPath}: exercise ${exerciseId} is listed twice`);
      }
      listed.add(exerciseId);
      const exercise = input.exerciseCatalog.find(
        ({ id }) => id === exerciseId,
      );
      if (!exercise) {
        throw new Error(
          `${blockPath}: exercise ${exerciseId} is no catalog exercise`,
        );
      }
      const missing = listMissingExerciseEquipment(exercise, input.equipment);
      if (missing.length > 0) {
        throw {
          type: "NO_EXERCISES",
          subtype: "EQUIPMENT",
          params: missing,
        } satisfies GeneratorError;
      }
      return { source: "exercise", exerciseId };
    },
  );
  return { status: "prescribed", block, exercises, usedBranchIds: [] };
};

export const EXERCISES_BLOCK_HANDLER: BlockHandlerRegistry["exercises"] = {
  usedBranchScope: "workout",
  handleBlock: handleExercisesBlock,
};
