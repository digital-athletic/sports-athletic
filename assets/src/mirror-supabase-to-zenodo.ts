/**
 * Copies the exercise videos (and their pictures) from the public Supabase
 * buckets to Zenodo, one Zenodo record per exercise, and tracks the Zenodo
 * records in assets/manifest.<zenodo host>.json. A one-time copy: exercises
 * already published on Zenodo are skipped. Safe to stop and rerun at any time.
 *
 * Usage (in the assets container or package, see assets/README.md):
 *   pnpm mirror:supabase-to-zenodo --env .env.sandbox.zenodo.org --dry-run
 *   pnpm mirror:supabase-to-zenodo --env .env.sandbox.zenodo.org --limit 3
 *   pnpm mirror:supabase-to-zenodo --env .env.zenodo.org --yes
 *
 * Options:
 *   --env <path>         Env file to load, relative to assets/ (default .env)
 *   --dry-run            Only print what would happen; no downloads, no Zenodo calls
 *   --limit <n>          Handle at most n exercises that are not published yet
 *   --only <id,id,...>   Handle only these exercise ids
 *   --yes                Required to write to a Zenodo instance that is not a sandbox
 *
 * Environment:
 *   SUPABASE_URL      Project whose buckets are copied. No key: the script
 *                     reads only the public bucket URLs.
 *   ZENODO_URL        Zenodo instance, https://sandbox.zenodo.org or https://zenodo.org
 *   ZENODO_TOKEN      Personal access token of that Zenodo instance
 *                     (scopes deposit:write, deposit:actions)
 *   ZENODO_COMMUNITY  Optional Zenodo community slug, e.g. sports-athletic
 * Variables already set in the shell win over the env file.
 */
import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  buildMetadata,
  parseExercises,
  PICTURE_BUCKET,
  VIDEO_BUCKET,
  type Exercise,
  type MirrorConfig,
} from "./lib/exercises.ts";
import { createHttpClient, type HttpClient } from "./lib/http.ts";
import {
  loadManifest,
  manifestPath,
  saveManifest,
  type Manifest,
} from "./lib/manifest.ts";
import {
  downloadFile,
  publicUrl,
  type DownloadedFile,
} from "./lib/supabase.ts";
import {
  createZenodoClient,
  isSandbox,
  normalizeChecksum,
  parseZenodoUrl,
  type ZenodoClient,
} from "./lib/zenodo.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const ASSETS_DIR = join(ROOT, "assets");
const EXERCISES_JSON = join(
  ROOT,
  "athlete-mobile/assets/data/generator/Exercises.json",
);

