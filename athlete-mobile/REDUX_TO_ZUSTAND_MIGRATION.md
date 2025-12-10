# Redux to Zustand Migration Plan

This document outlines the migration strategy from the legacy Redux architecture to the new Zustand-based state management system.

---

## Executive Summary

The legacy application uses Redux with `redux-persist` and `redux-thunk` middleware. The state is divided into **24 distinct reducer branches**. For the initial migration, we'll focus on **8 core global state branches** that are dependencies throughout the application. The remaining 16 branches will be migrated to local component state or refactored later as needed.

---

## Current Redux Architecture Overview

### Store Configuration
- **Storage**: `redux-persist-filesystem-storage`
- **State Reconciler**: `autoMergeLevel1`
- **Middleware**: `redux-thunk` for async actions
- **Blacklist**: `firebaseConnector` (not persistable)

### Migration Scope

**Phase 1 - Global State (Priority)**: 8 branches
- States used throughout the application
- Core user data and authentication
- Exercise and training data
- Progress tracking

**Deferred to Local State**: 16 branches
- Form state (registration, login, anamnesis forms)
- Temporary UI state (error messages, sync status)
- Narrow-scope features (team, workoutDetails)
- Service instances (firebaseConnector)

---

## Core Global State Branches (Phase 1 Migration)

These 8 branches are critical dependencies used throughout the application and will be migrated to Zustand stores in Phase 1.

---

### 1. **auth** - Authentication State
**Type**: `AuthType | null`

**Persisted**: ✅ Yes

**Scope**: Global - Used throughout app for auth checks

**TypeScript Definition**:
```typescript
interface AuthState {
  auth: AuthType | null;
  
  // Actions
  setAuth: (auth: AuthType | null) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

interface AuthType {
  userId: string;
  token: string;
  // Remove provider as we're dropping Facebook/Google login
}
```

**Current Actions**:
- `SET_AUTH_DATA` - Sets authentication data

**Usage**: Authentication status, user tokens, protecting routes

**Migration Priority**: 🔴 Critical - Required for app navigation and API calls

**Migration Notes**:
- Remove `provider` field (Facebook/Google login being removed)
- Add `isAuthenticated()` selector for convenience
- Consider splitting refresh token logic if needed

---

### 2. User Stores (Split from `user` branch)

The monolithic Redux `user` branch handled too many concerns. After analyzing 17 action types and component usage patterns, we're splitting it into **3 independent stores** for better separation of concerns.

---

#### 2a. **userProfile** - User Identity & Profile
**Type**: `UserProfileType`

**Persisted**: ✅ Yes

**Scope**: Global - Authentication state, profile data, onboarding status

**TypeScript Definition**:
```typescript
interface UserProfileState {
  userId: string | null;
  personalData: {
    username: string;
    gender: 'MALE' | 'FEMALE';
    birthday: string;              // DD-MM-YYYY format
  };
  isInInitialAnamnesis: boolean;   // Initial onboarding flow state
  anamnesisCompleted: boolean;     // Whether user has completed anamnesis questionnaire
  teamId: string | null;           // Team association
  
  // Actions
  setUserId: (userId: string | null) => void;
  setUsername: (username: string) => void;
  setGender: (gender: 'MALE' | 'FEMALE') => void;
  setBirthday: (birthday: string) => void;
  setPersonalData: (data: Partial<UserPersonalDataType>) => void;
  setIsInInitialAnamnesis: (value: boolean) => void;
  setAnamnesisCompleted: (completed: boolean) => void;
  setTeamId: (teamId: string | null) => void;
  clearProfile: () => void;
  
  // Selectors
  getAge: () => number | null;
}
```

**Current Redux Actions Migrated**:
- `SET_USER_ID` → `setUserId`
- `SET_USER_PERSONAL_DATA` → `setPersonalData`
- `SET_USERNAME` → `setUsername`
- `SET_GENDER` → `setGender`
- `SET_BIRTHDAY` → `setBirthday`
- `SET_IS_IN_INITIAL_ANAMNESIS` → `setIsInInitialAnamnesis`
- `SET_ANAMNESIS_COMPLETED` → `setAnamnesisCompleted`
- `SET_TEAM_ID` → `setTeamId`

**Usage**: Profile views, auth checks, team features, onboarding navigation, anamnesis flow control

**Migration Priority**: 🔴 Critical - Required for authentication and profile display

**Migration Notes**:
- `gender` and `birthday` are personal identity data, belong with profile
- `anamnesisCompleted` controls navigation flow (like `isInInitialAnamnesis`) - it's a profile completion state, not workout config
- Both anamnesis flags work together: `isInInitialAnamnesis` tracks first-time flow, `anamnesisCompleted` tracks questionnaire completion
- `teamId` stays here due to auth/profile connection

