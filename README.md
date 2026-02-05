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

- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) - install via Homebrew:
  ```bash
  brew install supabase/tap/supabase
  ```

**Start the backend:**

```bash
# From the repository root
supabase start
```

To start Edge Functions (optional, for team features):

```bash
supabase functions serve
```

### 2. Athlete Mobile App

**Prerequisites:**

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/installation)
- [watchman](https://facebook.github.io/watchman/docs/install)

> **Pro tip:** Use [asdf](https://asdf-vm.com/) to manage tool versions automatically. Check [.tool-versions](.tool-versions) for required versions.

**Start the app:**

```bash
cd athlete-mobile
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

You can register a new user directly through the app interface at http://localhost:8081.

**The Docker Way**
You can also run pnpm completly within the container WITHOUT installing any npm packages on your host:

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

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/installation)

**Start the app:**

```bash
cd trainer-web
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