/** About 80 requests per minute and 4,800 per hour, below Zenodo's limits. */
const ZENODO_MIN_INTERVAL_MS = 750;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is not set`);
  return value;
}

function parseCli() {
  const { values } = parseArgs({
    options: {
      env: { type: "string" },
      "dry-run": { type: "boolean", default: false },
      limit: { type: "string" },
      only: { type: "string" },
      yes: { type: "boolean", default: false },
    },
  });
  const limit = values.limit === undefined ? Infinity : Number(values.limit);
  if (!(limit > 0)) throw new Error("--limit must be a positive number");
  return {
    envFile: values.env,
    dryRun: values["dry-run"],
    limit,
    only: values.only ? new Set(values.only.split(",")) : undefined,
    yes: values.yes,
  };
}

type Context = {
  zenodo: ZenodoClient;
  manifest: Manifest;
  save: () => void;
  config: MirrorConfig;
  communityId?: string;
  download: (
    bucket: string,
    name: string,
  ) => Promise<DownloadedFile | undefined>;
  log: (message: string) => void;
};

/**
 * Publishes one exercise on Zenodo. Every step is safe to repeat: the
 * manifest is saved right after creating the Zenodo draft record, files
 * already in it with the right MD5 are not uploaded again, and a Zenodo
 * draft record that a stopped run already published is only recorded.
 */
async function mirrorExercise(
  ctx: Context,
  exercise: Exercise,
): Promise<string> {
  const video = await ctx.download(VIDEO_BUCKET, exercise.video);
  if (!video) return `video ${exercise.video} not in Supabase, skipped`;
  const files = [video];
  if (exercise.picture) {
    const picture = await ctx.download(PICTURE_BUCKET, exercise.picture);
    if (picture) files.push(picture);
    else ctx.log(`picture ${exercise.picture} not in Supabase, video only`);
  }

  let entry = ctx.manifest.exercises[exercise.id];
  if (!entry) {
    const created = await ctx.zenodo.create(
      buildMetadata(exercise, ctx.config),
    );
    entry = { depositionId: created.id, state: "draft", files: [] };
    ctx.manifest.exercises[exercise.id] = entry;
    ctx.save();
    ctx.log(`created Zenodo draft record ${created.id}`);
  }

  let record = await ctx.zenodo.get(entry.depositionId);
  if (!record.submitted) {
    const bucketUrl = record.links.bucket;
    if (!bucketUrl)
      throw new Error(`Zenodo draft record ${record.id} has no file bucket`);
    for (const file of files) {
      const remote = record.files?.find((f) => f.filename === file.name);
      if (remote && normalizeChecksum(remote.checksum) === file.md5) continue;
      const uploaded = await ctx.zenodo.uploadFile(
        bucketUrl,
        file.name,
        file.path,
      );
      if (normalizeChecksum(uploaded.checksum) !== file.md5) {
        throw new Error(`Checksum mismatch after uploading ${file.name}`);
      }
      ctx.log(`uploaded ${file.name} (${(file.size / 1e6).toFixed(1)} MB)`);
    }
    record = await ctx.zenodo.publish(record.id, ctx.communityId);
  }

  ctx.manifest.exercises[exercise.id] = {
    depositionId: record.id,
    state: "published",
    conceptRecId: record.conceptrecid,
    doi: record.doi,
    conceptDoi: record.conceptdoi,
    recordUrl: record.links.record_html ?? record.links.html,
    publishedAt: new Date().toISOString(),
    files: files.map(({ path: _path, ...file }) => file),
  };
  ctx.save();
  return `published on Zenodo: ${record.doi ?? record.id}`;
}

/** Prints what a run would do, checking only that the Supabase files exist. */
async function dryRun(
  http: HttpClient,
  supabaseUrl: string,
  manifest: Manifest,
  pending: Exercise[],
): Promise<void> {
  const exists = (bucket: string, name: string): Promise<boolean> =>
    http.request(publicUrl(supabaseUrl, bucket, name), { method: "HEAD" }).then(
      () => true,
      () => false,
    );
  for (const exercise of pending) {
    const entry = manifest.exercises[exercise.id];
    const missing = [
      !(await exists(VIDEO_BUCKET, exercise.video)) && "video",
      exercise.picture &&
        !(await exists(PICTURE_BUCKET, exercise.picture)) &&
        "picture",
    ].filter(Boolean);
    console.log(
      `exercise ${exercise.id}: ` +
        (entry
          ? `finish Zenodo draft record ${entry.depositionId}`
          : "create Zenodo draft record") +
        (missing.length ? ` (missing in Supabase: ${missing.join(", ")})` : ""),
    );
  }
}

async function main(): Promise<void> {
  const cli = parseCli();
  const envFile = join(ASSETS_DIR, cli.envFile ?? ".env");
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  else if (cli.envFile) throw new Error(`Env file ${envFile} not found`);
  const config = JSON.parse(
    readFileSync(join(ASSETS_DIR, "zenodo.config.json"), "utf8"),
  ) as MirrorConfig;
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const instance = parseZenodoUrl(requireEnv("ZENODO_URL"));
  if (!isSandbox(instance) && !cli.dryRun && !cli.yes) {
    throw new Error(`Writing to ${instance.host} (not a sandbox) needs --yes`);
  }
  console.log(`Supabase: ${supabaseUrl}`);
  console.log(`Zenodo:   ${instance.url}${cli.dryRun ? " (dry run)" : ""}`);

  const path = manifestPath(ASSETS_DIR, instance.host);
  const manifest = loadManifest(path, instance.url);
  const exercises = parseExercises(
    JSON.parse(readFileSync(EXERCISES_JSON, "utf8")),
  ).filter((exercise) => !cli.only || cli.only.has(exercise.id));
  const pending = exercises.filter(
    (exercise) => manifest.exercises[exercise.id]?.state !== "published",
  );
  const jobs = pending.slice(0, cli.limit);
  console.log(
    `${exercises.length} exercises with a video, ` +
      `${exercises.length - pending.length} already published on Zenodo, ` +
      `${pending.length} to do, this run: ${jobs.length}`,
  );

  const downloadHttp = createHttpClient({ minIntervalMs: 0, maxRetries: 4 });
  if (cli.dryRun) return dryRun(downloadHttp, supabaseUrl, manifest, jobs);
  if (jobs.length === 0) return;

  const zenodo = createZenodoClient(
    createHttpClient({
      minIntervalMs: ZENODO_MIN_INTERVAL_MS,
      maxRetries: 5,
      headers: { Authorization: `Bearer ${requireEnv("ZENODO_TOKEN")}` },
    }),
    instance.apiUrl,
  );
  const communitySlug = process.env.ZENODO_COMMUNITY || undefined;
  const communityId = communitySlug
    ? await zenodo.communityId(communitySlug)
    : undefined;
  console.log(`Zenodo community: ${communitySlug ?? "none"}`);

  // Stop at the first error: rerunning resumes, and continuing after an auth
  // or quota error would only repeat it.
  for (const [index, exercise] of jobs.entries()) {
    const prefix = `[${index + 1}/${jobs.length}] exercise ${exercise.id}:`;
    const dir = await mkdtemp(join(tmpdir(), "mirror-supabase-to-zenodo-"));
    try {
      const result = await mirrorExercise(
        {
          zenodo,
          manifest,
          save: () => saveManifest(path, manifest),
          config,
          communityId,
          download: (bucket, name) =>
            downloadFile(downloadHttp, supabaseUrl, bucket, name, dir),
          log: (message) => console.log(`${prefix} ${message}`),
        },
        exercise,
      );
      console.log(`${prefix} ${result}`);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
