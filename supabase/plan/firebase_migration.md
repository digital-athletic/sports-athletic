# Firebase Migration Guide

This document is structured to assist migration from Firebase to an alternative backend service. Each section covers one Firebase service with all files that need modification.

> **Reference:** See `firebase_usage.md` for detailed endpoint documentation.

---

## Migration Overview

| Service | Priority | Effort | Files to Change |
|---------|----------|--------|-----------------|
| Authentication | High | Medium | 3 files |
| Realtime Database | High | High | 1 core file + 7 dependent services |
| Storage | Medium | Medium | 1 file |
| Analytics | Low | Low | 1 file |
| Remote Config | None | None | Can be deleted (unused) |

---

## 1. Authentication

### Current Implementation
- SDK: `react-native-firebase`
- Providers: Email/Password, Facebook, Google

### Files to Modify

#### Primary File
| File | Lines | Operations |
|------|-------|------------|
| `legacy/services/FirebaseConnector.js` | 50-80 | Core auth methods |

**Methods to replace:**
- `registerWithMail()` → Line 50-52
- `signInWithMail()` → Line 57-60
- `signInWithCredential()` → Line 64-66
- `sendPasswordResetEmail()` → Line 71
- `signOut()` → Line 75
- `currentUser.delete()` → Line 79-80

#### Social Auth File
| File | Lines | Operations |
|------|-------|------------|
| `legacy/services/AuthService.js` | 75, 108 | Social provider credentials |

**Methods to replace:**
- `FacebookAuthProvider.credential()` → Line 75
- `GoogleAuthProvider.credential()` → Line 108

#### New Codebase (Already Stubbed)
| File | Status |
|------|--------|
| `src/services/AuthService.ts` | Mock implementation - ready for new integration |

**TODO markers at lines:** 8, 16, 30, 63, 99, 126

---

## 2. Realtime Database

### Current Implementation
- SDK: `react-native-firebase`
- Type: NoSQL JSON tree (not Firestore)
- Real-time listeners: Only for team messages (disabled feature)

### Files to Modify

#### Core Database File
| File | Lines | Description |
|------|-------|-------------|
| `legacy/services/FirebaseConnector.js` | 104-600 | All database operations |

**Core methods to replace:**
| Method | Line | Operation |
|--------|------|-----------|
| `_getData()` | 104-107 | Read data |
| `_setData()` | 111-114 | Write data |
| `_multiPathUpdate()` | 119-122 | Batch update |
| `generateKey()` | 373-376 | Generate unique ID |
| `transaction()` | 392-401 | Atomic transaction |
| `getServerTime()` | 438 | Server timestamp |
| `setTeamMessagesHandler()` | 445-450 | Real-time listener (disabled) |
| `unsetTeamMessagesHandler()` | 454-459 | Remove listener (disabled) |

#### Dependent Service Files
These files use `FirebaseConnector` - no direct Firebase calls, but may need interface updates:

| File | Purpose |
|------|---------|
| `legacy/services/UserService.js` | User data CRUD |
| `legacy/services/WorkoutService.js` | Workout operations |
| `legacy/services/ExerciseService.js` | Exercise data |
| `legacy/services/TeamService.js` | Team management (disabled feature) |
| `legacy/services/TutorialService.js` | Tutorial content |
| `legacy/services/AnamnesisService.js` | Anamnesis data |
| `legacy/services/PushNotificationService.js` | Notification settings |

#### New Codebase (Pending)
| File | TODO Lines |
|------|------------|
| `src/store/anamnesisStore.ts` | 299, 306 |
| `src/auth/useAuthActions.ts` | 60 |
| `app/anamnesis/generating.tsx` | 63, 102 |

### Database Paths to Migrate

**User Data:**
```
Users/{userId}
UserPlaces/{userId}
UserProgress/{userId}
UserSettings/{userId}
UserWorkoutData/{userId}
UserTrainingPlan/{userId}
UserTrainingDays/{userId}
UserExerciseData/{userId}
UserExerciseBranchData/{userId}
UserCompletedWorkouts/{userId}/{workoutId}
UserSubscription/{userId}
```

**Shared Data:**
```
Anamnesis/Questions
Versions/ExerciseData
Versions/SkillTrees/{skillName}
Versions/WorkoutReminderText
```

**Team Data (disabled feature - low priority):**
```
Teams/{teamId}
TeamWorkouts/{teamId}/{workoutId}
TeamShortIdentifiers/{shortIdentifier}
Messages/{teamId}
```

---

