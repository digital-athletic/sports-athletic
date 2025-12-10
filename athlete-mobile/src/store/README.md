# Zustand Store

This directory contains the Zustand state management setup for the application, following React and React Native best practices.

## Overview

- **Zustand** for state management
- **AsyncStorage** for persistence in React Native
- **TypeScript** for type safety
- Separate stores for different concerns
- Support for both persisted and ephemeral state

## Architecture

```
store/
├── index.ts                      # Public exports
├── createStore.ts                # Store creation utility
├── middleware.ts                 # AsyncStorage adapter
└── trainingSessionStore.ts       # Example: ephemeral store
```

## Usage Examples

### Using a Store in Components

```typescript
import { useTrainingSessionStore } from '@/store';

function TrainingScreen() {
  const { isActive, startSession, endSession } = useTrainingSessionStore();
  
  return (
    <View>
      <Text>Session active: {isActive ? 'Yes' : 'No'}</Text>
      <Button onPress={() => startSession()}>
        Start Session
      </Button>
      <Button onPress={() => endSession()}>
        End Session
      </Button>
    </View>
  );
}
```

### Selecting Specific State (Performance Optimization)

```typescript
// Only re-render when isActive changes
const isActive = useTrainingSessionStore((state) => state.isActive);

// Select multiple values
const { isActive, startTime } = useTrainingSessionStore((state) => ({
  isActive: state.isActive,
  startTime: state.startTime,
}));
```

### Using Selectors for Derived State

```typescript
import { useTrainingSessionStore, trainingSessionSelectors } from '@/store';

function TrainingTimer() {
  const duration = useTrainingSessionStore(
    trainingSessionSelectors.sessionDuration
  );
  
  return <Text>{duration ? `${duration}ms` : 'Not started'}</Text>;
}
```

### Accessing Store Outside Components

```typescript
import { useTrainingSessionStore } from '@/store';

// Get current state
const isActive = useTrainingSessionStore.getState().isActive;

// Update state
useTrainingSessionStore.getState().startSession();

// Subscribe to changes
const unsubscribe = useTrainingSessionStore.subscribe(
  (state) => console.log('State changed:', state)
);

// Later: unsubscribe()
```

## Creating New Stores

### Persisted Store

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorage } from './middleware';

interface MyStoreState {
  // State
  count: number;
  
  // Actions
  increment: () => void;
  decrement: () => void;
}

# Zustand Store

