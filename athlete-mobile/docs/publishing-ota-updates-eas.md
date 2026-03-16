# Publishing OTA Updates with EAS

## Overview

This guide covers publishing Over-The-Air (OTA) updates to the Digital Athletic mobile app using Expo Application Services (EAS). OTA updates allow you to quickly push JavaScript bundle updates to existing native builds without requiring app store resubmission.

## What are OTA Updates?

OTA updates enable you to deploy:
- JavaScript code changes
- Assets (images, fonts, etc.)
- Configuration updates

**OTA updates cannot change:**
- Native code
- Native dependencies
- App permissions
- `runtimeVersion` (requires new build)

## Prerequisites

### One-time Setup

Authenticate with EAS CLI using your Expo account:

```bash
pnpm dlx eas-cli@latest login
```

> 💡 You can check whether you are already logged in by running `pnpm dlx eas-cli whoami`.

### Understanding Channels

The project uses three update channels that correspond to build profiles:

| Channel        | Environment  | Target Build Profile | Use Case                          |
| -------------- | ------------ | -------------------- | --------------------------------- |
| `development`  | `preview`    | development          | Development client testing        |
| `preview`      | `preview`    | preview              | TestFlight/Internal Testing (QA)  |
| `production`   | `production` | production           | Production app store releases     |

> ⚠️ **Important:** Devices will only receive updates from the channel they were built with. A build created with `--profile preview` will only receive updates published to the `preview` channel.

## Update Scripts

| Command                 | Channel       | Environment  | Purpose                                  |
| ----------------------- | ------------- | ------------ | ---------------------------------------- |
| `pnpm update:development` | development   | preview      | Update development builds                |
| `pnpm update:preview`     | preview       | preview      | Update TestFlight/internal test builds   |
| `pnpm update:production`  | production    | production   | Update production app store builds       |

## Store Schema Changes in OTA Updates

Store versioning is handled per-store via `src/store/storeVersions.ts` with automatic migrations in `src/store/migrations/`.

**When your OTA update changes a store's persisted data structure:**
1. Increment the store's version in `src/store/storeVersions.ts`
2. Add a migration function in `src/store/migrations/<storeName>Migrations.ts`
3. The migration runs automatically on app launch — no manual bump script needed

## Publishing Updates

### Preview Environment (TestFlight/Internal Testing)

For updating apps distributed via TestFlight or internal testing:

```bash
pnpm update:preview
```

**Workflow:**

1. **Start update** - Run the command above
2. **Review changes** - EAS shows a summary of changed files
3. **Confirm publish** - Confirm to upload the update
4. **Monitor deployment** - The CLI shows upload progress
5. **User reception** - Apps with the preview build profile will check for and download the update on next launch

### Production Environment

For updating the production app in app stores:

```bash
pnpm update:production
```

**Workflow:**

1. **Start update** - Run the command above
2. **Review changes** - EAS shows a summary of changed files
3. **Confirm publish** - Confirm to upload the update
4. **Monitor deployment** - The CLI shows upload progress
5. **User reception** - Production apps will check for and download the update on next launch

### Development Environment

For updating development client builds:

```bash
pnpm update:development
```

This is useful for testing OTA updates on development builds without rebuilding the entire app.

---

## How Updates Are Delivered

The app uses the [OTAService](../src/services/OTAService.tsx) to manage updates:

- **Check frequency:** On app launch and when returning to foreground
- **Download:** Automatic when update is detected
- **Installation:** User is prompted to install (requires app restart)
- **Fallback:** App continues running current version if update fails

### Update Flow

1. App checks for updates on launch via `Updates.checkForUpdateAsync()`
2. If available, update downloads automatically via `Updates.fetchUpdateAsync()`
3. User sees alert: "Update available" with "Install Now" option
4. Selecting "Install Now" reloads the app with new bundle

---

## Runtime Version Compatibility

The app uses `runtimeVersion` policy set to `"appVersion"` in [app.config.ts](../app.config.ts):

```typescript
runtimeVersion: {
  policy: "appVersion",
}
```

**This means:**
- OTA updates must have the same `runtimeVersion` as the installed build
- Updates with different native dependencies require a new build
- The `version` field in app.config.ts determines compatibility

### When You Need a New Build

Publish a new build instead of an OTA update when:

- Adding/removing native dependencies
- Changing native configuration (permissions, plugins, etc.)
- Updating Expo SDK version
- Changing `runtimeVersion` or app `version`
- Modifying native code (iOS/Android folders)

---

## Viewing Update History

To view published updates and their status:

1. Visit the [EAS Dashboard](https://expo.dev/accounts/sports-athletics/projects/digital-athletic/updates)
2. Select the project "digital-athletic"
3. Navigate to "Updates" tab
4. Filter by channel to see specific environment updates

---

## Rollback Procedure

If an OTA update causes issues, you can republish a previous working update:

1. **Find the working update ID** in the EAS dashboard
2. **Republish using EAS CLI:**
   ```bash
   pnpm dlx eas-cli@latest update:republish --channel <channel> --group <update-group-id>
   ```

Alternatively, publish a new update with the fix.

---

## Testing Updates Locally

Before publishing to users, test updates locally:

1. **Create a preview build** with the current version:
   ```bash
   pnpm build:preview
   ```

2. **Install the build** on a physical device or simulator

3. **Make your changes** to JavaScript/assets

4. **Publish to a test channel:**
   ```bash
   pnpm dlx eas-cli@latest update --channel preview-test --environment preview
   ```

5. **Verify the update** is received and works correctly

6. **Publish to production channel** once validated

---

## Best Practices

1. **Test thoroughly** - Always test updates on preview builds before production
2. **Small, incremental updates** - Publish smaller updates more frequently
3. **Monitor rollout** - Watch for errors in your monitoring/logging system
4. **Communication** - For significant changes, notify users about the update
5. **Rollback plan** - Know how to quickly revert if issues arise
6. **Channel discipline** - Keep channel/environment mappings consistent

---

## Common Issues

### Update Not Received

- Verify device has internet connection
- Confirm build profile matches update channel
- Check `runtimeVersion` compatibility
- Force close and reopen the app

### Update Download Fails

- Check bundle size (very large updates may timeout)
- Verify network stability
- Check EAS status page for service issues

### App Crashes After Update

- Check for breaking changes in JavaScript
- Verify all required assets are included
- Review error logs in your monitoring system
- Republish previous working version immediately

---

## Related Documentation

- [Creating Release Builds](./creating-release-build-eas.md)
- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
