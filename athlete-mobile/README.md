# Sports Athletic App

A fitness training application built with React Native, Expo & TypeScript.

> **Note:** This is part of the Sports Athletic monorepo. For overall project setup and information about other packages (athlete-mobile, supabase), see the [README in the parent directory](../README.md).

## Getting Started

### 🐳 Option 1: Docker (Recommended for Quick Start)

Simplest way to get started with a consistent development environment

**Prerequisites:**

- [Docker](https://www.docker.com/get-started) and Docker Compose

**Steps:**

1. Run `docker compose up` - the development server (Metro) starts automatically
2. Access the server at http://localhost:8081
3. To run commands inside the container: `docker compose exec athlete-mobile sh`
4. Stop with `docker compose down`

If you are running inside the container (e.g. using Dev Containers), you should start with:

1. `pnpm install` to download project dependencies
2. `pnpm start` to start the development server (Metro)

### 💻 Option 2: Local Setup

For more control of individual tool versions or if you prefer developing without Docker.

**Prerequisites:**

- [Node.js](https://nodejs.org/en/download) - v24, see [.tool-versions](.tool-versions). v22 is the technical minimum, 24 is what CI runs.
- [pnpm](https://pnpm.io/installation) - for managing third-party node modules
- [watchman](https://facebook.github.io/watchman/docs/install) - file watcher to support development server hot reloads

> 💡 **Pro tip:** Use [asdf](https://asdf-vm.com/) to manage tool versions automatically. Check [.tool-versions](.tool-versions) for required versions.

**Steps:**

1. Run `cp .env.example .env` and adjust the values (see [Environment Variables](#environment-variables))
2. Run `pnpm install` to download project dependencies
3. Run `pnpm start` to start the development server (Metro)

## Backend (Supabase)

Install and start supabase, using the CLI: https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=linux

Then run `supabase start` from the root folder.
If you want to start the custom functions: `supabase functions serve`

## Building a Native Development Client

### What is a development client?

The Expo development server lets you preview changes to TypeScript components immediately on your simulator / device. However, in order to install the app and test, you must first generate, build and run the native iOS/Android projects.

### Android

**Requirements:**

- JDK 17 - required to compile Java & Kotlin source files. Android Studio ships its own JDK for the IDE; the Gradle build uses the one `JAVA_HOME` points at.
- [Android Studio](https://developer.android.com/studio) with these SDK components:
  - Android SDK Command-line Tools
  - CMake `3.22.1`
- An emulator or device on API 35 or newer, with a system image matching your host architecture. See the [Expo emulator guide](https://docs.expo.dev/workflow/android-studio-emulator/).

Gradle installs the SDK platform, build tools and the NDK itself on the first build, as long as the Command-line Tools are present.

**Environment:**

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin"
```

**Generate, Build & Run:**

```bash
pnpm android
```

This generates the native Android project files, builds the app with gradle and installs the generated build on your emulator.

**Reaching the backend from the emulator:**

Inside the emulator, `localhost` is the emulator itself, not your machine. Forward the two ports so the app finds Metro and Supabase:

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:54321 tcp:54321
```

Both are cleared when the emulator restarts or the adb server is killed. Without them the app still starts, but login and sync fail with errors that point at Supabase rather than at the missing forward.

> **Linux:** the emulator needs KVM. Without it, it falls back to software emulation and is unusably slow, and nothing reports an error. Check with `test -w /dev/kvm`.

### iOS

**Requirements:**

- macOS with [Xcode 26.0+](https://developer.apple.com/documentation/safari-developer-tools/installing-xcode-and-simulators)
- ruby v3.2
- CocoaPods v1.16.2 (iOS dependency manager)

**Generate, Build & Run:**

```bash
pnpm ios
```

This generates the native iOS project files, builds the app with Xcode and installs the generated build on your simulator.

## e2e Tests

```bash
docker compose up -d # start containers including the playwright server
```

Then:

```bash
pnpm run test:e2e
 # When executing directly on the macOS, you cant use localhost to refer to the host. Instead:
TESTING_PLAYWRIGHT_BASE_URL=http://host.docker.internal:8081 pnpm run test:e2e
```

## 🧰 Useful Commands

```bash
# Start development server
pnpm start

# Build iOS development client
pnpm ios

# Build Android development client
pnpm android

# Re-generates the native project files - useful when installing new modules with native dependencies
pnpm clean

# Compile TypeScript files
pnpm type-check

# Run unit tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format-check
pnpm format-fix

# Store versioning is handled by per-store migrations.
# See: src/store/storeVersions.ts and src/store/migrations/
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Only needed for the local setup. Under Docker, compose passes these in from the `.env` in the repository root.

### Required

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL of the Supabase instance. `http://localhost:54321` for local development. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public API key. `supabase start` prints both values. |

The app throws on startup when either is missing.

### Feature Flags

These optional variables control feature flags for launch and store review testing:

| Variable | Purpose | Default |
|----------|---------|---------|
| `EXPO_PUBLIC_SERVER_SYNC_ENABLED` | Set to `"false"` to disable server sync of workouts/strength tests. Login and registration still work. | `true` |
| `EXPO_PUBLIC_REVIEW_EMAIL` | Email address that bypasses OTP verification for app store review (e.g. `reviewer@apple.com`). | Not set (no bypass) |
| `EXPO_PUBLIC_REVIEW_OTP` | OTP code the review user enters on the verification screen. | Not set |

**Example `.env` for store review build:**

```bash
EXPO_PUBLIC_REVIEW_EMAIL=reviewer@example.com
EXPO_PUBLIC_REVIEW_OTP=000000
```

When none of these variables are set, the app behaves normally with full server sync and real authentication.

## Helpful Resources

- [React Documentation](https://react.dev) - Core React concepts
- [React Native Docs](https://reactnative.dev) - Mobile-specific APIs
- [Expo Documentation](https://docs.expo.dev) - Development and deployment
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type safety
- [Creating a Release Build](./docs/creating-release-build-eas.md) - How to build and submit via EAS
- [Publishing OTA updates](./docs/publishing-ota-updates-eas.md) - How to publish and test OTA updates
