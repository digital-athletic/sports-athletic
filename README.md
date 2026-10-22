# Sports Athletic

A fitness training platform consisting of three applications that work together: a backend service, a mobile app for athletes, and a web app for trainers.

## Monorepo Structure

| Project        | Path              | Description                                  |
| -------------- | ----------------- | -------------------------------------------- |
| Supabase       | `supabase/`       | Backend: PostgreSQL database, Edge Functions |
| Athlete Mobile | `athlete-mobile/` | React Native/Expo mobile app for athletes    |
| Trainer Web    | `trainer-web/`    | React/Vite web app for trainers              |

## Getting Started

To run the full application locally, you need to start all three services.

### 1. Supabase (Backend)

**Prerequisites:**

- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) - on macOS via Homebrew:
  ```bash
  brew install supabase/tap/supabase
  ```

  On Linux, use the packages from the [releases page](https://github.com/supabase/cli/releases). See the [Supabase README](supabase/README.md) for details.

**Start the backend:**

Before starting, create `images/`, `videos/`, `tutorial_pictures`, `tutorial_videos`, `exercise_pictures` and `exercise_videos` folders inside `supabase/`. These are mount points for storage buckets.

```bash
# From the repository root
supabase start

# If the vector container fails to start, exclude it
supabase start -x vector
```

To start Edge Functions (optional, for team features):

```bash
supabase functions serve
```

**Stop the backend:**

```bash
supabase stop

# Stop and wipe all database data
supabase stop --no-backup
```

> **Note:** To reach Supabase from a local dev container, use [ngrok](https://ngrok.com/) to expose it via a stable URL. URLs other than `localhost` may be blocked by CORS.

### 2. Athlete Mobile App

**Prerequisites:**

- [Node.js](https://nodejs.org/) v24.22.1. v22 is the technical minimum, 24.22.1 is what CI runs.
- [pnpm](https://pnpm.io/installation)
- [watchman](https://facebook.github.io/watchman/docs/install)

**Start the app:**

Copy `.env.example` to `.env` and fill in the values `supabase start` printed. Not needed for the Docker route below, where compose supplies them.

```bash
cd athlete-mobile
cp .env.example .env
pnpm install
pnpm start
```

The app is available at http://localhost:8081 (web preview, not optimized for web).

To build and run on a simulator:

```bash
# iOS (requires Xcode)
pnpm ios

# Android (requires Android Studio)
pnpm android
```

**Testing the app:**

You can register a new user directly through the app interface at http://localhost:8081. Sign-in uses a one-time code sent by email. Locally, Supabase captures it in Mailpit at http://localhost:54324.

**The Docker Way**
You can also run pnpm completly within the container WITHOUT installing any npm packages on your host.

Two prerequisites. Run `supabase start` first: compose declares its network as external and fails without it. And copy `.env.default` to `.env` in the repository root, filling in the anon key, because compose reads the values from there and passes them into both containers.

```bash
docker compose up -d
docker compose exec athlete-mobile bash

# Inside the container, in the athlete-mobile dir
pnpm i
pnpm run start:docker

# On the host
# => Install Expo Go, see expo.dev/go (download on host)
# Start Simulator
open -a Simulator
# From terminal:
xcrun simctl openurl booted "exp://127.0.0.1:8081"
# See container for choice how to proceed with code signing (login to expo vs. anonymous use)
```

### 3. Trainer Web App

**Prerequisites:**

- [Node.js](https://nodejs.org/) v24.22.1
- [pnpm](https://pnpm.io/installation)

**Start the app:**

Copy `.env.example` to `.env` and fill in the values `supabase start` printed. Not needed for the Docker route either.

```bash
cd trainer-web
cp .env.example .env
pnpm install
pnpm dev
```

The web app runs at http://localhost:5173.

**Testing the app:**

You can register a new user directly through the web interface at http://localhost:5173.

## Project Documentation

Each project has its own README with detailed documentation:

- [Supabase README](supabase/README.md) - Database setup, migrations, Edge Functions
- [Athlete Mobile README](athlete-mobile/README.md) - Mobile app development, native builds
- [Trainer Web README](trainer-web/README.md) - Web app development

## License

Source code is licensed under the Apache License, Version 2.0 (see
[LICENSE](LICENSE)). Images and other media assets are licensed
separately: [ASSETS.md](ASSETS.md) lists copyright, license, and
personality rights for every bundled asset.

Copyright holders, attributions, and further notices are listed in
[NOTICE](NOTICE).