# Sports Athletic App

A fitness training application built with React Native, Expo & TypeScript.

## Getting Started

### 🐳 Option 1: Docker (Recommended for Quick Start)
Simplest way to get started with a consistent development environment

**Prerequisites:**
* [Docker](https://www.docker.com/get-started) and Docker Compose

**Steps:**
1. Run `docker compose up` - the development server (Metro) starts automatically
2. Access the server at http://localhost:8081
3. To run commands inside the container: `docker compose exec app sh`
4. Stop with `docker compose down`

If you are running inside the container (e.g. using Dev Containers), you should start with:
1. `pnpm install` to download project dependencies
2. `pnpm start` to start the development server (Metro)

### 💻 Option 2: Local Setup
For more control of individual tool versions or if you prefer developing without Docker.

**Prerequisites:**
- [Node.js](https://nodejs.org/en/download) - v20+
- [pnpm](https://pnpm.io/installation) - for managing third-party node modules
- [watchman](https://facebook.github.io/watchman/docs/install) - file watcher to support development server hot reloads

> 💡 **Pro tip:** Use [asdf](https://asdf-vm.com/) to manage tool versions automatically. Check [.tool-versions](.tool-versions) for required versions.

**Steps:**
1. Run `pnpm install` to download project dependencies
2. Run `pnpm start` to start the development server (Metro)

## Backend (Supabase)

Install and start supabase, using the CLI: https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=linux

Then run `supabase start` from the root folder

## Building a Native Development Client

### What is a development client?
The Expo development server lets you preview changes to TypeScript components immediately on your simulator / device. However, in order to install the app and test, you must first generate, build and run the native iOS/Android projects.

### Android

**Requirements:**
- Azul Zulu JDK 17.58.21 (OpenJDK 17.0.15) - Java Development Kit required to compile Java & Kotlin source files
- [Android Studio](https://developer.android.com/studio) with:
  - Android SDK Platform 35 (`VanillaIceCream`)
  - Android SDK Build-Tools
  - NDK `27.1.12297006`

**Generate, Build & Run:**
```bash
pnpm android
```
This generates the native Android project files, builds the app with gradle and installs the generated build on your emulator.

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
```

## Helpful Resources

- [React Documentation](https://react.dev) - Core React concepts
- [React Native Docs](https://reactnative.dev) - Mobile-specific APIs
- [Expo Documentation](https://docs.expo.dev) - Development and deployment
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type safety
