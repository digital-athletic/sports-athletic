import { TagGroups } from "@/constants/tagGroups";
import type { TrainingLevelType } from "@/schemas/common.schema";
import type { ExerciseType } from "@/schemas/exercise.schema";
import { getTagValues } from "@/utils/tagUtils";

export const isLoadedJump = (exercise: Pick<ExerciseType, "isJump" | "tags">) =>
  exercise.isJump &&
  getTagValues(exercise.tags, TagGroups.EQ_TYPE).includes("WEIGHTS");

/**
 * Percent of the knee-direction 1RM when the catalog has no limit for the
 * level: Beginner 5 to 10, every other level 10 to 20.
 */
export const getLoadedJumpDefault = (
  bound: "start" | "target",
  level: TrainingLevelType,
): number => {
  if (level === "beginner") return bound === "start" ? 5 : 10;
  return bound === "start" ? 10 : 20;
};
