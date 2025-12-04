# Firebase Dependency Analysis

## Executive Summary

This codebase has **two distinct Firebase implementations**:
1. **Legacy implementation** (`/workspace/legacy/`) - Fully functional Firebase integration using `react-native-firebase`
2. **New implementation** (`/workspace/src/`) - Currently **mocked** with TODO comments for Firebase migration

The application uses **Firebase Realtime Database** (not Firestore).

---

## Firebase Services Used

| Service | Status | Location |
|---------|--------|----------|
| Authentication | ✅ Active (Legacy) | `legacy/services/FirebaseConnector.js`, `legacy/services/AuthService.js` |
| Realtime Database | ✅ Active (Legacy) | `legacy/services/FirebaseConnector.js` |
| Storage | ✅ Active (Legacy) | `legacy/services/FirebaseStorageService.js` |
| Remote Config | ⚠️ Unused (dead code) | `legacy/services/RemoteConfigService.js` |
| Analytics | ✅ Active (Legacy) | `legacy/logging/Logger.js` |
| Cloud Functions | ❌ Not Used | - |
| Firestore | ❌ Not Used | - |

---

## Authentication Endpoints

### Email/Password Authentication
| Operation | File | Line |
|-----------|------|------|
| Create User | `legacy/services/FirebaseConnector.js` | 50-52 |
| Sign In | `legacy/services/FirebaseConnector.js` | 57-60 |
| Sign Out | `legacy/services/FirebaseConnector.js` | 75 |
| Password Reset | `legacy/services/FirebaseConnector.js` | 71 |
| Delete Account | `legacy/services/FirebaseConnector.js` | 79-80 |

### Social Authentication
| Provider | File | Line |
|----------|------|------|
| Facebook | `legacy/services/AuthService.js` | 75 |
| Google | `legacy/services/AuthService.js` | 108 |
| Credential Sign-In | `legacy/services/FirebaseConnector.js` | 64-66 |

---

## Realtime Database Paths

### User Data Paths
| Path | Purpose | File | Line(s) |
|------|---------|------|---------|
| `Users/{userId}` | Personal user data | `FirebaseConnector.js` | 29, 158, 168 |
| `UserPlaces/{userId}` | Equipment locations | `FirebaseConnector.js` | 27, 519, 527 |
| `UserProgress/{userId}` | XP, levels, history | `FirebaseConnector.js` | 28, 300 |
| `UserSettings/{userId}` | User preferences | `FirebaseConnector.js` | 34, 330, 336, 586 |
| `UserWorkoutData/{userId}` | Workout configuration | `FirebaseConnector.js` | 36, 178, 189, 229, 238, 271, 280, 542, 577 |
| `UserTrainingPlan/{userId}` | Active training plan | `FirebaseConnector.js` | 202, 214 |
| `UserTrainingDays/{userId}` | Training schedule | `FirebaseConnector.js` | 31, 225, 254 |
| `UserExerciseData/{userId}` | Exercise statistics | `FirebaseConnector.js` | 288, 506 |
| `UserExerciseBranchData/{userId}` | Branch progression | `FirebaseConnector.js` | 294 |
| `UserCompletedWorkouts/{userId}/{workoutId}` | Completed workouts | `FirebaseConnector.js` | 310, 318, 324 |
| `UserSubscription/{userId}` | Subscription status | `FirebaseConnector.js` | 562, 570 |

### Nested User Paths
| Path | Purpose | File | Line |
|------|---------|------|------|
| `UserWorkoutData/{userId}/TrainingDays` | Legacy training days | `FirebaseConnector.js` | 229 |
| `UserWorkoutData/{userId}/tags` | Anamnesis tags | `FirebaseConnector.js` | 271 |
| `UserWorkoutData/{userId}/anamnesisCompleted` | Completion status | `FirebaseConnector.js` | 280 |
| `UserWorkoutData/{userId}/maxValues` | Max strength values | `FirebaseConnector.js` | 542 |
| `UserWorkoutData/{userId}/seasonPhase` | Current phase | `FirebaseConnector.js` | 577 |
| `UserSettings/{userId}/reviewStatus` | App review status | `FirebaseConnector.js` | 586 |
| `Users/{userId}/Team` | Team association | `FirebaseConnector.js` | 342 |
| `UserExerciseData/{userId}/{exerciseId}/feedback` | Exercise feedback | `FirebaseConnector.js` | 506 |

### Team & Collaboration Paths
| Path | Purpose | File | Line(s) |
|------|---------|------|---------|
| `Teams/{teamId}` | Team information | `FirebaseConnector.js` | 421 |
| `TeamWorkouts/{teamId}/{workoutId}` | Team workouts | `FirebaseConnector.js` | 353, 360 |
| `TeamShortIdentifiers/{shortIdentifier}` | Short code mapping | `FirebaseConnector.js` | 365, 394 |
| `Messages/{teamId}` | Team messages (real-time) | `FirebaseConnector.js` | 430, 447, 456, 469 |