---

#### 2b. **userWorkout** - Workout Configuration & Training Plan
**Type**: `UserWorkoutType`

**Persisted**: ✅ Yes

**Scope**: Global - Workout settings and active training plan

**TypeScript Definition**:
```typescript
interface UserWorkoutState {
  workoutData: {
    sport: Sport;
    seasonPhase: SeasonPhaseType;
    equipment: string[];
    maxValues: MaxValuesType;
    tags: string[];               // Exercise tags for personalization
  };
  trainingPlan: TrainingPlanType | null;
  
  // Actions
  setWorkoutData: (data: Partial<UserWorkoutDataType>) => void;
  setSport: (sport: Sport) => void;
  setSeasonPhase: (phase: SeasonPhaseType) => void;
  setTrainingPlan: (plan: TrainingPlanType | null) => void;
  replaceBranchInTrainingPlan: (
    sectionIndex: number,
    weekday: number,
    skillId: string,
    branchIdToReplace: number,
    branchesToFillIn: ExerciseBranchType[]
  ) => void;
  saveMaxValues: (maxValues: MaxValuesType) => void;
}
```

**Current Redux Actions Migrated**:
- `SET_USER_WORKOUT_DATA` → `setWorkoutData`
- `SET_SPORT` → `setSport`
- `SET_USER_SEASON_PHASE` → `setSeasonPhase`
- `SET_USER_TRAINING_PLAN` → `setTrainingPlan`
- `REPLACE_BRANCH_IN_TRAINING_PLAN` → `replaceBranchInTrainingPlan` (complex logic preserved)
- `SAVE_MAX_VALUES` → `saveMaxValues`

**Usage**: 
- Training plan generation (sport, seasonPhase, tags)
- Section details (trainingPlan navigation)
- Max values tracking (power test results)

**Migration Priority**: 🔴 Critical - Required for core training features

**Migration Notes**:
- `workoutData` and `trainingPlan` kept together - tightly coupled in plan generation
- `REPLACE_BRANCH_IN_TRAINING_PLAN` has complex nested manipulation logic (30+ lines) - preserve carefully
- Sport and seasonPhase needed for persona/plan matching
- Gender moved to `userProfile` - it's identity data, though also used for exercise display (11 usages across views)
- `anamnesisCompleted` moved to `userProfile` - it's a profile completion state for navigation control

---

#### 2c. **userSettings** - App Preferences
**Type**: `UserSettingsType`

**Persisted**: ✅ Yes

**Scope**: Global - User preferences and review state

**TypeScript Definition**:
```typescript
interface UserSettingsState {
  reviewStatus: ReviewStatusType;
  anonymisedDataUse: boolean;
  
  // Actions
  setSettings: (settings: Partial<UserSettingsType>) => void;
  setReviewStatus: (status: ReviewStatusType) => void;
  setAnonymisedDataUse: (enabled: boolean) => void;
}

interface ReviewStatusType {
  hasReviewed: boolean;
  lastPromptDate?: string;
  // ... other review fields
}
```

**Current Redux Actions Migrated**:
- `SET_SETTINGS` → `setSettings`
- `SET_REVIEW_STATUS` → `setReviewStatus`

**Usage**: Privacy settings view, app review prompts

**Migration Priority**: 🟡 Medium - Only affects specific views

**Migration Notes**:
- Smallest of the 3 user stores
- Independent from profile and workout data
- Consider adding notification preferences here in future

---

**User Branch Split Summary**:
- **Before**: 1 monolithic `user` reducer with 17 actions
- **After**: 3 focused stores (`userProfile`, `userWorkout`, `userSettings`)
- **Deferred to Local State**: `temporalData` (only used in MuscleSoreness component)
- **Removed Fields**: None - all migrated or moved to local state

---

### 3. **trainingDays** - Weekly Training Schedule
**Type**: `TrainingDayType[]`

**Persisted**: ✅ Yes

**Scope**: Global - Used in workout generation and scheduling features

**TypeScript Definition**:
```typescript
interface TrainingScheduleState {
  trainingDays: TrainingDayType[];
  
  // Actions
  setTrainingDays: (days: TrainingDayType[]) => void;
  toggleDay: (weekday: number) => void;
  setDayLocation: (weekday: number, placeId: string) => void;
  setDayDuration: (weekday: number, duration: string) => void;
  resetToDefaults: () => void;
}

interface TrainingDayType {
  weekday: number; // 0-6 (Monday-Sunday)
  active: boolean;
  place?: string; // Location ID
  duration?: string; // "hh:mm" format
}
```

