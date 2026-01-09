import { supabase } from "./supabaseClient";

const SUPABASE_VIDEO_BUCKET = "videos";
const SUPABASE_IMAGE_BUCKET = "images";
const SUPABASE_EXERCISE_PICTURES_BUCKET = "exercise_pictures";

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

export function getExercisePictureUrl(path: string): string {
  return getPublicUrl(SUPABASE_EXERCISE_PICTURES_BUCKET, path);
}
