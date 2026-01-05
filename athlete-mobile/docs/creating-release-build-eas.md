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

| Command                               | Purpose                                           |
| ------------------------------------- | ------------------------------------------------- |
| `pnpm run build:device-dev-client`    | Development build for physical device testing     |
| `pnpm run build:simulator-dev-client` | Development build for iOS simulator               |
| `pnpm run build:preview`              | Preview build for QA testing                      |
| `pnpm run build:production`           | Production build for app stores                   |
| `pnpm run submit:preview`             | Build and auto-submit preview build to TestFlight |

---

## iOS (Automated Submission)

### Quick Start

For automated build and submission to TestFlight:

```bash
pnpm run submit:preview
```

### Workflow

1. **Start submission** - Run the `submit:preview` command above
2. **Select platform** - Choose `iOS` when prompted
3. **Apple account** - Choose No (`N`), when prompted since the credentials have been setup already in EAS
4. **Monitor build** - The CLI shows real-time build progress
5. **TestFlight submission** - Once iOS build completes, it automatically submits to TestFlight
6. **Review in TestFlight** - Go to [App Store Connect](https://appstoreconnect.apple.com) to:
   - Review app info
   - Add beta testers
   - Release to external testing groups

---

## Android (Manual Submission)

> ⚠️ Play Store submission is currently manual due to missing Google Service Account. See: [#221](https://github.com/sports-athletics/sports-athletic/issues/221)

### Build

1. **Start build** - Run the `build:preview` command
2. **Select platform** - Choose `Android` when prompted
3. **Download artifact** - Once build completes:
   - Download the `.aab` file from [EAS dashboard](https://expo.dev/accounts/digital-athletic/projects/digital-athletic/builds)
   - This is the Android App Bundle for Play Store

![EAS Artifacts Download](./images/eas-android-artifact.png)

### Submit to Play Store

1. **Open Play Console** - Go to [Play Console](https://play.google.com/console)
2. **Upload artifact**
   - Select **Digital-Athletic** developer account
   - Select **Digital Athletic Preview** app
   - Click "Test and release" → "Latest releases and bundles" → "View all app bundles"
   - Click "Upload new version"
   - Select the downloaded `.aab` file for upload

![Play Console Upload Interface](./images/play-console-upload.png)

3. **Fill out release details**
   - Click "Testing" → "Internal testing" → "Create new release"
   - Select "Add from library" to add the uploaded build to the release
   - Provide a release name and release notes
   - Click "Next"
   - Review release metadata
4. **Save & publish** - Click "Save and publish" to publish the preview build
