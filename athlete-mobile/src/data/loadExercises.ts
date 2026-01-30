import * as v from "valibot";
import ExercisesData from "../../assets/data/generator/Exercises.json";
import {
  ExercisesArraySchema,
  type ExerciseType,
} from "@/schemas/exercise.schema";

export const loadExercises = (): ExerciseType[] => {
  const result = v.safeParse(ExercisesArraySchema, ExercisesData);

  if (!result.success) {
    console.error("Exercise validation failed:", v.flatten(result.issues));
    throw new Error("Exercise data validation failed");
  }

  return result.output;
};
