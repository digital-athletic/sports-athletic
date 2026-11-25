# Open media assets on Zenodo

The exercise videos and pictures of Sports Athletic are published on
[Zenodo](https://zenodo.org) under CC BY-SA 4.0, one Zenodo record per
exercise, as a public, citable archive.

This folder is the `assets` pnpm workspace package (not to be confused
with the app folder `athlete-mobile/assets/`). It holds the mirror script
that copies the files to Zenodo and the manifest that tracks them.

| File                               | Purpose                                                                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/`                             | The mirror from Supabase Storage to Zenodo (`pnpm mirror:supabase-to-zenodo`).                                                                                            |
| `manifest.zenodo.org.json`         | Which Zenodo record on zenodo.org holds which exercise's files, with DOI, MD5, SHA-256 and the Supabase ETag at upload time. Created by the first run against zenodo.org. |
| `manifest.sandbox.zenodo.org.json` | The same for the Zenodo sandbox (sandbox.zenodo.org). Git-ignored.                                                                                                        |
| `zenodo.config.json`               | Creators, license, language and the description footer for every Zenodo record.                                                                                           |
| `.env.default`                     | Template for one env file per Zenodo instance (`.env.sandbox.zenodo.org`, `.env.zenodo.org`, both git-ignored).                                                           |
| `Dockerfile`                       | Runtime for the script (`node:24.18.0`, like the apps).                                                                                                                   |

## Where the files live: transition from Supabase to Zenodo

Today all exercise videos and pictures live in Supabase Storage, and the
app loads them from there. The move to Zenodo happens in two phases:

1. **Now: Supabase is the source of truth, Zenodo gets a copy.** The mirror
   in this folder _duplicates_ the files from Supabase Storage to Zenodo. It
   only reads from Supabase and never moves, changes or deletes anything
   there. The app keeps loading everything from Supabase.
2. **Later (not built yet): Zenodo becomes the source of truth.** New or
   changed videos are added to Zenodo first. A second mirror in the other
   direction then checks Zenodo for new Zenodo records and copies those
   files into Supabase Storage, from where the app keeps loading them.

Everything below describes phase 1.

## How the mirror works

`pnpm mirror:supabase-to-zenodo` reads the exercises with a video from
`athlete-mobile/assets/data/generator/Exercises.json` and copies each one
that the manifest does not list as published on Zenodo yet. It is a
one-time copy: exercises already published on Zenodo are skipped, even if
their files in Supabase change later.

| Situation                                | Action                                                                                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exercise not in the manifest             | Download video and picture from the Supabase buckets, create a Zenodo draft record (unpublished, visible only to its owner), upload them, publish it on Zenodo |
| Manifest points to a Zenodo draft record | Upload the files still missing in that Zenodo draft record and publish it on Zenodo                                                                            |
| Zenodo record published                  | Nothing                                                                                                                                                        |

The script saves the manifest right after creating a Zenodo draft record
and after publishing it, so you can stop it (Ctrl+C) or let it fail and
simply run it again. Only a stop in the moment between creating a Zenodo
draft record and saving the manifest leaves an empty Zenodo draft record
behind; delete it on the Zenodo website (it is not public). Files in the
Supabase buckets that no exercise references are not copied.

### Zenodo community

A Zenodo community is a collection page on Zenodo that groups Zenodo
records, here `sports-athletic` (in the Zenodo sandbox:
https://sandbox.zenodo.org/communities/sports-athletic; not yet created on
zenodo.org). It has nothing to do with the open source community around
this repo.

If the env file sets `ZENODO_COMMUNITY`, publishing gives the Zenodo
draft record a request to join that Zenodo community, submits the request and accepts it, which publishes the Zenodo
record into the Zenodo community. So the Zenodo token must belong to an
owner or curator of the Zenodo community.

## Running it

The script runs in the `assets` container (`assets/Dockerfile`), which has
the same Node version as the apps (`node:24.18.0`). Node type stripping
runs the TypeScript directly. The service has the `tools` profile, so
`docker compose up` does not start it:

```bash
docker compose build assets
docker compose run --rm assets pnpm install --frozen-lockfile  # once
docker compose run --rm assets pnpm test
docker compose run --rm assets pnpm type-check
docker compose run --rm assets pnpm mirror:supabase-to-zenodo --env .env.sandbox.zenodo.org --dry-run
```

The repo is mounted at `/workspace` and the container starts in
`/workspace/assets`, so the env files and the manifest are read and
written in your working copy. The commands below are shown without the
`docker compose run --rm assets` prefix. A full run takes 2–3 hours; start
it in `tmux` or `screen`, or simply run it again after an interruption.

### Env files

The script needs no Supabase key: it reads file size and ETag with HEAD
requests on the public Supabase bucket URLs and downloads through the same
URLs, like the app. Everything else comes from an env file in this folder
(`--env`, default `.env`); variables already set in the shell win:

| Variable           | Meaning                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `SUPABASE_URL`     | Supabase project whose buckets are copied. Not secret.                                     |
| `ZENODO_URL`       | Zenodo instance to write to: `https://sandbox.zenodo.org` or `https://zenodo.org`.         |
| `ZENODO_TOKEN`     | Personal access token of that Zenodo instance (scopes `deposit:write`, `deposit:actions`). |
| `ZENODO_COMMUNITY` | Optional slug of the Zenodo community, e.g. `sports-athletic`.                             |

Keep one env file per Zenodo instance, named after its host. The Zenodo
URL and its token then always come together, and the manifest is picked
by the same host (`manifest.<host>.json`). Copy the template and fill it
in:

```bash
cp .env.default .env.sandbox.zenodo.org   # Zenodo sandbox
cp .env.default .env.zenodo.org           # Zenodo production
```

Writing to a Zenodo instance that is not a sandbox needs `--yes`.

The container runs as the `node` user, so the files must be readable for
it (`chmod 640` is enough when your user shares its group).

### 1. Zenodo sandbox (sandbox.zenodo.org)

Create an account and a Zenodo token on https://sandbox.zenodo.org
(separate from zenodo.org). Sandbox DOIs are not real and the data is
wiped from time to time.

```bash
pnpm mirror:supabase-to-zenodo --env .env.sandbox.zenodo.org --dry-run    # plan only
pnpm mirror:supabase-to-zenodo --env .env.sandbox.zenodo.org --only 1     # one Zenodo record, check it on the website
pnpm mirror:supabase-to-zenodo --env .env.sandbox.zenodo.org --limit 10   # a few more
```

### 2. Zenodo production (zenodo.org)

Published Zenodo records cannot be deleted, only withdrawn with a public
tombstone page. Start small and check the Zenodo records before running
everything.

```bash
pnpm mirror:supabase-to-zenodo --env .env.zenodo.org --dry-run
pnpm mirror:supabase-to-zenodo --env .env.zenodo.org --yes --limit 5
pnpm mirror:supabase-to-zenodo --env .env.zenodo.org --yes            # the rest, 2–3 hours
```

Commit `manifest.zenodo.org.json` after each run.

## Limits

- Zenodo allows 100 requests per minute and 5,000 per hour; the script
  keeps to about 80 per minute.
- Changes after publishing on Zenodo (new files in Supabase, new exercise
  text) are not copied. Phase 2 handles changes the other way round,
  from Zenodo to Supabase.
