import { PAUSE_EXERCISE_ID } from "@/features/training/models/IdTypes";
import { createExercise } from "@/features/training/utils/testFixtures";
import { hasCompletedExerciseSet, keepCompletedSets } from "./completedSets";

describe("hasCompletedExerciseSet: deciding whether an early finish is saved", () => {
  it("is true when one exercise set is completed", () => {
    const exerciseList = [
      createExercise({ set: [1, 1], completed: true }),
      createExercise({ exerciseId: "2", set: [1, 1] }),
    ];

    expect(hasCompletedExerciseSet(exerciseList)).toBe(true);
  });

  it("is false when no set is completed", () => {
    const exerciseList = [createExercise({ set: [1, 1] })];

    expect(hasCompletedExerciseSet(exerciseList)).toBe(false);
  });

  it("is false for an empty list", () => {
    expect(hasCompletedExerciseSet([])).toBe(false);
  });

  it("ignores skipped sets", () => {
    const exerciseList = [
      createExercise({ set: [1, 1], completed: true, skipped: true }),
    ];

    expect(hasCompletedExerciseSet(exerciseList)).toBe(false);
  });

  it("ignores completed rests", () => {
    const exerciseList = [
      createExercise({ exerciseId: PAUSE_EXERCISE_ID, completed: true }),
      createExercise({ set: [1, 1] }),
    ];

    expect(hasCompletedExerciseSet(exerciseList)).toBe(false);
  });

  it("ignores completed strength test sets", () => {
    const exerciseList = [
      createExercise({ set: [1, 1], repetition: -1, completed: true }),
    ];

    expect(hasCompletedExerciseSet(exerciseList)).toBe(false);
  });

  it("is false for a strength test with a completed regular set", () => {
    const exerciseList = [
      createExercise({ set: [1, 1], repetition: 10, completed: true }),
      createExercise({ exerciseId: "2", set: [1, 1], repetition: -1 }),
    ];

    expect(hasCompletedExerciseSet(exerciseList)).toBe(false);
  });

  it("ignores a completed entry without a set tuple, which the totals do not count", () => {
    const exerciseList = [createExercise({ duration: 60, completed: true })];

    expect(hasCompletedExerciseSet(exerciseList)).toBe(false);
  });
});

describe("keepCompletedSets: the sets an early finish saves", () => {
  it("keeps a fully completed exercise and drops an open one", () => {
    const exerciseList = [
      createExercise({ set: [1, 2], repetition: 10, completed: true }),
      createExercise({ set: [2, 2], repetition: 10, completed: true }),
      createExercise({ exerciseId: "2", set: [1, 1], repetition: 8 }),
    ];

    expect(keepCompletedSets(exerciseList)).toEqual([
      createExercise({ set: [1, 2], repetition: 10, completed: true }),
      createExercise({ set: [2, 2], repetition: 10, completed: true }),
    ]);
  });

  it("renumbers the sets of a partly completed exercise so its last kept set closes it", () => {
    const exerciseList = [
      createExercise({ set: [1, 3], repetition: 10, completed: true }),
      createExercise({ set: [2, 3], repetition: 10, completed: true }),
      createExercise({ set: [3, 3], repetition: 10 }),
    ];

    expect(keepCompletedSets(exerciseList)).toEqual([
      createExercise({ set: [1, 2], repetition: 10, completed: true }),
      createExercise({ set: [2, 2], repetition: 10, completed: true }),
    ]);
  });

  it("drops skipped sets and rests", () => {
    const exerciseList = [
      createExercise({ set: [1, 2], completed: true, skipped: true }),
      createExercise({ exerciseId: PAUSE_EXERCISE_ID, completed: true }),
      createExercise({ set: [2, 2], completed: true }),
    ];

    expect(keepCompletedSets(exerciseList)).toEqual([
      createExercise({ set: [1, 1], completed: true }),
    ]);
  });

  it("keeps a completed entry without a set tuple unchanged", () => {
    const exerciseList = [createExercise({ duration: 60, completed: true })];

    expect(keepCompletedSets(exerciseList)).toEqual([
      createExercise({ duration: 60, completed: true }),
    ]);
  });

  it("keeps the completed sets of alternating superset exercises apart", () => {
    const exerciseList = [
      createExercise({ exerciseId: "1", set: [1, 2], completed: true }),
      createExercise({ exerciseId: "2", set: [1, 2], completed: true }),
      createExercise({ exerciseId: "1", set: [2, 2], completed: true }),
      createExercise({ exerciseId: "2", set: [2, 2] }),
    ];

    expect(keepCompletedSets(exerciseList)).toEqual([
      createExercise({ exerciseId: "1", set: [1, 2], completed: true }),
      createExercise({ exerciseId: "2", set: [1, 1], completed: true }),
      createExercise({ exerciseId: "1", set: [2, 2], completed: true }),
    ]);
  });

  it("returns an empty list when nothing is completed", () => {
    expect(keepCompletedSets([createExercise({ set: [1, 1] })])).toEqual([]);
  });
});