## 3. Storage

### Current Implementation
- SDK: `react-native-firebase`
- Read: Static assets (exercises, skill trees, media)
- Write: User workout data uploads only

### Files to Modify

#### Primary File
| File | Lines | Description |
|------|-------|-------------|
| `legacy/services/FirebaseStorageService.js` | 1-289 | All storage operations |

**Methods to replace:**
| Method | Line | Operation |
|--------|------|-----------|
| `getDownloadURL()` | 27-31 | Check file existence |
| `downloadFile()` | 40-57 | Download file |
| `_uploadFile()` | 145-148 | Upload file |

**Download methods (use `downloadFile` internally):**
| Method | Line | Asset Type |
|--------|------|------------|
| `downloadExerciseList()` | 215-219 | Exercise JSON |
| `downloadStagingExerciseList()` | 227-231 | Staging exercises |
| `downloadSkillTree()` | 234-238 | Skill tree JSON |
| `downloadStagingSkillTree()` | 241-248 | Staging skill trees |
| `downloadPictures()` | 257-268 | Images |
| `downloadVideo()` | 276-278 | Videos |
| `downloadWorkoutReminderText()` | 280-285 | Notification texts |

**Upload method:**
| Method | Line | Purpose |
|--------|------|---------|
| `uploadWorkoutDetails()` | 158-208 | User workout backup |

### Storage Paths to Migrate

**Static Assets (read-only):**
```
exerciseData/Exercises.json
exerciseData/Exercises_Staging.json
skillTrees/{skillName}.json
skillTrees/Staging/{skillName}.json
notificationsData/workoutReminderTexts.json
Pictures/*
Videos/*
```

**User Data (read/write):**
```
workoutDetails/{workoutId}.zip
```

---

## 4. Analytics

### Current Implementation
- SDK: `react-native-firebase`
- Privacy: Only logs if user opted in
- Usage: ~100+ events across 35+ files

### Files to Modify

#### Primary File
| File | Lines | Description |
|------|-------|-------------|
| `legacy/logging/Logger.js` | 1-64 | Analytics wrapper |

**Methods to replace:**
| Method | Line | Firebase Call |
|--------|------|---------------|
| `logEvent()` | 15-26 | `firebase.analytics().logEvent()` at line 20 |
| `logPurchase()` | 43-63 | `firebase.analytics().logEvent()` at line 57 |

> **Note:** `logError()` uses Bugsnag, not Firebase.

#### New Codebase (Stubbed)
| File | Status |
|------|--------|
| `src/services/Logger.ts` | Console-only stub - ready for new integration (issue #70) |

### Event Categories to Preserve
- Onboarding events
- Training/exercise events
- Video playback events
- Purchase events

---

## 5. Remote Config

### Current Implementation
- Status: **UNUSED - Can be deleted**

### Files to Delete
| File | Lines |
|------|-------|
| `legacy/services/RemoteConfigService.js` | 23 |
| `legacy/constants/FirebaseConstants.js` | 11 |

> **Note:** Service is never imported or instantiated. Safe to remove.

---

## Migration Checklist

### Phase 1: Authentication
- [ ] Choose auth provider (Auth0, Supabase, AWS Cognito, etc.)
- [ ] Update `FirebaseConnector.js` auth methods
- [ ] Update `AuthService.js` social auth
- [ ] Implement `src/services/AuthService.ts`
- [ ] Test login/register/logout/password reset flows

### Phase 2: Database
- [ ] Choose database (Supabase, PlanetScale, MongoDB, etc.)
- [ ] Design schema based on existing paths
- [ ] Update `FirebaseConnector.js` CRUD methods
- [ ] Update dependent services if interfaces change
- [ ] Migrate existing user data

### Phase 3: Storage
- [ ] Choose storage provider (S3, Cloudflare R2, Supabase Storage, etc.)
- [ ] Upload static assets to new provider
- [ ] Update `FirebaseStorageService.js` methods
- [ ] Update download URLs/paths
- [ ] Test asset downloads and workout uploads

### Phase 4: Analytics
- [ ] Choose analytics provider (Mixpanel, PostHog, Amplitude, etc.)
- [ ] Update `Logger.js` to use new SDK
- [ ] Implement `src/services/Logger.ts`
- [ ] Verify event tracking works

### Phase 5: Cleanup
- [ ] Remove `RemoteConfigService.js` and `FirebaseConstants.js`
- [ ] Remove `react-native-firebase` dependency
- [ ] Remove Firebase configuration files
- [ ] Update documentation