This directory contains the global state management using [Zustand](https://github.com/pmndrs/zustand).

## Architecture Overview

The application uses **9 Zustand stores** to manage global state, replacing the legacy Redux architecture. Each store is focused, composable, and uses React hooks for a modern, performant state management solution.

### Phase 1 Stores (Implemented)

#### Authentication & User
1. **authStore** - User authentication state and tokens
2. **userProfileStore** - User identity, profile data, and onboarding status
3. **userWorkoutStore** - Workout configuration and training plans
4. **userSettingsStore** - App preferences and review state

#### Anamnesis
5. **anamnesisStore** - Anamnesis questionnaire state, answers, and progress tracking

#### Training & Exercises
6. **trainingScheduleStore** - Weekly training schedule management
7. **exercisesStore** - Exercise database with selectors
8. **skillTreesStore** - Skill progression trees

#### Progress & History
9. **exerciseProgressStore** - User progress, XP, and exercise performance data
10. **completedWorkoutsStore** - Workout history and statistics

## Usage Examples

### Basic Store Usage

```tsx
import { useAuthStore } from '@/store';

function LoginButton() {
  const { setAuth, isAuthenticated } = useAuthStore();

  const handleLogin = async () => {
    const auth = await loginAPI();
    setAuth(auth);
  };

  return (
    <Button onPress={handleLogin}>
      {isAuthenticated() ? 'Logged In' : 'Login'}
    </Button>
  );
}
```

### Selecting Specific State

```tsx
import { useUserProfileStore } from '@/store';

function ProfileScreen() {
  // Only subscribe to username changes
  const username = useUserProfileStore((state) => state.personalData.username);
  const setUsername = useUserProfileStore((state) => state.setUsername);

  return <Text>{username}</Text>;
}
```

### Using Selectors

```tsx
import { useExercisesStore } from '@/store';

function PreventionExercises() {
  const getExercisesBySkill = useExercisesStore((state) => state.getExercisesBySkill);
  const preventionExercises = getExercisesBySkill('PREVENTION');

  return (
    <List>
      {preventionExercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </List>
  );
}
```

### Combining Multiple Stores

```tsx
import { 
  useUserWorkoutStore, 
  useTrainingScheduleStore, 
  useExercisesStore 
} from '@/store';

function WorkoutGenerator() {
  const sport = useUserWorkoutStore((state) => state.workoutData.sport);
  const activeDays = useTrainingScheduleStore((state) => state.getActiveTrainingDays());
  const exercises = useExercisesStore((state) => state.exercises);

  // Generate workout based on sport, active days, and available exercises
  const workout = generateWorkout(sport, activeDays, exercises);

  return <WorkoutDisplay workout={workout} />;
}
```

## Store Details

### authStore
Manages authentication state with automatic persistence.
- `auth: AuthType | null` - Current auth data
- `setAuth(auth)` - Set authentication
- `clearAuth()` - Logout
- `isAuthenticated()` - Check if logged in

### userProfileStore
User identity and profile information.
- `userId: string | null`
- `personalData: { username, gender, birthday }`
- `isInInitialAnamnesis: boolean`
- `anamnesisCompleted: boolean`
- `teamId: string | null`
- `getAge()` - Calculate age from birthday

### userWorkoutStore
Workout configuration and training plans.
- `workoutData: { sport, seasonPhase, equipment, maxValues, tags }`
- `trainingPlan: TrainingPlanType | null`
- `replaceBranchInTrainingPlan()` - Complex plan modification logic

### userSettingsStore
App preferences and settings.
- `reviewStatus: ReviewStatusType`
- `anonymisedDataUse: boolean`

### anamnesisStore
Anamnesis questionnaire state and answers.
- `questions: AnamnesisQuestionGroupType[]` - Question groups with ordering
- `values: { [path: string]: any }` - User answers by data field path
- `tags: { [tag: string]: string[] }` - Tag-based answers
- `originPath: Route | undefined` - Navigation origin tracking
- `isLoading: boolean` - Questions loading state
- `loadQuestions()` - Load anamnesis questions from service
- `setValue(path, value)` - Save single answer
- `setTag(tag, values)` - Save tag-based answer
- `fillAnamnesisData(tags, workoutData)` - Pre-fill from existing data
- `resetAnamnesis()` - Clear all data

### trainingScheduleStore
Weekly training schedule.
- `trainingDays: TrainingDayType[]` - 7 days (Mon-Sun)
- `toggleDay(weekday)` - Toggle active/inactive
- `getActiveTrainingDays()` - Get only active days
- `getTotalActiveHours()` - Calculate total training time

### exercisesStore
Exercise database with filtering.
- `exercises: ExerciseType[] | null`
- `getExerciseById(id)` - Find specific exercise
- `getExercisesBySkill(skill)` - Filter by skill type
- `getExercisesByTag(tag)` - Filter by tag
- `getExercisesByEquipment(equipment)` - Filter by available equipment

### skillTreesStore
Skill progression trees for workout planning.
- `skillTrees: Record<string, SkillTreeType>`
- `getSkillTree(skillName)` - Get specific skill tree
- `getBranchById(skillName, branchId)` - Find specific branch
- `getAvailableBranchesForLevel(skillName, level)` - Filter by level

### exerciseProgressStore
User progression and exercise performance.
- `exerciseData: Record<number, UserExerciseDataType>` - Per-exercise data
- `branchData: Record<number, UserExerciseBranchDataType>` - Branch levels
- `xp: number` - User XP
- `level: number` - User level
- `testHistory: MaxValuesType[]` - Power test results
- `addXP(amount)` - Add experience points
- `updateExercise(id, data)` - Update exercise feedback/performance

### completedWorkoutsStore
Workout history and statistics.
- `workouts: Record<string, CompleteWorkoutType>` - All workouts
- `workoutsList: CompletedWorkoutListEntryType[]` - Sorted list
- `trainingPlans: TrainingPlanType[]` - Completed plans
- `getRecentWorkouts(limit)` - Get last N workouts
- `getTotalWorkouts()` - Total count
- `getTotalTrainingTime()` - Total time in seconds

## Persistence

All stores use **AsyncStorage** for automatic persistence via the `persist` middleware. State is automatically:
- Saved to AsyncStorage when updated
- Restored on app launch
- Merged with default values if partially stored

```typescript
// Stores are persisted with these keys:
// - auth-storage
// - user-profile-storage
// - user-workout-storage
// - user-settings-storage
// - training-schedule-storage
// - exercises-storage
// - skill-trees-storage
// - exercise-progress-storage
// - completed-workouts-storage
```

## Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store';

describe('authStore', () => {
  it('should set authentication', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setAuth({ userId: '123', token: 'abc' });
    });

    expect(result.current.isAuthenticated()).toBe(true);
  });
});
```

## Migration from Redux

This Zustand implementation replaces the legacy Redux architecture:
- **Before**: 24 Redux reducer branches with redux-thunk and redux-persist
- **After**: 9 focused Zustand stores with built-in persistence

See [REDUX_TO_ZUSTAND_MIGRATION.md](../../REDUX_TO_ZUSTAND_MIGRATION.md) for the complete migration plan.

## Best Practices

1. **Selector Pattern**: Use selectors to subscribe only to needed state
2. **Action Isolation**: Keep actions focused and atomic
3. **Type Safety**: All stores are fully typed with TypeScript
4. **Immutability**: State updates use immutable patterns
5. **Composability**: Combine multiple stores when needed
6. **Performance**: Zustand re-renders are optimized by default

## Next Steps

Phase 2 will involve:
- Migrating legacy Redux components to use Zustand stores
- Adding React Query for server-side data fetching
- Implementing optimistic updates for better UX
- Adding devtools integration for debugging
```

