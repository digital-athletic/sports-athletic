import { supabase } from "./supabaseClient";

const SUPABASE_VIDEO_BUCKET = "videos";
const SUPABASE_IMAGE_BUCKET = "images";
const SUPABASE_EXERCISE_VIDEOS_BUCKET = "exercise_videos";
const SUPABASE_EXERCISE_PICTURES_BUCKET = "exercise_pictures";
const SUPABASE_TUTORIAL_VIDEOS_BUCKET = "tutorial_videos";
const SUPABASE_TUTORIAL_PICTURES_BUCKET = "tutorial_pictures";

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function getVideoUrl(path: string): string {
  return getPublicUrl(SUPABASE_VIDEO_BUCKET, path);
}

export function getImageUrl(path: string): string {
  return getPublicUrl(SUPABASE_IMAGE_BUCKET, path);
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

export function getTutorialPictureUrl(path: string): string {
  return getPublicUrl(SUPABASE_TUTORIAL_PICTURES_BUCKET, path);
}
