import { supabase } from "./supabaseClient";

const SUPABASE_VIDEO_BUCKET = "videos";
const SUPABASE_IMAGE_BUCKET = "images";
const SUPABASE_EXERCISE_VIDEOS_BUCKET = "exercise_videos";
const SUPABASE_EXERCISE_PICTURES_BUCKET = "exercise_pictures";
const SUPABASE_TUTORIAL_VIDEOS_BUCKET = "tutorial_videos";
const SUPABASE_TUTORIAL_PICTURES_BUCKET = "tutorial_pictures";

const DEFAULT_SIGNED_URL_EXPIRY = 3600;

export async function getSignedUrl(
  bucket: string,
  path: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, DEFAULT_SIGNED_URL_EXPIRY);

    if (error || !data?.signedUrl) {
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function getVideoUrl(path: string): Promise<string | null> {
  return getSignedUrl(SUPABASE_VIDEO_BUCKET, path);
}

export async function getImageUrl(path: string): Promise<string | null> {
  return getSignedUrl(SUPABASE_IMAGE_BUCKET, path);
}

export async function getExerciseVideoUrl(
  path: string,
): Promise<string | null> {
  return getSignedUrl(SUPABASE_EXERCISE_VIDEOS_BUCKET, path);
}

export async function getExercisePictureUrl(
  path: string,
): Promise<string | null> {
  return getSignedUrl(SUPABASE_EXERCISE_PICTURES_BUCKET, path);
}

export async function getTutorialVideoUrl(
  path: string,
): Promise<string | null> {
  return getSignedUrl(SUPABASE_TUTORIAL_VIDEOS_BUCKET, path);
}

export async function getTutorialPictureUrl(
  path: string,
): Promise<string | null> {
  return getSignedUrl(SUPABASE_TUTORIAL_PICTURES_BUCKET, path);
}