**Current Actions**:
- `SET_USER_TRAINING_DAYS` - Sets all training days
- `TOGGLE_USER_TRAINING_DAY` - Toggles a day active/inactive
- `SET_USER_TRAINING_DAY_LOCATION` - Sets location
- `SET_USER_TRAINING_DAY_DURATION` - Sets duration
- `SET_DEFAULT_TRAINING_DAYS` - Resets to defaults

**Usage**: Weekly schedule configuration, workout generation input

**Migration Priority**: 🟡 High - Used in training plan generation

**Migration Notes**:
- Rename store to `trainingScheduleStore` for clarity
- Consider merging with `userWorkoutStore` as they're related

---

### 4. **exercises** - Exercise Database
**Type**: `ExerciseType[] | null`

**Persisted**: ✅ Yes

**Scope**: Global - Referenced throughout app for exercise display and selection

**TypeScript Definition**:
```typescript
interface ExercisesState {
  exercises: ExerciseType[] | null;
  
  // Actions
  setExercises: (exercises: ExerciseType[]) => void;
  getExerciseById: (id: number) => ExerciseType | undefined;
  getExercisesBySkill: (skill: SkillType) => ExerciseType[];
}

interface ExerciseType {
  id: number;
  name: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  difficulty: number;
  equipment: string[];
  muscleGroups: string[];
  tags: string[];
  skill: 'PREVENTION' | 'MOBILITY' | 'SWR' | 'WARMUP' | 'STABILITY' | 'CARDIO';
}
```

**Current Actions**:
- `SET_EXERCISES` - Sets entire exercise database

**Usage**: Exercise library, workout generation, exercise details

**Migration Priority**: 🔴 Critical - Core app content

**Migration Notes**:
- Add selector helpers (`getExerciseById`, `getExercisesBySkill`)
- Consider using React Query for API fetching instead of storing in state
- This might be better as a read-only cache with React Query

---

### 5. **skillTrees** - Skill Progression Trees
**Type**: `Record<string, SkillTreeType>`

**Persisted**: ✅ Yes

**Scope**: Global - Used for workout generation and progression tracking

**TypeScript Definition**:
```typescript
interface SkillTreesState {
  skillTrees: Record<string, SkillTreeType>;
  
  // Actions
  setSkillTree: (skillName: string, tree: SkillTreeType) => void;
  getSkillTree: (skillName: string) => SkillTreeType | undefined;
}

interface SkillTreeType {
  name: string;
  branches: ExerciseBranchType[];
  // Skill tree structure for progression
}

interface ExerciseBranchType {
  id: number;
  exercises: number[]; // Exercise IDs
  level: number;
}
```

**Current Actions**:
- `SET_SKILL_TREE` - Sets a skill tree by name

**Usage**: Exercise progression paths, skill development

**Migration Priority**: 🟡 High - Used in workout generation

**Migration Notes**:
- Consider combining with `exercises` store as they're tightly related
- Add selector to get available exercises for current skill level

---

### 6. **progress** - User Progress & XP
**Type**: `UserProgressType`

**Persisted**: ✅ Yes

**Scope**: Global - Gamification system used throughout app

**TypeScript Definition**:
```typescript
interface ProgressState {
  exercises: Record<number, ExerciseProgressType>;
  xp: number;
  level: number;
  testHistory: MaxValuesType[];
  
  // Actions
  setProgress: (progress: UserProgressType) => void;
  updateExerciseProgress: (exerciseId: number, progress: Partial<ExerciseProgressType>) => void;
  addXP: (amount: number) => void;
  setLevel: (level: number) => void;
  addTestResult: (result: MaxValuesType) => void;
}

interface ExerciseProgressType {
  weight?: number;
  duration?: number;
  repetition?: number;
  height?: number;
}
```

**Current Actions**:
- `SET_USER_PROGRESS` - Sets entire progress
- `PROGRESS_UPDATE_USER_TOTALS` - Updates exercise totals
- `PROGRESS_SET_XP` - Sets XP value
- `PROGRESS_SET_LEVEL` - Sets level
- `SAVE_MAX_VALUES_HISTORY` - Saves test history

**Usage**: User progression tracking, gamification, statistics

**Migration Priority**: 🟡 High - Core motivation/engagement feature

**Migration Notes**:
- Consider splitting test history into separate store
- Merge with `exerciseData` as they overlap significantly

---

### 7. **exerciseData** - Exercise Performance Data
**Type**: `ExerciseDataContainerType`

**Persisted**: ✅ Yes

