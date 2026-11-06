import { getExercisePictureUrl } from "@/services/StorageService";

/** Public URL of an exercise picture, or null when the exercise has none. */
export function getExercisePictureSource(
  picture: string | null | undefined,
): string | null {
  const fileName = picture?.split("/").pop();
  return fileName ? getExercisePictureUrl(fileName) : null;
}
