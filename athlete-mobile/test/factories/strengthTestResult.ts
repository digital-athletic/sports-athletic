import type { BlockResult } from "@/features/training/workoutGenerator/stages/blockWalk";
import type { ExercisesBlock } from "@/schemas/strengthTestTemplate.schema";
import { generatePrescribedLifts } from "./strengthTestLifts";

type PrescribedBlockResult = Extract<BlockResult, { status: "prescribed" }>;

type ExercisesBlockSettings = Omit<
  ExercisesBlock,
  "kind" | "skill" | "exercises"
>;

/**
 * Builds the result of an exercises block: the listed catalog exercises in
 * list order, without used branches, and the block settings given.
 *
 * generatePrescribedResult("TEST", ["25", "54"], { sets: 9 })
 * → { status: "prescribed", block: { kind: "exercises", skill: "TEST", exercises: ["25", "54"], sets: 9 },
 *     exercises: [{ source: "exercise", exerciseId: "25" }, { source: "exercise", exerciseId: "54" }],
 *     usedBranchIds: [] }
 */
export const generatePrescribedResult = (
  skill: string,
  exerciseIds: string[],
  settings: ExercisesBlockSettings = {},
): PrescribedBlockResult => ({
  status: "prescribed",
  block: { kind: "exercises", skill, exercises: exerciseIds, ...settings },
  exercises: generatePrescribedLifts(exerciseIds),
  usedBranchIds: [],
});