**Scope**: Global - Detailed performance data referenced in multiple features

**TypeScript Definition**:
```typescript
interface ExerciseDataState {
  exerciseData: Record<number, UserExerciseDataType>;
  branchData: Record<number, UserExerciseBranchDataType>;
  
  // Actions
  setExerciseData: (data: Record<number, UserExerciseDataType>) => void;
  updateExercise: (exerciseId: number, data: Partial<UserExerciseDataType>) => void;
  setBranchLevel: (branchId: number, level: number) => void;
}

interface UserExerciseDataType {
  exerciseId: number;
  feedback?: 'EASY' | 'NORMAL' | 'HARD';
  streakCounter?: number;
  weight?: number;
  nextWeightPercentage?: number;
  duration?: number;
  reps?: number;
  height?: number;
  skipped?: boolean;
}

interface UserExerciseBranchDataType {
  branchId: number;
  level: number;
}
```

**Current Actions**:
- `SET_USER_EXERCISE_DATA` - Sets exercise data
- `SET_USER_EXERCISE_BRANCH_DATA` - Sets branch data
- `PROGRESS_UPDATE_EXERCISE_DATA` - Updates performance
- `PROGRESS_UPDATE_USER_BRANCH_DATA` - Updates branch level

**Usage**: Exercise difficulty adaptation, progression tracking

**Migration Priority**: 🟡 High - Critical for workout personalization

**Migration Notes**:
- **Merge with `progress` store** - significant overlap in functionality
- Combine into single `exerciseProgressStore`

---

### 8. **completed** - Completed Workouts History
**Type**: `CompletedDataType`

**Persisted**: ✅ Yes

**Scope**: Global - Historical data used in statistics and progress tracking

**TypeScript Definition**:
```typescript
interface CompletedWorkoutsState {
  workouts: Record<string, CompleteWorkoutType>;
  workoutsList: CompletedWorkoutListEntryType[];
  trainingPlans: TrainingPlanType[];
  
  // Actions
  addCompletedWorkout: (workout: CompleteWorkoutType) => void;
  setCompletedWorkouts: (workouts: Record<string, CompleteWorkoutType>) => void;
  getRecentWorkouts: (limit: number) => CompleteWorkoutType[];
}

interface CompleteWorkoutType {
  id: string;
  timestamp: number;
  exercises: UserExerciseDataType[];
  duration: number;
  xpEarned?: number;
}

interface CompletedWorkoutListEntryType {
  id: string;
  timestamp: number;
  summary: string;
}
```

**Current Actions**:
- `SET_USER_COMPLETED` - Sets all completed data
- `SET_COMPLETED_WORKOUTS` - Sets workouts map
- `SET_COMPLETED_WORKOUTS_LIST` - Sets workouts list
- `SET_LAST_COMPLETED_WORKOUT` - Sets most recent
- `SET_COMPLETED_WORKOUT_LIST_ENTRY` - Adds entry
- `SET_COMPLETED_TRAINING_PLANS` - Sets completed plans

**Usage**: Workout history, statistics, progress visualization

**Migration Priority**: 🟡 High - Important for user engagement and stats

**Migration Notes**:
- Consider pagination/lazy loading for large histories
- Might benefit from React Query for server sync
- Could split into `workoutHistoryStore` and `trainingPlanHistoryStore`

---

## Deferred State Branches

These 16 branches will **NOT** be migrated to Zustand in Phase 1. They should be managed through local component state, context, or refactored.

### Local Component State (Forms & Temporary UI)
1. **registration** - Multi-step form state → Local state with form library (React Hook Form)
2. **login** - Login form inputs → Local state
3. **anamnesis** - Questionnaire form → Local state with form library
4. **seasonPhase** - Temporary anamnesis data → Local state during form flow
5. **error** - Error messages → Error boundary + local state or toast notifications
6. **synchronization** - Sync UI status → Local state or toast notifications

### Narrow Scope Features  
7. **team** - Team features (currently disabled) → Separate feature store when re-enabled
8. **workoutDetails** - Detail view state → Local state or URL params
9. **places** - Location management → Separate feature store or merge with settings
10. **training** - Active training session → Local component state during workout

### Service/Infrastructure
11. **firebaseConnector** - Service instance → Context or service module, not state
12. **filesystem** - File tracking → Should not be in state management

### Test/Experimental
13. **powerTest** - Max value tests → Local state or separate feature store
14. **packages** - IAP packages → Server-side or React Query cache
15. **subscription** - Subscription status → Server-side verification preferred

### To Be Determined
16. **trainingPlan** (part of user) - Move to separate store if needed in future
