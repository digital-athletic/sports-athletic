import { supabase } from "./supabaseClient";

const SUPABASE_EXERCISE_VIDEOS_BUCKET = "exercise_videos";
const SUPABASE_EXERCISE_PICTURES_BUCKET = "exercise_pictures";
const SUPABASE_TUTORIAL_VIDEOS_BUCKET = "tutorial_videos";

export function getPublicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function getExerciseVideoUrl(path: string): string {
  return getPublicUrl(SUPABASE_EXERCISE_VIDEOS_BUCKET, path);
}

export function getExercisePictureUrl(path: string): string {
  return getPublicUrl(SUPABASE_EXERCISE_PICTURES_BUCKET, path);
}

export function getTutorialVideoUrl(path: string): string {
  return getPublicUrl(SUPABASE_TUTORIAL_VIDEOS_BUCKET, path);
}
