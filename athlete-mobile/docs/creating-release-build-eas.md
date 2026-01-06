# Creating a Release Build with EAS

## Overview

This guide covers building and submitting the Digital Athletic mobile app to TestFlight (iOS) and Play Store (Android) using Expo Application Services (EAS).

## Prerequisites

### One-time Setup

Authenticate with EAS CLI using your Expo account:

```bash
pnpm dlx eas-cli@latest login
```

> 💡 You can check whether you are already logged in by running `pnpm dlx eas-cli whoami`.

## Build Scripts

| Command                           | Purpose                                           |
| --------------------------------- | ------------------------------------------------- |
| `pnpm build:device-dev-client`    | Development build for physical device testing     |
| `pnpm build:simulator-dev-client` | Development build for iOS simulator               |
| `pnpm build:preview`              | Preview build for QA testing                      |
| `pnpm build:production`           | Production build for app stores                   |
| `pnpm submit:preview`             | Build and auto-submit preview build to TestFlight |

---

## iOS

### Quick Start

For automated build and submission to TestFlight:

```bash
pnpm submit:preview
```

### Workflow

1. **Start submission** - Run the `submit:preview` command above
2. **Select platform** - Choose `iOS` when prompted
3. **Apple account** - Choose No (`N`), when prompted since the credentials have already been configured in EAS
4. **Monitor build** - The CLI shows real-time build progress
5. **TestFlight submission** - Once the build completes, it automatically submits to TestFlight
6. **Review in TestFlight** - Go to [App Store Connect](https://appstoreconnect.apple.com) to:
   - Review app info
   - Add beta testers
   - Release to external testing groups

---

## Android

### Quick Start

For automated build and submission to Play Store:

```bash
pnpm submit:preview
```

### Workflow

1. **Start submission** - Run the `submit:preview` command above
2. **Select platform** - Choose `Android` when prompted
3. **Monitor build** - The CLI shows real-time build progress
4. **Play Store submission** - Once the build completes, it automatically submits to Play Store
5. **Review in Play Store** - Go to [Play Store Console](https://play.google.com/console) to:
   - Review app info
   - Add test users