## Best Practices

### 1. Separate State and Actions in Interface

```typescript
interface MyStoreState {
  // State properties first
  count: number;
  name: string;
  
  // Actions after
  increment: () => void;
  setName: (name: string) => void;
}
```

### 2. Use Action Naming Conventions

- `set*` for setters: `setName`, `setTheme`
- Descriptive verbs: `increment`, `login`, `logout`
- `reset*` for resetting to initial state

### 3. Provide Initial State Separately

```typescript
const initialState = {
  count: 0,
  name: '',
};

export const useMyStore = createStore<MyStoreState>((set) => ({
  ...initialState,
  reset: () => set(initialState),
  // ... actions
}));
```

### 4. Use Selectors for Derived State

```typescript
export const myStoreSelectors = {
  isValid: (state: MyStoreState) => state.count > 0 && state.name.length > 0,
  displayName: (state: MyStoreState) => state.name.toUpperCase(),
};
```

### 5. Split Large Stores into Slices

For complex state, consider splitting into multiple focused stores rather than one large store:

```typescript
// Good: Focused stores
useAuthStore
useTrainingSessionStore
useSettingsStore

// Avoid: One giant store
useAppStore // with everything
```

## Testing

### Testing Store Actions

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyStore } from '@/store';

describe('MyStore', () => {
  it('should increment count', () => {
    const { result } = renderHook(() => useMyStore());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

### Resetting Store Between Tests

```typescript
beforeEach(() => {
  useMyStore.getState().reset();
});
```

## Performance Tips

1. **Select only what you need**: Use selectors to subscribe to specific state slices
2. **Use shallow comparison**: For selecting multiple values, use `shallow` from `zustand/shallow`
3. **Memoize selectors**: Use `useMemo` for complex selector logic
4. **Split stores**: Keep stores focused to minimize re-renders

## Additional Resources

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Documentation](https://react.dev)
- [React Native Documentation](https://reactnative.dev)
