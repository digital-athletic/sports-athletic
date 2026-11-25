/**
 * Exercises from the app's Exercises.json and the Zenodo metadata built
 * from them. One exercise with a video becomes one Zenodo record holding
 * its video and, if it has one, its picture.
 */
import type { DepositionMetadata } from "./zenodo.ts";

export const VIDEO_BUCKET = "exercise_videos";
export const PICTURE_BUCKET = "exercise_pictures";

export type Exercise = {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  /** File name in the video bucket. */
  video: string;
  /** File name in the picture bucket. */
  picture: string | null;
};

export type MirrorConfig = {
  creators: DepositionMetadata["creators"];
  license: string;
  language: string;
  /** HTML appended to every description (license, funding). */
  descriptionFooter: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" && value !== "" ? value : null;

/** Exercises.json stores `exerciseVideos/<file>`; the bucket holds `<file>`. */
const fileName = (path: string | null): string | null =>
  path === null ? null : (path.split("/").pop() ?? null);

/** Exercises that have a video, sorted by numeric id. */
export function parseExercises(raw: unknown): Exercise[] {
  if (!Array.isArray(raw)) throw new Error("Exercises.json is not an array");
  const exercises: Exercise[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.id !== "string") {
      throw new Error(`Invalid exercise entry: ${JSON.stringify(item)}`);
    }
    const video = fileName(stringOrNull(item.video));
    if (video === null) continue;
    exercises.push({
      id: item.id,
      name: typeof item.name === "string" ? item.name : item.id,
      displayName: stringOrNull(item.displayName),
      description: stringOrNull(item.description),
      video,
      picture: fileName(stringOrNull(item.picture)),
    });
  }
  return exercises.sort((a, b) => Number(a.id) - Number(b.id));
}

const escapeHtml = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function buildMetadata(
  exercise: Exercise,
  config: MirrorConfig,
): DepositionMetadata {
  const name = exercise.displayName ?? exercise.name;
  const content = exercise.picture ? "video and picture" : "video";
  const paragraphs = [
    exercise.description ? `<p>${escapeHtml(exercise.description)}</p>` : "",
    `<p>Exercise ${content} of exercise ${escapeHtml(exercise.id)} ` +
      `("${escapeHtml(name)}") from Sports Athletic, an open source ` +
      `training app: <a href="https://github.com/digital-athletic/sports-athletic">` +
      `github.com/digital-athletic/sports-athletic</a>.</p>`,
    config.descriptionFooter,
  ];
  return {
    upload_type: "video",
    title: `${name} (Sports Athletic exercise ${exercise.id})`,
    description: paragraphs.filter(Boolean).join("\n"),
    creators: config.creators,
    access_right: "open",
    license: config.license,
    language: config.language,
    keywords: [
      "Sports Athletic",
      "exercise video",
      // Finds the exercise's Zenodo record in the Zenodo search.
      `sports-athletic-exercise-${exercise.id}`,
    ],
  };
}
