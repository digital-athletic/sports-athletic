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

export const useMyStore = create<MyStoreState>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
    }),
    {
      name: 'my-store-key', // Storage key
      storage: createJSONStorage(() => asyncStorage),
    }
  )
);
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
