# Firebase to Supabase Migration Assessment

This document assesses the feasibility of migrating from Firebase to Supabase based on the services documented in `firebase_migration.md`.

> **References:**
> - [Supabase Features](https://supabase.com/docs/guides/getting-started/features)
> - [Expo Supabase Guide](https://docs.expo.dev/guides/using-supabase/)
> - [Supabase React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native)
> - [Supabase Expo Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

---

## Migration Overview

| Firebase Service | Supabase Equivalent | Migration Feasible |
|------------------|---------------------|-------------------|
| Authentication | Supabase Auth | ✅ Yes |
| Realtime Database | PostgreSQL + Realtime | ✅ Yes |
| Storage | Supabase Storage | ✅ Yes |
| Analytics | ❌ Not available | ⚠️ Need alternative |
| Remote Config | ❌ Not available | N/A (unused - can delete) |

---

## 1. Authentication

### Feasibility: ✅ Full feature parity

### Method Mapping

| Firebase Method | Supabase Equivalent |
|-----------------|---------------------|
| `firebase.auth().createUserWithEmailAndPassword(email, password)` | `supabase.auth.signUp({ email, password })` |
| `firebase.auth().signInWithEmailAndPassword(email, password)` | `supabase.auth.signInWithPassword({ email, password })` |
| `firebase.auth().signOut()` | `supabase.auth.signOut()` |
| `firebase.auth().sendPasswordResetEmail(email)` | `supabase.auth.resetPasswordForEmail(email)` |
| `firebase.auth().currentUser` | `supabase.auth.getUser()` |
| `firebase.auth().currentUser.delete()` | `supabase.auth.admin.deleteUser(userId)` |

### Social Authentication

| Provider | Firebase | Supabase |
|----------|----------|----------|
| Google | `GoogleAuthProvider.credential()` | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Facebook | `FacebookAuthProvider.credential()` | `supabase.auth.signInWithOAuth({ provider: 'facebook' })` |
| Apple | ✅ Supported | ✅ Supported |

### Expo/React Native Setup

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

### Files to Update

| File | Changes Required |
|------|------------------|
| `legacy/services/FirebaseConnector.js` | Replace auth methods (lines 50-80) |
| `legacy/services/AuthService.js` | Replace social auth (lines 75, 108) |
| `src/services/AuthService.ts` | Implement with Supabase SDK |

---

## 2. Database

### Feasibility: ✅ Possible with schema redesign

### Key Difference

- **Firebase RTDB:** NoSQL JSON tree with path-based access
- **Supabase:** PostgreSQL relational database with SQL

### Operation Mapping

| Firebase Operation | Supabase Equivalent |
|--------------------|---------------------|
| `firebase.database().ref(path).once("value")` | `supabase.from('table').select('*').eq('id', id)` |
| `firebase.database().ref(path).set(data)` | `supabase.from('table').upsert(data)` |
| `firebase.database().ref().update(data)` | `supabase.from('table').update(data).eq('id', id)` |
| `firebase.database().ref().push().key` | Auto-generated UUID or `supabase.rpc('generate_id')` |
| `firebase.database().ref().transaction()` | PostgreSQL transactions via `supabase.rpc()` |
| `firebase.database().ref().on("value", handler)` | `supabase.channel('name').on('postgres_changes', handler)` |

### Schema Migration

Firebase paths need conversion to PostgreSQL tables:

**Users Data:**
| Firebase Path | Supabase Table |
|---------------|----------------|
| `Users/{userId}` | `users` |
| `UserPlaces/{userId}` | `user_places` |
| `UserProgress/{userId}` | `user_progress` |
| `UserSettings/{userId}` | `user_settings` |
| `UserWorkoutData/{userId}` | `user_workout_data` |
| `UserTrainingPlan/{userId}` | `user_training_plans` |
| `UserTrainingDays/{userId}` | `user_training_days` |
| `UserExerciseData/{userId}` | `user_exercise_data` |
| `UserExerciseBranchData/{userId}` | `user_exercise_branch_data` |
| `UserCompletedWorkouts/{userId}/{workoutId}` | `user_completed_workouts` |
| `UserSubscription/{userId}` | `user_subscriptions` |

**Shared Data:**
| Firebase Path | Supabase Table |
|---------------|----------------|
| `Anamnesis/Questions` | `anamnesis_questions` |
| `Versions/ExerciseData` | `version_metadata` |
| `Versions/SkillTrees/{skillName}` | `version_metadata` |

**Team Data (disabled feature):**
| Firebase Path | Supabase Table |
|---------------|----------------|
| `Teams/{teamId}` | `teams` |
| `TeamWorkouts/{teamId}/{workoutId}` | `team_workouts` |
| `Messages/{teamId}` | `team_messages` |

### Real-time Listeners

Firebase real-time (currently disabled for team chat) maps to Supabase Realtime:

```typescript
// Firebase (current)
firebase.database()
  .ref("Messages/" + teamId)
  .on("value", handler);

// Supabase (equivalent)
supabase
  .channel('team-messages')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'team_messages', filter: `team_id=eq.${teamId}` },
    handler
  )
  .subscribe();
```

### Files to Update

| File | Changes Required |
|------|------------------|
| `legacy/services/FirebaseConnector.js` | Replace all database methods (lines 104-600) |
| `legacy/services/UserService.js` | Update if interface changes |
| `legacy/services/WorkoutService.js` | Update if interface changes |
| `legacy/services/TeamService.js` | Update if interface changes |

---

## 3. Storage

### Feasibility: ✅ Full feature parity

### Operation Mapping

| Firebase Operation | Supabase Equivalent |
|--------------------|---------------------|
| `firebase.storage().ref().child(path).getDownloadURL()` | `supabase.storage.from('bucket').getPublicUrl(path)` |
| `firebase.storage().ref(path).downloadFile(localPath)` | `supabase.storage.from('bucket').download(path)` |
| `firebase.storage().ref(path).putFile(localPath)` | `supabase.storage.from('bucket').upload(path, file)` |

### Bucket Structure

| Firebase Path | Supabase Bucket | Path |
|---------------|-----------------|------|
| `exerciseData/Exercises.json` | `assets` | `exercise-data/Exercises.json` |
| `skillTrees/{name}.json` | `assets` | `skill-trees/{name}.json` |
| `notificationsData/*.json` | `assets` | `notifications/*.json` |
| `Pictures/*` | `assets` | `pictures/*` |
| `Videos/*` | `assets` | `videos/*` |
| `workoutDetails/{id}.zip` | `user-uploads` | `workout-details/{userId}/{id}.zip` |

### Additional Features

Supabase Storage provides extras not available in Firebase:
- S3 protocol compatibility
- Built-in image transformations
- CDN with smart cache invalidation
- Resumable uploads for large files

### Files to Update

| File | Changes Required |
|------|------------------|
| `legacy/services/FirebaseStorageService.js` | Replace all methods (lines 1-289) |

---

## 4. Analytics

### Feasibility: ⚠️ Requires separate service

Supabase does **not** provide analytics. Alternatives:

| Service | Type | Notes |
|---------|------|-------|
| **Amplitude** | Commercial | Already used in legacy `Logger.js` |
| **PostHog** | Open-source | Self-hostable, privacy-focused |
| **Mixpanel** | Commercial | Strong mobile support |
| **Plausible** | Open-source | Privacy-focused, simpler |

### Recommendation

Keep **Amplitude** (already integrated) and remove Firebase Analytics:

```typescript
// Current Logger.js sends to both Firebase + Amplitude
// After migration: only Amplitude
static logEvent = async (eventName: string, params: Object = {}) => {
  if (await asyncStorageService.getAnonymisedDataUse()) {
    Logger.amplitude.logEvent(eventName, params);
    // Remove: firebase.analytics().logEvent(eventName, params);
  }
};
```

### Files to Update

| File | Changes Required |
|------|------------------|
| `legacy/logging/Logger.js` | Remove Firebase Analytics calls (lines 20, 57) |
| `src/services/Logger.ts` | Implement with Amplitude only |

---

## 5. Remote Config

### Feasibility: N/A (unused code)

Firebase Remote Config is **not used** in the codebase. Supabase doesn't have an equivalent, but it's not needed.

### Action

Delete unused files:
- `legacy/services/RemoteConfigService.js`
- `legacy/constants/FirebaseConstants.js`

---

## Migration Effort Summary

| Service | Effort | Complexity | Notes |
|---------|--------|------------|-------|
| Authentication | Medium | Low | Direct API mapping |
| Database | High | Medium | Requires schema design |
| Storage | Medium | Low | Direct API mapping |
| Analytics | Low | Low | Keep Amplitude, remove Firebase |
| Remote Config | None | None | Delete unused code |

---

## Supabase Advantages

1. **Open Source** - Self-hostable, no vendor lock-in
2. **PostgreSQL** - Powerful queries, joins, indexes
3. **Row Level Security** - Fine-grained access control
4. **TypeScript SDK** - Full type safety with `@supabase/supabase-js`
5. **Expo Support** - Official documentation and tutorials
6. **Pricing** - Generous free tier, predictable scaling costs

---

## Migration Checklist

### Phase 1: Setup
- [ ] Create Supabase project
- [ ] Design PostgreSQL schema from Firebase paths
- [ ] Set up Row Level Security policies
- [ ] Configure authentication providers (Google, Facebook)

### Phase 2: Authentication
- [ ] Install `@supabase/supabase-js`
- [ ] Create Supabase client with AsyncStorage
- [ ] Update `FirebaseConnector.js` auth methods
- [ ] Update `AuthService.js` social auth
- [ ] Implement `src/services/AuthService.ts`
- [ ] Test all auth flows

### Phase 3: Database
- [ ] Create PostgreSQL tables
- [ ] Update `FirebaseConnector.js` CRUD methods
- [ ] Update dependent services
- [ ] Test all data operations

### Phase 4: Storage
- [ ] Create Supabase storage buckets
- [ ] Upload static assets
- [ ] Update `FirebaseStorageService.js`
- [ ] Test downloads and uploads

### Phase 5: Analytics
- [ ] Remove Firebase Analytics from `Logger.js`
- [ ] Keep Amplitude integration
- [ ] Implement `src/services/Logger.ts` with Amplitude

### Phase 6: Cleanup
- [ ] Delete `RemoteConfigService.js` and `FirebaseConstants.js`
- [ ] Remove `react-native-firebase` dependency
- [ ] Remove Firebase config files
- [ ] Update documentation

---

## PostgreSQL Database Schema (Draft v2)

This section provides a relational database structure that maps the existing Firebase Realtime Database paths to PostgreSQL tables. **Updated based on codebase analysis.**

### Design Principles

1. **Normalization** - Split nested JSON structures into separate related tables
2. **Foreign Keys** - Use proper referential integrity with cascading deletes
3. **UUIDs** - Use UUIDs for primary keys (matches Supabase Auth user IDs)
4. **Timestamps** - Include `created_at` and `updated_at` on all tables
5. **Row Level Security** - Design with RLS policies in mind (user owns their data)
6. **Enum Consistency** - Use UPPERCASE values matching existing codebase constants
7. **Snake Case Naming** - PostgreSQL columns use `snake_case`, mapped from JavaScript `camelCase`

### Field Origin Legend

Throughout this schema, fields are marked with their origin:

| Marker | Meaning |
|--------|---------|
| *(from Firebase)* | Direct mapping from existing Firebase field |
| *(renamed)* | Exists in Firebase with different name (old name noted) |
| *(flattened)* | Extracted from nested Firebase object |
| *(new)* | New field added for Supabase/PostgreSQL benefits |
| *(enhanced)* | Exists in Firebase but with expanded functionality |

---

### Enum Types

Define PostgreSQL enum types to match codebase constants:

| Enum Name | Values | Source File | Notes |
|-----------|--------|-------------|-------|
| `season_phase_enum` | `PAUSE`, `PREPATORY`, `COMPETITION` | `legacy/models/SeasonPhase.js` | |
| `exercise_difficulty_enum` | `TOO_HARD`, `TOO_EASY`, `SUCCEEDED` | `WorkoutConstants.js:763` | Nullable in Firebase |
| `place_type_enum` | `HOME`, `OUTSIDE`, `HALL`, `STUDIO` | `legacy/models/Place.js:10` | |
| `difficulty_level_enum` | `BEGINNER`, `ADVANCED`, `PROFESSIONAL` | `WorkoutConstants.js:13-17` | |
| `gender_enum` | `MALE`, `FEMALE` | `legacy/models/UserWorkoutData.js:20` | |
| `sport_enum` | `HANDBALL_SPORT`, `FOOTBALL_SPORT`, `VOLLEYBALL_SPORT`, `BASKETBALL_SPORT`, `ICE_HOCKEY_SPORT`, `HOCKEY_SPORT`, `AMERICAN_FOOTBALL_SPORT`, `RUGBY_SPORT`, `OTHER_SPORT` | `WorkoutConstants.js:1047-1057` | See note below |
| `skill_category_enum` | `PREVENTION`, `MOBILITY`, `SWR`, `WARMUP`, `STABILITY`, `CARDIO` | `legacy/models/CompletedWorkoutListEntry.js:11-26` | |
| `anamnesis_question_type_enum` | `text`, `select`, `selectMultiple`, `switch`, `snap`, `email`, `password`, `date`, `time`, `bodyParts` | `legacy/models/AnamnesisQuestion.js:8-18` | Lowercase values |
| `body_part_type_enum` | `MUSCLE`, `PAIN` | `legacy/models/AnamnesisQuestion.js:23` | |

> **Note on `sport_enum`:** The codebase has two sport representations:
> - `WorkoutConstants.SPORTS` uses constants like `HANDBALL_SPORT` (used in code logic)
> - `UserWorkoutDataType.Sport` uses display names like `"Handball"`, `"Fußball"` (German)
>
> **Recommendation:** Use `WorkoutConstants.SPORTS` values for the enum (consistent with other enums), and store display names in a separate i18n/translation layer.

---

### Core Tables

#### `profiles`

**Maps:** `Users/{userId}`
**Relationship:** Extends Supabase Auth users (1:1)
**Source:** `legacy/models/UserPersonalData.js`, `legacy/models/UserPicture.js`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | - | PK, FK to auth.users | *(new)* - Supabase Auth |
| `username` | TEXT | | | Display name | *(from Firebase)* `Users/{userId}` |
| `email` | TEXT | | | User email | *(from Firebase)* via Auth |
| `picture_url` | TEXT | | | User avatar URL | *(from Firebase)* `UserPictureType` |
| `team_id` | UUID | | | FK to teams | *(from Firebase)* `Users/{userId}/Team` |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

**RLS:** Users can view/update own profile only.

---

#### `user_settings`

**Maps:** `UserSettings/{userId}` including nested `reviewStatus`
**Relationship:** 1:1 with user
**Source:** `legacy/models/UserSettings.js`, `legacy/models/ReviewStatus.js`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users, UNIQUE | *(new)* |
| `anonymised_data_use` | BOOLEAN | | false | Analytics opt-in | *(from Firebase)* `anonymisedDataUse` |
| `notifications_enabled` | BOOLEAN | | true | Push notifications | *(new)* - currently in AsyncStorage |
| `reminder_time` | TIME | | | Daily reminder time | *(new)* - currently in AsyncStorage |
| `reminder_days` | INTEGER[] | | | Weekday numbers (0-6) | *(new)* - currently in AsyncStorage |
| `sound_enabled` | BOOLEAN | | true | | *(new)* - currently in AsyncStorage |
| `vibration_enabled` | BOOLEAN | | true | | *(new)* - currently in AsyncStorage |
| `has_given_review` | BOOLEAN | | false | | *(flattened)* from `reviewStatus.hasGivenReview` |
| `review_date` | BIGINT | | | Unix timestamp (legacy) | *(flattened)* from `reviewStatus.reviewDate` |
| `review_years` | INTEGER | | 0 | | *(flattened)* from `reviewStatus.reviewYears` |
| `review_skips` | INTEGER | | 0 | | *(flattened)* from `reviewStatus.reviewSkips` |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

> **Note:** The current `UserSettingsType` in Firebase only contains `anonymisedDataUse` and `reviewStatus`. Notification settings are stored in AsyncStorage via `PushNotificationService.js`. This schema consolidates all user preferences into one table.

**RLS:** Users can manage own settings only.

---

#### `user_subscriptions`

**Maps:** `UserSubscription/{userId}`
**Relationship:** 1:1 with user
**Source:** `legacy/models/Subscription.js`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users, UNIQUE | *(new)* |
| `package_id` | INTEGER | | | Subscription package | *(from Firebase)* `packageId` |
| `is_subscribed` | BOOLEAN | | false | Active subscription flag | *(from Firebase)* `isSubscribed` |
| `first_registration` | BIGINT | | | Unix timestamp (legacy) | *(from Firebase)* `firstRegistration` |
| `expiration_timestamp` | BIGINT | | | Unix timestamp (legacy) | *(from Firebase)* `expirationTimestamp` |
| `platform` | TEXT | | | 'ios' or 'android' | *(new)* - for IAP validation |
| `product_id` | TEXT | | | App store product ID | *(new)* - for IAP validation |
| `purchase_token` | TEXT | | | App store purchase token | *(new)* - for IAP validation |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

> **Note:** Fields `platform`, `product_id`, and `purchase_token` are new additions for RevenueCat/App Store integration. The current Firebase model only stores `packageId`, `firstRegistration`, `isSubscribed`, and `expirationTimestamp`.

**RLS:** Users can view own subscription only.

---

### Progress & XP Tables

#### `user_progress`

**Maps:** `UserProgress/{userId}` - Core XP and level
**Relationship:** 1:1 with user
**Source:** `legacy/models/UserProgress.js:5-8`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users, UNIQUE | *(new)* |
| `xp` | INTEGER | | 0 | Total experience points | *(from Firebase)* |
| `level` | INTEGER | | 1 | Current level | *(from Firebase)* |
| `rank` | TEXT | | | Optional rank display | *(from Firebase)* |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

---

#### `user_progress_totals`

**Maps:** `UserProgress/{userId}/totals` - Aggregate training statistics
**Relationship:** 1:1 with user
**Source:** `legacy/models/UserProgress.js:9-20`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users, UNIQUE | *(new)* |
| `weight_moved` | DECIMAL(12,2) | | 0 | Total weight lifted (kg) | *(renamed)* `weightMoved` |
| `time_trained` | INTEGER | | 0 | Total training time (seconds) | *(renamed)* `timeTrained` |
| `time_active` | INTEGER | | 0 | Active exercise time | *(renamed)* `timeActive` |
| `time_inactive` | INTEGER | | 0 | Rest time | *(renamed)* `timeInactive` |
| `time_stretched` | INTEGER | | 0 | Stretching time | *(renamed)* `timeStreched` (note: typo in original) |
| `time_mobilised` | INTEGER | | 0 | Mobility work time | *(renamed)* `timeMobilysed` (note: typo in original) |
| `jumps_done` | INTEGER | | 0 | Total jumps | *(renamed)* `jumpsDone` |
| `steps_done` | INTEGER | | 0 | Total steps | *(renamed)* `stepsDone` |
| `exercises_skipped` | INTEGER | | 0 | Skipped exercises count | *(renamed)* `exercisesSkipped` |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

> **Note:** Firebase field names contain typos (`timeStreched`, `timeMobilysed`). The PostgreSQL schema uses corrected spellings (`time_stretched`, `time_mobilised`). Data migration scripts must map the old typo names to new correct names.

---

#### `user_progress_qualities`

**Maps:** `UserProgress/{userId}/qualities` - Quality/skill XP breakdown
**Relationship:** 1:N with user (one row per quality)

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `user_id` | UUID | ✓ | - | FK to auth.users |
| `quality_key` | TEXT | ✓ | - | e.g., 'STRENGTH', 'ENDURANCE' |
| `quality_value` | INTEGER | | 0 | XP in this quality |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |

**Constraints:** UNIQUE(user_id, quality_key)

---

#### `user_progress_exercises`

**Maps:** `UserProgress/{userId}/exercises` - Per-exercise aggregate stats
**Relationship:** 1:N with user (one row per exercise)
**Source:** `legacy/models/UserProgress.js:22-29`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users | *(new)* |
| `exercise_id` | INTEGER | ✓ | - | Exercise identifier | *(from Firebase)* key |
| `total_duration` | INTEGER | | 0 | Seconds | *(renamed)* `duration` |
| `total_height` | DECIMAL(10,2) | | 0 | For jump exercises | *(renamed)* `height` |
| `total_repetitions` | INTEGER | | 0 | | *(renamed)* `repetition` |
| `total_weight` | DECIMAL(12,2) | | 0 | Total weight lifted | *(renamed)* `weight` |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

> **Note:** Field names are prefixed with `total_` to clarify these are aggregate statistics, distinguishing them from the per-workout values in `user_exercise_data`.

**Constraints:** UNIQUE(user_id, exercise_id)

---

#### `user_progress_test_history`

**Maps:** `UserProgress/{userId}/testHistory` - Max value test results
**Relationship:** 1:N with user (one row per test)

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `user_id` | UUID | ✓ | - | FK to auth.users |
| `test_date` | TIMESTAMPTZ | ✓ | - | When test was taken |
| `max_values` | JSONB | ✓ | - | MaxValuesType object |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |

**Indexes:** (user_id, test_date DESC) for chronological queries

---

### Equipment & Places Tables

#### `user_places`

**Maps:** `UserPlaces/{userId}`
**Relationship:** 1:N with user

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `user_id` | UUID | ✓ | - | FK to auth.users |
| `name` | place_type_enum | ✓ | - | HOME, OUTSIDE, HALL, STUDIO |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | |

---

#### `place_equipment`

**Maps:** Equipment lists within `UserPlaces/{userId}`
**Relationship:** N:1 with user_places

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `place_id` | UUID | ✓ | - | FK to user_places (CASCADE) |
| `equipment_id` | TEXT | ✓ | - | e.g., 'DUMBBELL', 'BARBELL', 'KETTLEBELL' |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |

**Constraints:** UNIQUE(place_id, equipment_id)
**RLS:** Inherited from parent (user owns place)

---

### Workout Data Tables

#### `user_workout_data`

**Maps:** `UserWorkoutData/{userId}` - Main workout configuration
**Relationship:** 1:1 with user
**Source:** `legacy/models/UserWorkoutData.js`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users, UNIQUE | *(new)* |
| `gender` | gender_enum | | | MALE or FEMALE | *(from Firebase)* |
| `birthday` | TEXT | | | DD-MM-YYYY format (legacy) | *(from Firebase)* |
| `weight` | DECIMAL(5,2) | | | kg | *(from Firebase)* |
| `height` | DECIMAL(5,2) | | | cm | *(from Firebase)* |
| `sport` | sport_enum | | | User's sport/discipline | *(from Firebase)* - see enum note |
| `season_phase_type` | season_phase_enum | | | PAUSE, PREPATORY, COMPETITION | *(flattened)* from `seasonPhase.type` |
| `season_phase_num_weeks` | INTEGER | | | Weeks in current phase | *(flattened)* from `seasonPhase.numWeeks` |
| `season_phase_end_date` | TEXT | | | DD-MM-YYYY format | *(flattened)* from `seasonPhase.endDate` |
| `anamnesis_completed` | BOOLEAN | | false | Has completed questionnaire | *(renamed)* `anamnesisCompleted` |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

> **Note:** The `seasonPhase` nested object is flattened into three columns. The `tags` array and `maxValues` object are moved to separate tables (`user_workout_tags` and `user_max_values`) for normalization.

---

#### `user_workout_tags`

**Maps:** `UserWorkoutData/{userId}/tags` - Anamnesis tags
**Relationship:** 1:N with user (string array → separate rows)

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `user_id` | UUID | ✓ | - | FK to auth.users |
| `tag` | TEXT | ✓ | - | Individual tag value |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |

**Constraints:** UNIQUE(user_id, tag)

---

#### `user_max_values`

**Maps:** `UserWorkoutData/{userId}/maxValues` - Max strength test values
**Relationship:** 1:1 with user

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `user_id` | UUID | ✓ | - | FK to auth.users, UNIQUE |
| `max_values` | JSONB | ✓ | - | MaxValuesType object (structure varies) |
| `recorded_at` | TIMESTAMPTZ | | NOW() | When values were recorded |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | |

---

### Training Plan Tables

#### `user_training_plans`

**Maps:** `UserTrainingPlan/{userId}`
**Relationship:** 1:N with user

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `user_id` | UUID | ✓ | - | FK to auth.users |
| `is_active` | BOOLEAN | | true | Currently active plan |
| `start_date` | TIMESTAMPTZ | | | When plan started |
| `sections` | JSONB | | | TrainingSectionType[] array |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | |

---

#### `user_training_days`

**Maps:** `UserTrainingDays/{userId}` and `UserWorkoutData/{userId}/TrainingDays`
**Relationship:** N:1 with user_training_plans

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `user_id` | UUID | ✓ | - | FK to auth.users |
| `plan_id` | UUID | | | FK to user_training_plans (CASCADE) |
| `weekday` | INTEGER | ✓ | - | 0-6 (Sunday-Saturday) |
| `active` | BOOLEAN | | true | Is this a training day? |
| `duration` | INTEGER | | | Duration in minutes |
| `place_id` | UUID | | | FK to user_places |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | |

**Constraints:** UNIQUE(user_id, plan_id, weekday), weekday BETWEEN 0 AND 6

---

### Exercise Data Tables

#### `user_exercise_data`

**Maps:** `UserExerciseData/{userId}` - Per-exercise user state and performance
**Relationship:** 1:N with user (one row per exercise)
**Source:** `legacy/models/UserExerciseData.js`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users | *(new)* |
| `exercise_id` | INTEGER | ✓ | - | Exercise identifier | *(from Firebase)* `exerciseId` |
| `repetition` | INTEGER | | | Last/current repetitions | *(from Firebase)* |
| `weight` | DECIMAL(10,2) | | | Last/current weight | *(from Firebase)* |
| `duration` | INTEGER | | | Duration in seconds | *(from Firebase)* |
| `height` | DECIMAL(10,2) | | | For jump exercises | *(from Firebase)* |
| `weight_type` | TEXT | | | Type of weight used | *(renamed)* `weightType` |
| `next_weight_percentage` | DECIMAL(5,2) | | | Suggested next weight increase | *(renamed)* `nextWeightPercentage` |
| `set_active_run` | INTEGER | | | Current set in progress | *(flattened)* from `set[0]` |
| `set_num_of_sets` | INTEGER | | | Total sets configured | *(flattened)* from `set[1]` |
| `skipped` | BOOLEAN | | false | Was exercise skipped | *(from Firebase)* |
| `skill` | TEXT | | | SkillType reference | *(from Firebase)* |
| `branch_id` | TEXT | | | Associated branch | *(renamed)* `branchId` |
| `feedback_difficulty` | exercise_difficulty_enum | | | TOO_HARD, TOO_EASY, SUCCEEDED | *(flattened)* from `feedback.difficulty` |
| `feedback_streak_counter` | INTEGER | | 0 | Consecutive feedback streak | *(flattened)* from `feedback.streakCounter` |
| `max_f_level_adjustment` | exercise_difficulty_enum | | | Max force level adjustment | *(renamed)* `maxFLevelAdjustment` |
| `max_f_repetitions` | JSONB | | | MaxForceRepetitionsDataType[] | *(renamed)* `maxFRepetitions` |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

> **Note:** The Firebase `set` field is an array `[activeRun, numOfSets]`. This is split into two separate columns for better queryability. The `feedback` nested object is flattened into `feedback_*` columns.

**Constraints:** UNIQUE(user_id, exercise_id)

---

#### `user_exercise_branch_data`

**Maps:** `UserExerciseBranchData/{userId}` - Skill tree progression
**Relationship:** 1:N with user
**Source:** `legacy/models/UserExerciseBranchData.js`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users | *(new)* |
| `branch_id` | TEXT | ✓ | - | Branch identifier | *(from Firebase)* `branchId` (was INTEGER) |
| `skill_tree_name` | TEXT | ✓ | - | e.g., 'BAS', 'CARDIO_1_SHORT' | *(new)* - for better querying |
| `current_level` | INTEGER | | 0 | Current level in branch | *(renamed)* `level` |
| `xp_in_branch` | INTEGER | | 0 | XP accumulated in branch | *(new)* - enhanced tracking |
| `is_unlocked` | BOOLEAN | | false | Branch unlocked | *(new)* - enhanced tracking |
| `unlocked_at` | TIMESTAMPTZ | | | When branch was unlocked | *(new)* - enhanced tracking |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

> **⚠️ Schema Enhancement:** The current Firebase model (`UserExerciseBranchDataType`) only contains:
> ```javascript
> { branchId: number, level: number }
> ```
> This schema adds `skill_tree_name`, `xp_in_branch`, `is_unlocked`, and `unlocked_at` for richer progression tracking. These fields will need to be populated during migration (potentially derived from existing data or initialized with defaults).

**Constraints:** UNIQUE(user_id, branch_id, skill_tree_name)

**Known skill trees** (from `WorkoutConstants.SKILL_TREES`): BAS, BR, CARDIO_1_SHORT, CARDIO_1_LAKTAT, CARDIO_2, CARDIO_3, CARDIO_4, CARDIO_5, CD, GKS, GKSKG, MAX, MOB, PLYO, PREV, PREVKG, SA, SASPEZIAL, SK, SKKG, SWR1, SWR1KG, WU, WUSKSA, WUSPEZIAL

---

### Completed Workouts Tables

#### `user_completed_workouts`

**Maps:** `UserCompletedWorkouts/{userId}/{workoutId}` (CompletedWorkoutListEntryType)
**Relationship:** 1:N with user
**Source:** `legacy/models/CompletedWorkoutListEntry.js`

| Column | Type | Required | Default | Description | Origin |
|--------|------|----------|---------|-------------|--------|
| `id` | UUID | ✓ | gen_random_uuid() | PK | *(new)* |
| `user_id` | UUID | ✓ | - | FK to auth.users | *(new)* |
| `workout_id` | TEXT | ✓ | - | Original workout identifier | *(from Firebase)* `workoutId` |
| `workout_date` | BIGINT | ✓ | - | Unix timestamp (legacy) | *(renamed)* `date` |
| `duration` | INTEGER | ✓ | - | Duration in seconds | *(from Firebase)* |
| `exercise_count` | INTEGER | | 0 | Number of exercises | *(renamed)* `exerciseCount` |
| `points` | INTEGER | | 0 | XP earned | *(from Firebase)* |
| `moved_weight` | DECIMAL(12,2) | | 0 | Total weight moved (kg) | *(renamed)* `movedWeight` |
| `exercises` | JSONB | | | UserExerciseDataType[] snapshot | *(new)* - from CompleteWorkoutType |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | | *(new)* |

> **Note:** The `exercises` JSONB column stores a snapshot of exercise data at workout completion. This comes from `CompleteWorkoutType` (uploaded to Storage as zip), not `CompletedWorkoutListEntryType`. The `userSkills` and `userSkillsDuration` objects are normalized into the `completed_workout_skills` table.

**Indexes:** (user_id, workout_date DESC) for chronological queries

---

#### `completed_workout_skills`

**Maps:** `UserCompletedWorkouts/{userId}/{workoutId}/userSkills` and `userSkillsDuration`
**Relationship:** 1:6 with user_completed_workouts (one row per skill category)

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `completed_workout_id` | UUID | ✓ | - | FK to user_completed_workouts (CASCADE) |
| `skill_category` | skill_category_enum | ✓ | - | PREVENTION, MOBILITY, SWR, WARMUP, STABILITY, CARDIO |
| `skill_xp` | INTEGER | | 0 | XP earned in this category |
| `skill_duration` | INTEGER | | 0 | Duration in seconds for this category |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |

**Constraints:** UNIQUE(completed_workout_id, skill_category)
**RLS:** Inherited from parent

---

### Team Tables (Disabled Feature - Low Priority)

#### `teams`

**Maps:** `Teams/{teamId}`

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `name` | TEXT | ✓ | - | Team name |
| `description` | TEXT | | | Team description |
| `short_identifier` | TEXT | | | UNIQUE, maps TeamShortIdentifiers |
| `owner_id` | UUID | ✓ | - | FK to auth.users |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | |

**RLS:** Team members can view, owner can manage

---

#### `team_workouts`

**Maps:** `TeamWorkouts/{teamId}/{workoutId}`

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `team_id` | UUID | ✓ | - | FK to teams (CASCADE) |
| `workout_id` | TEXT | ✓ | - | Workout identifier |
| `name` | TEXT | | | Workout name |
| `description` | TEXT | | | |
| `scheduled_at` | TIMESTAMPTZ | | | Scheduled time |
| `created_by` | UUID | | | FK to auth.users |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | |

---

#### `team_messages`

**Maps:** `Messages/{teamId}` - Real-time messaging

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `team_id` | UUID | ✓ | - | FK to teams (CASCADE) |
| `sender_id` | UUID | ✓ | - | FK to auth.users |
| `message_text` | TEXT | ✓ | - | Message content |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |

**Indexes:** (team_id, created_at DESC) for real-time queries
**RLS:** Team members can view and send

---

### Static/Shared Data Tables

#### `anamnesis_questions`

**Maps:** `Anamnesis/Questions` (AnamnesisQuestionType)

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `question_key` | TEXT | ✓ | - | UNIQUE identifier |
| `title` | JSONB | ✓ | - | Multi-lang: { "en": "...", "de": "..." } |
| `description` | TEXT | | | |
| `placeholder` | JSONB | | | Multi-lang placeholder text |
| `question_type` | anamnesis_question_type_enum | ✓ | - | text, select, selectMultiple, switch, snap, email, password, date, time, bodyParts |
| `tag` | TEXT | | | Associated tag for response |
| `values` | TEXT[] | | | Available values for select types |
| `data_field` | TEXT | | | Field name for storing response |
| `data_type` | TEXT | | | 'single' or 'multiple' |
| `body_part_type` | body_part_type_enum | | | MUSCLE or PAIN for bodyParts type |
| `is_required` | BOOLEAN | | true | |
| `display_order` | INTEGER | | | |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |
| `updated_at` | TIMESTAMPTZ | ✓ | NOW() | |

**RLS:** Public read access

---

#### `version_metadata`

**Maps:** `Versions/ExerciseData`, `Versions/SkillTrees/{skillName}`, `Versions/WorkoutReminderText`

| Column | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | ✓ | gen_random_uuid() | PK |
| `resource_type` | TEXT | ✓ | - | 'exercise_data', 'skill_tree', 'workout_reminder_text' |
| `resource_name` | TEXT | | | For skill trees: the skill name |
| `version` | INTEGER | ✓ | - | Version number |
| `checksum` | TEXT | | | Content checksum |
| `created_at` | TIMESTAMPTZ | ✓ | NOW() | |

**Constraints:** UNIQUE(resource_type, resource_name)
**RLS:** Public read access

---

### Helper Functions (to be implemented)

1. **Auto-update `updated_at`**: Trigger function to automatically set `updated_at` on UPDATE for all tables with that column.

2. **Auto-create profile on signup**: Trigger on `auth.users` INSERT to automatically create:
   - `profiles` row
   - `user_settings` row (with defaults)
   - `user_progress` row (with defaults)
   - `user_progress_totals` row (with defaults)
   - `user_workout_data` row (with defaults)
   - `user_subscriptions` row (with defaults)

---

### Schema Diagram (Entity Relationships)

```
┌──────────────────┐
│   auth.users     │
│   (Supabase)     │
└────────┬─────────┘
         │
         │ 1:1
         ▼
┌──────────────────┐      ┌──────────────────┐
│    profiles      │──────│      teams       │
└────────┬─────────┘      └────────┬─────────┘
         │                         │
    ┌────┴────┬────────────┐      │
    │         │            │      │
    ▼         ▼            ▼      ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐
│settings│ │subscr. │ │ places │ │team_workouts │
└────────┘ └────────┘ └───┬────┘ └──────────────┘
                          │              │
                          ▼              ▼
                   ┌────────────┐ ┌──────────────┐
                   │ equipment  │ │team_messages │
                   └────────────┘ └──────────────┘

┌──────────────────────────────────────────────────────┐
│                User Progress (5 tables)               │
├────────────┬────────────┬───────────┬────────────────┤
│  progress  │   totals   │ qualities │   exercises    │
├────────────┴────────────┴───────────┴────────────────┤
│                    test_history                       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              User Workout Data (3 tables)             │
├──────────────────┬───────────────┬───────────────────┤
│ user_workout_data│ user_max_vals │ user_workout_tags │
│ (gender,birthday,│   (JSONB)     │    (tags[])       │
│  weight,height,  │               │                   │
│  sport,season)   │               │                   │
└──────────────────┴───────────────┴───────────────────┘

┌──────────────────────────────────────────────────────┐
│               Training Plans (2 tables)               │
├──────────────────────────┬───────────────────────────┤
│   user_training_plans    │   user_training_days      │
│   (sections JSONB)       │   (weekday,duration,      │
│                          │    place FK)              │
└──────────────────────────┴───────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              Exercise Tracking (2 tables)             │
├─────────────────────────────┬────────────────────────┤
│     user_exercise_data      │ user_exercise_branch   │
│ (per-exercise state w/      │      _data             │
│  feedback, skill, sets,     │ (skill tree progress)  │
│  max_f_repetitions JSONB)   │                        │
└─────────────────────────────┴────────────────────────┘

┌──────────────────────────────────────────────────────┐
│             Completed Workouts (2 tables)             │
├──────────────────────────┬───────────────────────────┤
│ user_completed_workouts  │ completed_workout_skills  │
│ (exercises JSONB,        │ (6 skill categories:      │
│  moved_weight, points)   │  xp + duration each)      │
└──────────────────────────┴───────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                    Static/Shared                      │
├──────────────────────────┬───────────────────────────┤
│   anamnesis_questions    │    version_metadata       │
│ (multi-lang title/       │                           │
│  placeholder JSONB)      │                           │
└──────────────────────────┴───────────────────────────┘
```

---

### Field Naming Reference (camelCase → snake_case)

This section provides a quick reference for field name mappings from Firebase (JavaScript camelCase) to PostgreSQL (snake_case).

#### Key Renames

| Firebase Field | PostgreSQL Column | Table | Notes |
|----------------|-------------------|-------|-------|
| `anonymisedDataUse` | `anonymised_data_use` | `user_settings` | |
| `hasGivenReview` | `has_given_review` | `user_settings` | Flattened from `reviewStatus` |
| `reviewDate` | `review_date` | `user_settings` | Flattened from `reviewStatus` |
| `reviewYears` | `review_years` | `user_settings` | Flattened from `reviewStatus` |
| `reviewSkips` | `review_skips` | `user_settings` | Flattened from `reviewStatus` |
| `packageId` | `package_id` | `user_subscriptions` | |
| `isSubscribed` | `is_subscribed` | `user_subscriptions` | |
| `firstRegistration` | `first_registration` | `user_subscriptions` | |
| `expirationTimestamp` | `expiration_timestamp` | `user_subscriptions` | |
| `weightMoved` | `weight_moved` | `user_progress_totals` | |
| `timeTrained` | `time_trained` | `user_progress_totals` | |
| `timeActive` | `time_active` | `user_progress_totals` | |
| `timeInactive` | `time_inactive` | `user_progress_totals` | |
| `timeStreched` | `time_stretched` | `user_progress_totals` | **Typo fixed** |
| `timeMobilysed` | `time_mobilised` | `user_progress_totals` | **Typo fixed** |
| `jumpsDone` | `jumps_done` | `user_progress_totals` | |
| `stepsDone` | `steps_done` | `user_progress_totals` | |
| `exercisesSkipped` | `exercises_skipped` | `user_progress_totals` | |
| `exercises[id].duration` | `total_duration` | `user_progress_exercises` | Prefixed with `total_` |
| `exercises[id].height` | `total_height` | `user_progress_exercises` | Prefixed with `total_` |
| `exercises[id].repetition` | `total_repetitions` | `user_progress_exercises` | Prefixed with `total_` |
| `exercises[id].weight` | `total_weight` | `user_progress_exercises` | Prefixed with `total_` |
| `exerciseId` | `exercise_id` | Multiple tables | |
| `weightType` | `weight_type` | `user_exercise_data` | |
| `nextWeightPercentage` | `next_weight_percentage` | `user_exercise_data` | |
| `set[0]` | `set_active_run` | `user_exercise_data` | Array flattened |
| `set[1]` | `set_num_of_sets` | `user_exercise_data` | Array flattened |
| `branchId` | `branch_id` | Multiple tables | |
| `feedback.difficulty` | `feedback_difficulty` | `user_exercise_data` | Object flattened |
| `feedback.streakCounter` | `feedback_streak_counter` | `user_exercise_data` | Object flattened |
| `maxFLevelAdjustment` | `max_f_level_adjustment` | `user_exercise_data` | |
| `maxFRepetitions` | `max_f_repetitions` | `user_exercise_data` | |
| `seasonPhase.type` | `season_phase_type` | `user_workout_data` | Object flattened |
| `seasonPhase.numWeeks` | `season_phase_num_weeks` | `user_workout_data` | Object flattened |
| `seasonPhase.endDate` | `season_phase_end_date` | `user_workout_data` | Object flattened |
| `anamnesisCompleted` | `anamnesis_completed` | `user_workout_data` | |
| `workoutId` | `workout_id` | Multiple tables | |
| `date` | `workout_date` | `user_completed_workouts` | Renamed for clarity |
| `exerciseCount` | `exercise_count` | `user_completed_workouts` | |
| `movedWeight` | `moved_weight` | `user_completed_workouts` | |
| `userSkills` | `completed_workout_skills` | - | Normalized to table |
| `userSkillsDuration` | `completed_workout_skills` | - | Combined with userSkills |

---

### Firebase to Supabase Path Mapping Summary

| Firebase Path | Supabase Table | Notes |
|---------------|----------------|-------|
| `Users/{userId}` | `profiles` | Extends Supabase Auth, includes `username`, `picture_url` |
| `Users/{userId}/Team` | `profiles.team_id` | FK to teams |
| `UserSettings/{userId}` | `user_settings` | Includes `anonymised_data_use` for analytics opt-in |
| `UserSettings/{userId}/reviewStatus` | `user_settings.has_given_review`, `.review_date`, `.review_years`, `.review_skips` | Flattened from nested object |
| `UserSubscription/{userId}` | `user_subscriptions` | `package_id`, `is_subscribed`, timestamps as BIGINT |
| `UserProgress/{userId}` | `user_progress` | Core XP/level only |
| `UserProgress/{userId}/totals` | `user_progress_totals` | 9 aggregate stats (weight, time, jumps, etc.) |
| `UserProgress/{userId}/qualities` | `user_progress_qualities` | Key-value pairs for quality XP |
| `UserProgress/{userId}/exercises` | `user_progress_exercises` | Per-exercise aggregate stats |
| `UserProgress/{userId}/testHistory` | `user_progress_test_history` | Array of max value tests |
| `UserPlaces/{userId}` | `user_places` | Uses `place_type_enum` (HOME, OUTSIDE, HALL, STUDIO) |
| `UserPlaces/{userId}/equipment` | `place_equipment` | Equipment IDs as TEXT |
| `UserWorkoutData/{userId}` | `user_workout_data` | `gender`, `birthday`, `weight`, `height`, `sport`, season phase |
| `UserWorkoutData/{userId}/tags` | `user_workout_tags` | String array → separate rows |
| `UserWorkoutData/{userId}/maxValues` | `user_max_values` | JSONB for MaxValuesType |
| `UserWorkoutData/{userId}/seasonPhase` | `user_workout_data.season_phase_*` | Split into type/weeks/end_date |
| `UserWorkoutData/{userId}/anamnesisCompleted` | `user_workout_data.anamnesis_completed` | Boolean |
| `UserWorkoutData/{userId}/TrainingDays` | `user_training_days` | Merged with UserTrainingDays |
| `UserTrainingPlan/{userId}` | `user_training_plans` | `sections` as JSONB array |
| `UserTrainingDays/{userId}` | `user_training_days` | `weekday`, `active`, `duration`, `place_id` FK |
| `UserExerciseData/{userId}` | `user_exercise_data` | Full state: reps, weight, sets, skill, feedback, max_f_* |
| `UserExerciseData/{userId}/{id}/feedback` | `user_exercise_data.feedback_*` | Embedded in same table |
| `UserExerciseBranchData/{userId}` | `user_exercise_branch_data` | Skill tree progression |
| `UserCompletedWorkouts/{userId}/{id}` | `user_completed_workouts` | `exercises` JSONB, `moved_weight`, `points` |
| `UserCompletedWorkouts/{userId}/{id}/userSkills` | `completed_workout_skills` | 6 categories × (xp + duration) |
| `UserCompletedWorkouts/{userId}/{id}/userSkillsDuration` | `completed_workout_skills` | Combined in same table |
| `Teams/{teamId}` | `teams` | Team info |
| `TeamShortIdentifiers/{code}` | `teams.short_identifier` | UNIQUE constraint |
| `TeamWorkouts/{teamId}/{id}` | `team_workouts` | Team workout schedules |
| `Messages/{teamId}` | `team_messages` | Real-time with Supabase Realtime |
| `Anamnesis/Questions` | `anamnesis_questions` | Multi-lang `title`/`placeholder` as JSONB |
| `Versions/*` | `version_metadata` | Unified version tracking |

---

### Table Count Summary

| Category | Tables | Description |
|----------|--------|-------------|
| Core | 3 | `profiles`, `user_settings`, `user_subscriptions` |
| Progress | 5 | `user_progress`, `_totals`, `_qualities`, `_exercises`, `_test_history` |
| Places | 2 | `user_places`, `place_equipment` |
| Workout Data | 3 | `user_workout_data`, `user_workout_tags`, `user_max_values` |
| Training | 2 | `user_training_plans`, `user_training_days` |
| Exercise | 2 | `user_exercise_data`, `user_exercise_branch_data` |
| Completed | 2 | `user_completed_workouts`, `completed_workout_skills` |
| Teams | 3 | `teams`, `team_workouts`, `team_messages` |
| Static | 2 | `anamnesis_questions`, `version_metadata` |
| **Total** | **24** | |

---

### Schema Enhancements Summary

The following fields/tables are **new additions** not present in the current Firebase structure. These enhance functionality or prepare for future features.

#### New Fields (not in Firebase)

| Table | Column | Purpose | Migration Action |
|-------|--------|---------|------------------|
| `user_settings` | `notifications_enabled` | Push notification toggle | Migrate from AsyncStorage |
| `user_settings` | `reminder_time` | Daily reminder time | Migrate from AsyncStorage |
| `user_settings` | `reminder_days` | Training day reminders | Migrate from AsyncStorage |
| `user_settings` | `sound_enabled` | Sound preference | Migrate from AsyncStorage |
| `user_settings` | `vibration_enabled` | Vibration preference | Migrate from AsyncStorage |
| `user_subscriptions` | `platform` | iOS/Android identifier | Set during migration |
| `user_subscriptions` | `product_id` | App store product ID | Set during migration |
| `user_subscriptions` | `purchase_token` | IAP verification token | Set during migration |
| `user_exercise_branch_data` | `skill_tree_name` | Skill tree reference | Derive from branch context |
| `user_exercise_branch_data` | `xp_in_branch` | Branch XP tracking | Initialize to 0 |
| `user_exercise_branch_data` | `is_unlocked` | Unlock status | Derive from level > 0 |
| `user_exercise_branch_data` | `unlocked_at` | Unlock timestamp | Set to migration date if unlocked |
| `user_completed_workouts` | `exercises` | Exercise snapshot | Migrate from Storage zip files |

#### Typo Corrections

| Firebase Field | Corrected PostgreSQL Column | Table |
|----------------|----------------------------|-------|
| `timeStreched` | `time_stretched` | `user_progress_totals` |
| `timeMobilysed` | `time_mobilised` | `user_progress_totals` |

#### Structural Changes

| Change | Description |
|--------|-------------|
| `reviewStatus` → flattened | Nested object split into 4 columns in `user_settings` |
| `seasonPhase` → flattened | Nested object split into 3 columns in `user_workout_data` |
| `feedback` → flattened | Nested object split into 2 columns in `user_exercise_data` |
| `set[]` → flattened | Array split into 2 columns in `user_exercise_data` |
| `tags[]` → normalized | Array moved to separate `user_workout_tags` table |
| `maxValues` → normalized | Object moved to separate `user_max_values` table |
| `userSkills` + `userSkillsDuration` → normalized | Combined into `completed_workout_skills` table |

---

## Conclusion

**Migration to Supabase is feasible and recommended.**

- ✅ All critical Firebase services have Supabase equivalents
- ✅ Official Expo/React Native support
- ✅ Better querying capabilities with PostgreSQL
- ✅ Complete relational schema designed with RLS policies
- ⚠️ Analytics requires keeping Amplitude (already integrated)
- ⚠️ Database schema redesign needed (JSON → relational) - see schema above

The main effort is in database schema design and data migration. Authentication and Storage are straightforward API replacements.
