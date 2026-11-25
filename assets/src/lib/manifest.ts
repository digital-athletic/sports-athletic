/**
 * The manifest records, per exercise, which Zenodo record holds its files.
 * It is the mirror's memory: the script saves it right after creating a
 * Zenodo draft record and after publishing it, so an interrupted run
 * resumes where it stopped instead of creating duplicates.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

export type ManifestFile = {
  bucket: string;
  name: string;
  size: number;
  /** Supabase ETag of the file when it was uploaded to Zenodo. */
  supabaseEtag: string;
  md5: string;
  sha256: string;
};

export type ManifestEntry = {
  depositionId: number;
  /** "draft": a Zenodo draft record exists, but is not published yet. */
  state: "draft" | "published";
  conceptRecId?: string;
  doi?: string;
  conceptDoi?: string;
  recordUrl?: string;
  publishedAt?: string;
  /** Files of the published Zenodo record. */
  files: ManifestFile[];
};

export type Manifest = {
  /** Zenodo instance the Zenodo records live on, e.g. https://zenodo.org. */
  zenodoUrl: string;
  exercises: Record<string, ManifestEntry>;
};

/** One manifest per Zenodo instance, named after its host. */
export const manifestPath = (assetsDir: string, zenodoHost: string): string =>
  `${assetsDir}/manifest.${zenodoHost}.json`;

export function loadManifest(path: string, zenodoUrl: string): Manifest {
  if (!existsSync(path)) return { zenodoUrl, exercises: {} };
  const manifest = JSON.parse(readFileSync(path, "utf8")) as Manifest;
  if (manifest.zenodoUrl !== zenodoUrl) {
    throw new Error(
      `${path} belongs to ${manifest.zenodoUrl}, not ${zenodoUrl}`,
    );
  }
  return manifest;
}

/** Writes atomically, exercises sorted by numeric id for stable diffs. */
export function saveManifest(path: string, manifest: Manifest): void {
  const exercises = Object.fromEntries(
    Object.entries(manifest.exercises).sort(
      ([a], [b]) => Number(a) - Number(b),
    ),
  );
  const tmp = `${path}.tmp`;
  writeFileSync(
    tmp,
    `${JSON.stringify({ ...manifest, exercises }, null, 2)}\n`,
  );
  renameSync(tmp, path);
}