### Static/Shared Data Paths
| Path | Purpose | File | Line |
|------|---------|------|------|
| `Anamnesis/Questions` | Questionnaire data | `FirebaseConnector.js` | 153 |
| `Versions/ExerciseData` | Exercise versioning | `FirebaseConnector.js` | 477 |
| `Versions/SkillTrees/{skillName}` | Skill tree versioning | `FirebaseConnector.js` | 487 |
| `Versions/WorkoutReminderText` | Reminder versioning | `FirebaseConnector.js` | 594 |

---

## Database Operations

### Read Operations (No RTDB dependency - could use Firestore)
| Method | File | Line |
|--------|------|------|
| `firebase.database().ref(path).once("value")` | `FirebaseConnector.js` | 104-107 |
| `firebase.database().getServerTime()` | `FirebaseConnector.js` | 438 |

### Write Operations (No RTDB dependency - could use Firestore)
| Method | File | Line |
|--------|------|------|
| `firebase.database().ref(path).set(data)` | `FirebaseConnector.js` | 111-114 |
| `firebase.database().ref().update(data)` | `FirebaseConnector.js` | 119-122 |
| `firebase.database().ref(ref).push().key` | `FirebaseConnector.js` | 373-376 |
| `firebase.database().ref(...).transaction(...)` | `FirebaseConnector.js` | 392-401 |

### Real-time Listeners (RTDB-specific - but DEACTIVATED)
| Operation | File | Line | Status |
|-----------|------|------|--------|
| Subscribe (`on("value")`) | `FirebaseConnector.js` | 445-450 | ⚠️ Deactivated |
| Unsubscribe (`off("value")`) | `FirebaseConnector.js` | 454-459 | ⚠️ Deactivated |

> **Note:** Real-time listeners are only used for Team Messages (`Messages/{teamId}`). This feature is currently **disabled** - the TeamStack is commented out in `legacy/App.js:298-299`. All other database operations use `.once("value")` which does not require RTDB.

---

## Storage Paths

### Static Assets (READ-ONLY)
| Path | Purpose | Access | File | Line |
|------|---------|--------|------|------|
| `exerciseData/Exercises.json` | Exercise definitions | ⬇️ Download | `FirebaseStorageService.js` | 217 |
| `exerciseData/Exercises_Staging.json` | Staging exercises | ⬇️ Download | `FirebaseStorageService.js` | 229 |
| `skillTrees/{skillName}.json` | Skill tree definitions | ⬇️ Download | `FirebaseStorageService.js` | 236 |
| `skillTrees/Staging/{skillName}.json` | Staging skill trees | ⬇️ Download | `FirebaseStorageService.js` | 243 |
| `notificationsData/workoutReminderTexts.json` | Reminder texts | ⬇️ Download | `FirebaseStorageService.js` | 282 |
| Pictures (various paths) | Exercise/tutorial images | ⬇️ Download | `FirebaseStorageService.js` | 257-268 |
| Videos (various paths) | Tutorial videos | ⬇️ Download | `FirebaseStorageService.js` | 276-278 |

> **Note:** Static assets are managed externally and only consumed (downloaded) by the app. The app never updates these files.

### User Uploads (WRITE)
| Path | Purpose | Access | File | Line |
|------|---------|--------|------|------|
| `workoutDetails/{workoutId}.zip` | Completed workout data | ⬆️ Upload | `FirebaseStorageService.js` | 158-208 |

> **Note:** This is the only write operation to Storage - uploads user workout completion data as zipped JSON for backup/sync.

### Storage Operations
| Operation | Method | File | Line |
|-----------|--------|------|------|
| Get URL | `firebase.storage().ref().child(refPath).getDownloadURL()` | `FirebaseStorageService.js` | 27-31 |
| Download | `firebase.storage().ref(refPath).downloadFile(path)` | `FirebaseStorageService.js` | 40-57 |
| Upload | `firebase.storage().ref(remotePath).putFile(localPath)` | `FirebaseStorageService.js` | 145-148 |

---

## Remote Config (⚠️ UNUSED)

> **Status:** The service exists but is **never imported or instantiated**. This appears to be abandoned code.

| Parameter | Default | Possible Values | Intended Purpose |
|-----------|---------|-----------------|------------------|
| `OnboardingPicture` | `"picture1.jpg"` | `["picture1.jpg", "picture2.jpg"]` | A/B testing onboarding images |

### Files
| File | Purpose | Lines |
|------|---------|-------|
| `legacy/services/RemoteConfigService.js` | Service class | 23 |
| `legacy/constants/FirebaseConstants.js` | Default values | 11 |

### Remote Config Operations (defined but never called)
| Operation | File | Line |
|-----------|------|------|
| `firebase.config().setDefaults()` | `RemoteConfigService.js` | 8 |
| `firebase.config().fetch()` | `RemoteConfigService.js` | 12 |
| `firebase.config().activateFetched()` | `RemoteConfigService.js` | 14 |
| `firebase.config().getValue()` | `RemoteConfigService.js` | 19 |

