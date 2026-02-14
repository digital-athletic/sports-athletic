/**
 * The legacy shared PERSIST_VERSION that was used before per-store versioning.
 * Stores persisted at this version contain valid data and should NOT be reset.
 */
export const LEGACY_SHARED_VERSION = 13;

export type MigrationFunction<TState> = (persistedState: TState) => TState;

export interface MigrationMap<TState> {
  [fromVersion: number]: MigrationFunction<TState>;
}

/**
 * Creates a migrate function for Zustand's persist middleware.
 *
 * Handles the transition from the old shared PERSIST_VERSION (13) to
 * per-store versioning (14+), plus sequential migrations for future changes.
 */
export function createMigrate<TState>(
  currentVersion: number,
  migrations: MigrationMap<TState>,
  createInitialState: () => TState,
): (persistedState: unknown, persistedVersion: number) => TState {
  return (persistedState: unknown, persistedVersion: number): TState => {
    // Reject non-integer version numbers (NaN, Infinity, floats)
    if (!Number.isInteger(persistedVersion)) {
      return createInitialState();
    }

    let state = persistedState as TState;
    let version = persistedVersion;

    // Legacy bridge: version 13 was the shared version.
    // Data is valid, so we treat it as version 14 (first per-store version).
    if (version === LEGACY_SHARED_VERSION) {
      version = 14;
    }

    // Data from before the legacy version is too old — reset
    if (version < LEGACY_SHARED_VERSION) {
      return createInitialState();
    }

    // Apply sequential migrations
    while (version < currentVersion) {
      const migration = migrations[version];
      if (migration) {
        try {
          state = migration(state);
        } catch {
          return createInitialState();
        }
      }
      // No migration defined for this version step — treat as no-op
      // (schema unchanged, only version bump)
      version++;
    }

    return state;
  };
}
