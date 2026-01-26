import type { ExerciseType } from "@/schemas/exercise.schema";
import {
  createExerciseMap,
  getExerciseOrThrow,
  getExerciseOrDefault,
} from "./exerciseAccessor";

const createMockExercise = (id: string): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name: `Exercise ${id}`,
  displayName: `Exercise ${id}`,
  description: null,
  picture: null,
  video: null,
  values: null,
  tags: [],
  isAdvanceByReps: true,
  isAdvanceByDuration: false,
  isJump: false,
});

describe("exerciseAccessor", () => {
  const mockExercises: ExerciseType[] = [
    createMockExercise("1"),
    createMockExercise("2"),
  ];

  it("creates map and retrieves exercises", () => {
    const map = createExerciseMap(mockExercises);

    expect(map.size).toBe(2);
    expect(getExerciseOrThrow(map, "1").id).toBe("1");
  });

  it("throws descriptive error for missing exercise", () => {
    const map = createExerciseMap(mockExercises);

    expect(() => getExerciseOrThrow(map, "999")).toThrow(
      "Exercise not found: 999",
    );
  });

  it("returns default when exercise not found", () => {
    const map = createExerciseMap(mockExercises);
    const defaultExercise = createMockExercise("default");

    expect(getExerciseOrDefault(map, "999", defaultExercise).id).toBe(
      "default",
    );
  });
});