> **Conclusion:** Remote Config was set up for A/B testing onboarding pictures but the feature was never completed. No component calls `getRemoteConfig()`. Can be removed.

---

## Analytics

### Status

| Codebase | Status | File |
|----------|--------|------|
| Legacy (`legacy/`) | ✅ Active | `legacy/logging/Logger.js` |
| New (`src/`) | ⚠️ Stub only | `src/services/Logger.ts` (issue #70) |

### Privacy Control

Analytics only fires if user has opted in:
```javascript
if (await asyncStorageService.getAnonymisedDataUse()) {
    firebase.analytics().logEvent(eventName, params);
}
```

### Firebase Analytics Operations

| Method | Operation | File | Line |
|--------|-----------|------|------|
| `logEvent()` | General event tracking | `Logger.js` | 20 |
| `logPurchase()` | Purchase events | `Logger.js` | 57 |

### Usage

~100+ calls across 35+ legacy files tracking:

| Category | Example Events |
|----------|----------------|
| Onboarding | `anamnesis_training_days_opened`, `anamnesis_completed` |
| Training | `exercise_completed`, `exercise_skipped`, `branch_changed_for_new_level` |
| Video | `video_started`, `video_watched_to_end`, `download_video` |
| Purchases | `purchase_subscription_success`, `checking_subscription_failed` |
| Errors | Various via `Logger.logError()` (Bugsnag, not Firebase) |

### New TypeScript Implementation

`src/services/Logger.ts` is a **stub** - only logs to console in dev mode:
- References GitHub issue #70 for full implementation
- No Firebase Analytics integration yet

---

## Files Using Firebase (Summary)

### Direct Firebase Usage
| File | Services Used |
|------|---------------|
| `legacy/firebase.js` | Module export |
| `legacy/services/FirebaseConnector.js` | Auth, Realtime Database |
| `legacy/services/FirebaseStorageService.js` | Storage |
| `legacy/services/RemoteConfigService.js` | Remote Config |
| `legacy/services/AuthService.js` | Auth (Social) |
| `legacy/logging/Logger.js` | Analytics |

### Indirect Firebase Usage (via FirebaseConnector)
| File | Purpose |
|------|---------|
| `legacy/services/UserService.js` | User data management |
| `legacy/services/WorkoutService.js` | Workout operations |
| `legacy/services/ExerciseService.js` | Exercise data |
| `legacy/services/TeamService.js` | Team management |
| `legacy/services/TutorialService.js` | Tutorial content |
| `legacy/services/AnamnesisService.js` | Anamnesis data |
| `legacy/services/PushNotificationService.js` | Notifications |

### Pending Migration (TODO markers)
| File | Line | TODO |
|------|------|------|
| `src/services/AuthService.ts` | 8 | Replace with Firebase Auth |
| `src/services/AuthService.ts` | 16 | Firebase email check |
| `src/services/AuthService.ts` | 30 | Firebase sign in |
| `src/services/AuthService.ts` | 63 | Firebase registration |
| `src/services/AuthService.ts` | 99 | Firebase password reset |
| `src/services/AuthService.ts` | 126 | Firebase sign out |
| `src/store/anamnesisStore.ts` | 299, 306 | Firebase service integration |
| `src/auth/useAuthActions.ts` | 60 | Firebase delete user |
| `app/anamnesis/generating.tsx` | 63, 102 | Firebase persistence |

---

## Key Findings

1. **Database Type**: Uses Firebase Realtime Database (not Firestore)
2. **SDK**: Uses `react-native-firebase` wrapper library
3. **Migration Status**: New TypeScript services have mock implementations with TODO markers for Firebase integration
4. **No Cloud Functions**: All logic is client-side
5. **Real-time Features**: Team messaging uses `on()` listeners - **but feature is disabled**

---

## RTDB vs Firestore Assessment

| Operation Type | RTDB Required? | Notes |
|----------------|----------------|-------|
| Read operations | ❌ No | Uses `.once("value")` - equivalent to Firestore `getDoc()` |
| Write operations | ❌ No | Uses `.set()` / `.update()` - equivalent to Firestore |
| Transactions | ❌ No | Firestore supports transactions |
| Real-time listeners | ✅ Yes | Only for Team Messages - **currently disabled** |

### Team Chat Feature Status

The only RTDB-specific feature (real-time listeners) is used for team messaging, which is **disabled**:
- `legacy/App.js:298-299` - TeamStack commented out with note: "no team functionality right now"
- Code exists in `legacy/views/team/` but is inaccessible in the app
- Not migrated to new TypeScript codebase

**Conclusion:** The current active app has **no dependency on RTDB-specific features**. All operations could be performed with Firestore. If team chat is re-enabled, Firestore's `onSnapshot()` provides equivalent real-time capability.
