import type { PrescribedExerciseReference } from "@/features/training/workoutGenerator/stages/blockWalk";

/**
 * Builds the lifts a workout prescribes by catalog ID, in the given order.
 *
 * generatePrescribedLifts(["25", "54"])
 * → [{ source: "exercise", exerciseId: "25" }, { source: "exercise", exerciseId: "54" }]
 */
export const generatePrescribedLifts = (
  exerciseIds: string[],
): PrescribedExerciseReference[] =>
  exerciseIds.map((exerciseId) => ({ source: "exercise", exerciseId }));
