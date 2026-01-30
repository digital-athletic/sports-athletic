import * as v from "valibot";
import ExercisesData from "../../assets/data/generator/Exercises.json";
import { ExerciseSchema, ExercisesArraySchema } from "./exercise.schema";

describe("ExerciseSchema", () => {
  test("validates Exercises.json", () => {
    const result = v.safeParse(ExercisesArraySchema, ExercisesData);

    if (!result.success) {
      console.error("Validation issues:", v.flatten(result.issues));
    }

    expect(result.success).toBe(true);
  });

  test("validates a single exercise with all fields", () => {
    const exercise = {
      id: "1",
      level: { m: 1, w: 1 },
      name: "Test Exercise",
      displayName: "Test Exercise",
      description: "Test description",
      picture: "test.jpg",
      video: "test.mp4",
      values: {
        repetition: {
          startValue: {
            default: { beginner: "10" },
          },
          targetValue: {
            default: { beginner: "15" },
          },
        },
        weight: {
          startValue: {
            default: { beginner: "20" },
            type: { type: "weightAbsolute" as const },
          },
          targetValue: {
            default: { beginner: "30" },
            type: { type: "weightAbsolute" as const },
          },
        },
      },
      tags: ["TAG1", "TAG2"],
      isAdvanceByReps: true,
      isAdvanceByDuration: false,
      isJump: false,
    };

    const result = v.safeParse(ExerciseSchema, exercise);
    expect(result.success).toBe(true);
  });

  test("validates exercise with null displayName and description", () => {
    const exercise = {
      id: "999999",
      level: { m: 1, w: 1 },
      name: "Pause",
      displayName: null,
      description: null,
      picture: "pause.jpg",
      video: null,
      values: null,
      tags: ["PAUSE"],
      isAdvanceByReps: false,
      isAdvanceByDuration: false,
      isJump: false,
    };

    const result = v.safeParse(ExerciseSchema, exercise);
    expect(result.success).toBe(true);
  });

  test("validates exercise with null values", () => {
    const exercise = {
      id: "999999",
      level: { m: 1, w: 1 },
      name: "Pause",
      displayName: "Pause",
      description: "Pause description",
      picture: "pause.jpg",
      video: null,
      values: null,
      tags: ["PAUSE"],
      isAdvanceByReps: false,
      isAdvanceByDuration: false,
      isJump: false,
    };

    const result = v.safeParse(ExerciseSchema, exercise);
    expect(result.success).toBe(true);
  });

  test("rejects exercise with missing required fields", () => {
    const invalidExercise = {
      id: "1",
      name: "Test",
    };

    const result = v.safeParse(ExerciseSchema, invalidExercise);
    expect(result.success).toBe(false);
  });
});
