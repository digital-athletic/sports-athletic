import type {
  BlockResult,
  InterpretedWorkout,
  PrescribedExerciseReference,
} from "@/features/training/workoutGenerator/stages/blockWalk";
import type {
  ExercisesBlock,
  WorkoutBlock,
} from "@/schemas/strengthTestTemplate.schema";

type PrescribedBlockResult = Extract<BlockResult, { status: "prescribed" }>;

/**
 * Builds a workout the interpreter runs from any blocks, exercises blocks
 * included, which an AIWL template of a short workout cannot hold.
 *
 * generateWorkoutWithExercises([picksBlock, generateExercisesBlock(["25"])])
 * → { id: "day", blocks: [picksBlock, { kind: "exercises", skill: "TEST", exercises: ["25"] }] }
 */
export const generateWorkoutWithExercises = (
  blocks: WorkoutBlock[],
  id = "day",
): InterpretedWorkout => ({ id, blocks });

/**
 * Builds an exercises block of the skill that lists the exercise IDs. The
 * overrides replace any field.
 *
 * generateExercisesBlock(["25", "50"])
 * → { kind: "exercises", skill: "TEST", exercises: ["25", "50"] }
 */
export const generateExercisesBlock = (
  exercises: string[] = ["25", "50"],
  skill = "TEST",
  overrides: Partial<ExercisesBlock> = {},
): ExercisesBlock => ({ kind: "exercises", skill, exercises, ...overrides });

/**
 * Builds the references a prescribed result holds, one per catalog exercise ID.
 *
 * generatePrescribedReferences(["25", "50"])
 * → [{ source: "exercise", exerciseId: "25" }, { source: "exercise", exerciseId: "50" }]
 */
export const generatePrescribedReferences = (
  exerciseIds: string[],
): PrescribedExerciseReference[] =>
  exerciseIds.map((exerciseId) => ({ source: "exercise", exerciseId }));

/**
 * Builds the result of an exercises block: one prescribed reference per
 * listed exercise and no used branches.
 *
 * generatePrescribedBlockResult(generateExercisesBlock(["25"]))
 * → { status: "prescribed", block, exercises: [{ source: "exercise", exerciseId: "25" }],
 *     usedBranchIds: [] }
 */
export const generatePrescribedBlockResult = (
  block: ExercisesBlock,
): PrescribedBlockResult => ({
  status: "prescribed",
  block,
  exercises: generatePrescribedReferences(block.exercises),
  usedBranchIds: [],
});
