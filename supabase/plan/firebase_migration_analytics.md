# Firebase Analytics Events Documentation

This document catalogs all analytics events currently tracked via Firebase Analytics in the codebase. This serves as a reference for migrating to an alternative analytics service.

> **Current Implementation:** Events are sent to both Firebase Analytics and Amplitude (see `legacy/logging/Logger.js`). Purchase events are also sent to Facebook SDK.

---

## Table of Contents

1. [Logger Interface](#logger-interface)
2. [Event Categories](#event-categories)
3. [All Events Reference](#all-events-reference)
4. [Migration Recommendations](#migration-recommendations)

---

## Logger Interface

### Source File
`legacy/logging/Logger.js`

### Current Services
| Service | Purpose | SDK |
|---------|---------|-----|
| Firebase Analytics | Event tracking | `react-native-firebase` |
| Amplitude | Event tracking (duplicate) | `react-native-amplitude-analytics` |
| Bugsnag | Error tracking | `bugsnag-react-native` |
| Facebook SDK | Purchase events | `react-native-fbsdk` |

### Methods

#### `Logger.logEvent(eventName: string, params: Object = {})`
Logs a custom event with optional parameters. Respects user's `anonymisedDataUse` setting.

#### `Logger.logPurchase(eventName: string, price: number, params: { type: string, currency: string })`
Logs purchase events to Facebook SDK and Firebase with revenue data.

#### `Logger.logError(error: Error)`
Logs errors to Bugsnag for crash reporting.

---

## Event Categories

| Category | Count | Description |
|----------|-------|-------------|
| [App Lifecycle](#app-lifecycle) | 2 | App open, Firebase connection |
| [Registration & Auth](#registration--auth) | 14 | Sign up, login, social auth |
| [Anamnesis](#anamnesis) | 18 | Questionnaire flow |
| [Training](#training) | 16 | Workout execution |
| [Exercise](#exercise) | 8 | Individual exercise tracking |
| [Video](#video) | 6 | Video playback |
| [Equipment](#equipment) | 5 | Equipment management |
| [Subscription](#subscription) | 6 | Purchase flow |
| [Team](#team) | 5 | Team features (disabled) |
| [Navigation](#navigation) | 4 | Screen views |
| [Storage & Download](#storage--download) | 8 | File operations |
| [Errors](#errors) | 8 | Error tracking |
| **Total** | **100** | |

---

## All Events Reference

### App Lifecycle

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `app_opened` | - | `views/onboarding/Onboarding.js:79` | App launch |
| `firebase connection error` | `e` (error) | `services/FirebaseConnector.js:130` | Firebase connection failed |

---

### Registration & Auth

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `registration_opened` | - | `views/onboarding/Onboarding.js:143` | Registration screen viewed |
| `registration_login_started` | - | `actions/registration/index.js:49,54` | User started login |
| `registration_new_mail_started` | - | `actions/registration/index.js:57` | New registration started |
| `login_completed` | - | `views/onboarding/Onboarding.js:228` | Successful login |
| `login_failed_wrong_password` | - | `views/onboarding/Onboarding.js:249` | Login failed - wrong password |
| `loading_user_data_failed` | - | `views/onboarding/Onboarding.js:236` | Failed to load user data after login |
| `registration_completed` | - | `views/onboarding/Onboarding.js:276` | Registration successful |
| `registration_failed_passwort_empty` | - | `views/onboarding/Onboarding.js:324` | Registration failed - empty password |
| `registration_failed_privacy_not_accepted` | - | `views/onboarding/Onboarding.js:332` | Registration failed - privacy not accepted |
| `registration_failed_...` | - | `views/onboarding/Onboarding.js:314` | Other registration failures |
| `registration_link_to_privacy_opened` | - | `views/onboarding/Onboarding.js:378` | Privacy policy link clicked |
| `registration_link_to_agb_opened` | - | `views/onboarding/Onboarding.js:386` | Terms of service link clicked |
| `registration_agb_accepted` | - | `views/onboarding/Onboarding.js:394` | ToS accepted |
| `registration_agb_accepted_reset` | - | `views/onboarding/Onboarding.js:395` | ToS acceptance toggled off |
| `registration_anonymised_data_use_accepted` | - | `views/onboarding/Onboarding.js:403` | Analytics opt-in accepted |
| `registration_anonymised_data_use_accepted_reset` | - | `views/onboarding/Onboarding.js:404` | Analytics opt-in toggled off |
| `facebook_login_failed` | `e` (error) | `services/AuthService.js:91` | Facebook login failed |
| `google_login_failed` | `e` (error) | `services/AuthService.js:121` | Google login failed |

---

### Anamnesis

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `welcome_screen_opened` | - | `views/data/Welcome.js:38` | Welcome screen viewed |
| `anamnesis_started` | - | `views/data/Sport.js:51` | Anamnesis flow started |
| `anamnesis_sport_completed` | - | `views/data/Sport.js:113` | Sport selection completed |
| `anamnesis_player_data_0_opened` | - | `views/data/Anamnesis.js:71` | First anamnesis screen opened |
| `anamnesis_player_data_completed` | - | `views/data/Anamnesis.js:158` | Player data completed |
| `anamnesis_pains_added` | `{ pains: string[] }` | `views/data/Anamnesis.js:142` | Pain areas selected |
| `anamnesis_tag_added_...` | `{ tagName, tagValue }` | `views/data/Anamnesis.js:151,178,188` | Tag value added |
| `userprofile_opened` | - | `views/data/Userprofile.js:63` | User profile screen opened |
| `anamnesis_userprofile_completed` | - | `views/data/Userprofile.js:131` | User profile completed |
| `anamnesis_season_phase_opened` | - | `views/data/SeasonPhase.js:62` | Season phase screen opened |
| `anamnesis_season_phase_completed` | - | `views/data/SeasonPhase.js:146` | Season phase selected |
| `anamnesis_season_phase_failed_no_phase_selected` | - | `views/data/SeasonPhase.js:184` | No phase selected error |
| `anamnesis_training_days_opened` | - | `views/data/TrainingDays.js:69` | Training days screen opened |
| `anamnesis_training_days_completed` | - | `views/data/TrainingDays.js:153` | Training days completed |
| `anamnesis_training_days_failed_no_day_selected` | - | `views/data/TrainingDays.js:191` | No days selected error |
| `anamnesis_skipped` | `{ screen: string }` | Multiple files | Anamnesis step skipped |
| `anamnesis_create_training_plan_start` | - | `views/data/Generating.js:62`, `app/anamnesis/generating.tsx:143` | Plan generation started |
| `anamnesis_create_training_plan_completed` | - | `views/data/Generating.js:68`, `app/anamnesis/generating.tsx:172` | Plan generation completed |

---

### Training

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `home_opened` | - | `views/home/Home.js:44` | Home screen viewed |
| `section_details_opened` | - | `views/home/Home.js:82` | Training section details opened |
| `test_coaching_opened` | - | `views/training/SelectTraining.js:167`, `app/training/index.tsx:137` | Test coaching screen opened |
| `test_coaching_selected_start` | - | `views/training/SelectTraining.js:228`, `app/training/index.tsx:215` | Test coaching started |
| `test_coaching_selected_skip` | - | `views/training/SelectTraining.js:254`, `app/training/index.tsx:241` | Test coaching skipped |
| `trainingplan_updated_by_equipment_change` | - | `actions/places/index.js:46` | Plan updated after equipment change |
| `save_initial_branch_data` | `{ exerciseId, branchId }` | `views/training/Training.js:246` | Initial branch data saved |
| `training_days_and_plan_trainings_not_matching` | `{ diff }` | `app/training/index.tsx:178` | Training plan mismatch detected |
| `branch_changed_for_new_level` | `{ previousBranchId, newBranchIds }` | `views/training/Training.js:1084` | Branch changed after level up |
| `branch_not_changed_because_only_found_the_same` | `{ branchId }` | `views/training/Training.js:1099` | Branch unchanged - same branch |
| `branch_not_changed_because_no_matching_branch_found` | `{ branchId }` | `views/training/Training.js:1107` | Branch unchanged - no match found |
| `prevention_*` | (varies) | `views/training/Training.js:175` | Prevention workout events |
| `test_repitition_value_saved_*` | `{ value }` | `views/training/Training.js:1420` | Test repetition value saved |
| `workout_data_missing_on_success_screen` | `{ userId }` | `views/training/TrainingSuccess.js:172` | Missing data on success screen |

---

### Exercise

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `exercise_completed` | `{ exerciseId }` | `views/training/Training.js:897` | Exercise finished |
| `exercise_skipped` | `{ exerciseId }` | `views/training/Training.js:1212` | Exercise skipped |
| `exercise_completed_success` | `{ exerciseId }` | `views/training/Training.js:1238` | Feedback: succeeded |
| `exercise_completed_easy` | `{ exerciseId }` | `views/training/Training.js:1242` | Feedback: too easy |
| `exercise_completed_hard` | `{ exerciseId }` | `views/training/Training.js:1246` | Feedback: too hard |
| `exercise_data_in_pair_not_found` | `pair.first` | `src/features/training/generators/TrainingGenerator.ts:2239` | Exercise data missing |

---

### Video

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `video_on_screen` | `{ videoName, exerciseName }` | `components/Video.js:68,91` | Video became visible |
| `video_started` | `{ videoName, exerciseName }` | `components/Video.js:205` | Video playback started |
| `video_watched_for` | `{ videoName, exerciseName, time }` | `components/VideoPlayer.js:80` | Video watch duration |
| `video_watched_to_end` | `{ videoName, exerciseName }` | `components/VideoPlayer.js:85` | Video watched completely |
| `download_video` | `{ path }` | `components/Video.js:235` | Video download started |
| `video_downloaded` | `{ path }` | `components/Video.js:249` | Video download completed |

---

### Equipment

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `equipment_opened` | - | `views/more/pages/Equipment.js:72` | Equipment screen opened |
| `equipment_reset` | `{}` | `views/more/pages/Equipment.js:112`, `app/(tabs)/more/equipment-details.tsx:97` | Equipment reset to defaults |
| `equipment_reset_aborted` | `{}` | `views/more/pages/Equipment.js:121`, `app/(tabs)/more/equipment-details.tsx:104` | Equipment reset cancelled |
| `equipment_activated` | `{ place, equipment, allEquipment }` | `views/more/pages/Equipment.js:176` | Equipment item enabled |
| `equipment_deactivated` | `{ place, equipment, allEquipment }` | `views/more/pages/Equipment.js:170` | Equipment item disabled |
| `equipment_saved` | `{ numOfEquipment }` | `views/more/pages/Equipment.js:190` | Equipment changes saved |

---

### Subscription

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `subscribe_screen_opened` | `{ origin }` | `views/more/pages/Subscribe.js:52` | Subscription screen viewed |
| `purchase_subscription_clicked` | `{ platform, type, daysSinceRegistration, workoutsPerWeek, gender, level, birthday }` | `views/more/pages/Subscribe.js:181` | Purchase button clicked |
| `purchase_subscription_success` | - | `actions/subscription/index.js:68` | Purchase successful |
| `purchase_subscription_invalid` | - | `actions/subscription/index.js:82` | Purchase invalid |
| `purchase_subscription_failed` | `e` (error) | `actions/subscription/index.js:87` | Purchase failed |
| `checking_subscription_failed` | `e` (error) | `actions/subscription/index.js:52` | Subscription check failed |
| `error_checking_subscription` | `{ error }` | `services/PurchaseService.js:35` | Error checking subscription status |

### Purchase Events (Revenue)

| Event Name | Price | Parameters | Source File | Description |
|------------|-------|------------|-------------|-------------|
| `subscribed` | `product.price` | `{ type, currency }` | `actions/subscription/index.js:69` | Purchase completed with revenue |

> **Note:** `logPurchase` sends to Facebook SDK (`AppEventsLogger`) and Firebase Analytics with `value` field for revenue tracking.

---

### Team (Disabled Feature)

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `team_view_opened` | - | `views/team/Team.js:119` | Team view opened |
| `team_ranking_opened` | - | `views/team/pages/TeamRanking.js:40` | Team ranking opened |
| `team_workouts_opened` | - | `views/team/pages/TeamWorkouts.js:42` | Team workouts opened |
| `team_messages_opened` | - | `views/team/pages/TeamMessages.js:45` | Team messages opened |
| `share_team_clicked` | - | `views/team/pages/TeamInvite.js:62` | Share team button clicked |

---

### Storage & Download

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `download_path_can_not_be_checked` | `{ fileName }` | `services/FirebaseStorageService.js:33` | Path check failed |
| `download_failed` | `{ fileName, error }` | `services/FirebaseStorageService.js:59` | Download failed |
| `download_file` | `{ name }` | `services/FirebaseStorageService.js:106` | Download started |
| `file_downloaded` | `{ name }` | `services/FirebaseStorageService.js:119` | Download completed |
| `file unzip failed` | `{ error }` | `services/FirebaseStorageService.js:78` | Unzip failed |
| `zip_error` | `{ fileName, error }` | `services/FirebaseStorageService.js:187` | Zip creation failed |
| `UploadWorkoutDetailsError` | `{ error }` | `services/FirebaseStorageService.js:197` | Workout upload failed |

---

### Errors

| Event Name | Parameters | Source File | Description |
|------------|------------|-------------|-------------|
| `Error saving SeasonPhase` | `{ error }` | `actions/user/index.js:517` | Season phase save failed |
| `Error saving workout` | `{ error }` | `actions/user/index.js:628` | Workout save failed |
| `Workout saving failed` | `e` (error) | `services/WorkoutService.js:128` | Workout save failed |

---

## Event Parameters Reference

### Common Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `exerciseId` | `number` | Exercise identifier | `123` |
| `branchId` | `number` | Skill tree branch ID | `45` |
| `screen` | `string` | Screen name for skip events | `"Sport"`, `"TrainingDays"` |
| `error` | `Error/string` | Error object or message | |
| `videoName` | `string` | Video file name | `"squat_demo.mp4"` |
| `exerciseName` | `string` | Human-readable exercise name | `"Squat"` |

### Subscription Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `platform` | `string` | iOS or Android | `"ios"` |
| `type` | `string` | Package type | `"ANNUAL"`, `"MONTHLY"` |
| `daysSinceRegistration` | `number` | Days since user registered | `30` |
| `workoutsPerWeek` | `string` | Average workouts per week | `"2.50"` |
| `gender` | `string` | User's gender | `"MALE"`, `"FEMALE"` |
| `level` | `string` | User's experience level | `"BEGINNER"`, `"ADVANCED"` |
| `birthday` | `string` | User's birthday | `"15-03-1990"` |
| `currency` | `string` | Currency code | `"EUR"`, `"USD"` |
| `origin` | `string` | Navigation origin | `"Home"`, `"More"` |

---

## Migration Recommendations

### Recommended Analytics Services

| Service | Type | Features | Notes |
|---------|------|----------|-------|
| **Amplitude** | Commercial | Already integrated | Keep as primary |
| **PostHog** | Open-source | Self-hostable, EU data | Good GDPR option |
| **Mixpanel** | Commercial | Strong mobile SDK | Alternative to Amplitude |
| **Google Analytics 4** | Free | Firebase replacement | Google ecosystem |

### Migration Steps

1. **Keep Amplitude** - Already integrated, receives all events
2. **Remove Firebase Analytics** - Delete `firebase.analytics().logEvent()` calls
3. **Update Logger.js** - Remove Firebase dependency
4. **Keep Facebook SDK** - For purchase attribution (if using Facebook Ads)
5. **Keep Bugsnag** - For error tracking (separate from analytics)

### Code Changes Required

```typescript
// Before (legacy/logging/Logger.js)
static logEvent = async (eventName: string, params: Object = {}) => {
  if (await asyncStorageService.getAnonymisedDataUse()) {
    firebase.analytics().logEvent(eventName, params);  // ← Remove
    Logger.amplitude.logEvent(eventName, params);      // ← Keep
  }
};

// After
static logEvent = async (eventName: string, params: Object = {}) => {
  if (await asyncStorageService.getAnonymisedDataUse()) {
    Logger.amplitude.logEvent(eventName, params);
  }
};
```

### New Service Implementation (src/services/Logger.ts)

The stub in `src/services/Logger.ts` should be updated to use Amplitude:

```typescript
import { Amplitude } from '@amplitude/analytics-react-native';
import * as Sentry from '@sentry/react-native'; // or Bugsnag

export class Logger {
  static init = () => {
    Amplitude.init(AMPLITUDE_API_KEY);
  };

  static logEvent = async (eventName: string, params = {}) => {
    if (__DEV__) console.log("Event log: ", eventName, params);
    // Check user consent before tracking
    if (await getUserConsent()) {
      Amplitude.track(eventName, params);
    }
  };

  static logError = async (error: Error) => {
    if (__DEV__) console.log("Error log: ", error);
    Sentry.captureException(error);
  };

  static logPurchase = async (
    eventName: string,
    price: number,
    params: { type: string; currency: string }
  ) => {
    if (__DEV__) console.log("Purchase log: ", eventName, price, params);
    if (await getUserConsent()) {
      Amplitude.track(eventName, {
        ...params,
        value: price,
      });
      // Also track as revenue event
      Amplitude.revenue(new Amplitude.Revenue()
        .setPrice(price)
        .setProductId(params.type)
      );
    }
  };
}
```

---

## Files to Update

| File | Action | Priority |
|------|--------|----------|
| `legacy/logging/Logger.js` | Remove Firebase Analytics | High |
| `src/services/Logger.ts` | Implement with Amplitude | High |
| `package.json` | Remove `react-native-firebase` analytics | Medium |
| All files with `Logger.logEvent` | No changes needed | - |

---

## Event Naming Conventions

### Current Pattern
- Snake_case: `event_name_here`
- Prefixes by feature: `anamnesis_*`, `equipment_*`, `registration_*`
- Action suffixes: `*_opened`, `*_completed`, `*_failed`, `*_clicked`

### Recommendations for New Events
1. Keep snake_case for consistency
2. Use feature prefix: `workout_started`, `exercise_completed`
3. Use past tense for completed actions
4. Include relevant IDs as parameters, not in event name
5. Limit unique event names to ~100-200 for Amplitude free tier

---

## Privacy Considerations

### Current Implementation
- Events only sent if `anonymisedDataUse` setting is `true`
- Setting stored in AsyncStorage
- Toggled during registration

### GDPR Compliance
- User must opt-in to analytics
- Consider adding in-app consent management
- Provide option to delete analytics data
- Document data retention policies

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total unique events | ~100 |
| Events with parameters | ~60 |
| Screen view events | ~15 |
| Error events | ~10 |
| Purchase events | 1 |
| Files with logging | ~25 |
