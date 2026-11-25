/**
 * Read-only access to the public Supabase Storage buckets.
 *
 * The exercise buckets are public, so this module uses only the public
 * object URLs and no API key, like the app. The file names come from
 * Exercises.json, so the buckets never need to be listed.
 */
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { once } from "node:events";
import { join } from "node:path";
import { finished } from "node:stream/promises";
import { HttpError, type HttpClient } from "./http.ts";
import type { ManifestFile } from "./manifest.ts";

export type DownloadedFile = ManifestFile & { path: string };

export const publicUrl = (
  supabaseUrl: string,
  bucket: string,
  name: string,
): string =>
  `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(name)}`;

/** Strips the quotes and weak prefix from an HTTP ETag. */
export const normalizeEtag = (etag: string): string =>
  etag.replace(/^W\//, "").replaceAll('"', "");

/**
 * Downloads a public file into `dir` and hashes it on the way. Returns
 * undefined if the bucket lacks it (Supabase answers 400 or 404).
 */
export async function downloadFile(
  http: HttpClient,
  supabaseUrl: string,
  bucket: string,
  name: string,
  dir: string,
): Promise<DownloadedFile | undefined> {
  let response: Response;
  try {
    response = await http.request(publicUrl(supabaseUrl, bucket, name));
  } catch (error: unknown) {
    if (error instanceof HttpError && error.status < 500) return undefined;
    throw error;
  }
  if (!response.body) throw new Error(`Empty response for ${bucket}/${name}`);

  const path = join(dir, name);
  const md5 = createHash("md5");
  const sha256 = createHash("sha256");
  const out = createWriteStream(path);
  let size = 0;
  for await (const chunk of response.body) {
    md5.update(chunk);
    sha256.update(chunk);
    size += chunk.length;
    if (!out.write(chunk)) await once(out, "drain");
  }
  out.end();
  await finished(out);
  return {
    path,
    bucket,
    name,
    size,
    supabaseEtag: normalizeEtag(response.headers.get("etag") ?? ""),
    md5: md5.digest("hex"),
    sha256: sha256.digest("hex"),
  };
}
