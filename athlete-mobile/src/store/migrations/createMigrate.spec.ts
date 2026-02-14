import { createMigrate, LEGACY_SHARED_VERSION } from "./createMigrate";

describe("createMigrate", () => {
  const createInitial = () => ({ value: "default", count: 0 });

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resets to defaults when persisted version is below legacy version", () => {
    const migrate = createMigrate(14, {}, createInitial, "test-store");
    const result = migrate({ value: "old", count: 5 }, 5);

    expect(result).toEqual({ value: "default", count: 0 });
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("too old"),
    );
  });

  it("preserves state when migrating from legacy version 13 to 14 with no migrations", () => {
    const migrate = createMigrate(14, {}, createInitial, "test-store");
    const result = migrate(
      { value: "existing", count: 42 },
      LEGACY_SHARED_VERSION,
    );

    expect(result).toEqual({ value: "existing", count: 42 });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Bridging from legacy shared version 13"),
    );
  });

  it("applies migration when going from legacy 13 to version 15", () => {
    const migrations = {
      14: (state: { value: string; count: number }) => ({
        ...state,
        count: state.count + 1,
      }),
    };
    const migrate = createMigrate(15, migrations, createInitial, "test-store");
    const result = migrate(
      { value: "existing", count: 10 },
      LEGACY_SHARED_VERSION,
    );

    expect(result).toEqual({ value: "existing", count: 11 });
    expect(console.log).toHaveBeenCalledWith(
      "[migration:test-store] Applied migration 14 → 15",
    );
  });

  it("applies sequential migrations from legacy version", () => {
    const migrations = {
      14: (state: { value: string; count: number }) => ({
        ...state,
        value: state.value + "-v15",
      }),
      15: (state: { value: string; count: number }) => ({
        ...state,
        value: state.value + "-v16",
      }),
    };
    const migrate = createMigrate(16, migrations, createInitial, "test-store");
    const result = migrate({ value: "data", count: 0 }, LEGACY_SHARED_VERSION);

    expect(result).toEqual({ value: "data-v15-v16", count: 0 });
    expect(console.log).toHaveBeenCalledWith(
      "[migration:test-store] Migration complete, now at version 16",
    );
  });

  it("applies sequential migrations from a non-legacy version", () => {
    const migrations = {
      14: (state: { value: string; count: number }) => ({
        ...state,
        value: "should-not-run",
      }),
      15: (state: { value: string; count: number }) => ({
        ...state,
        count: state.count + 100,
      }),
    };
    const migrate = createMigrate(16, migrations, createInitial, "test-store");
    const result = migrate({ value: "kept", count: 5 }, 15);

    expect(result).toEqual({ value: "kept", count: 105 });
    expect(console.log).toHaveBeenCalledWith(
      "[migration:test-store] Migrating from version 15 → 16",
    );
  });

  it("preserves state when a migration is missing in the chain (no-op)", () => {
    const migrations = {
      14: (state: { value: string; count: number }) => ({
        ...state,
        value: state.value + "-v15",
      }),
      // 15 is missing — treated as no-op, data is preserved
    };
    const migrate = createMigrate(16, migrations, createInitial);
    const result = migrate({ value: "data", count: 5 }, LEGACY_SHARED_VERSION);

    expect(result).toEqual({ value: "data-v15", count: 5 });
  });

  it("resets to defaults when migration function throws", () => {
    const migrations = {
      14: () => {
        throw new Error("Migration failed");
      },
    };
    const migrate = createMigrate(15, migrations, createInitial, "test-store");
    const result = migrate({ value: "data", count: 5 }, LEGACY_SHARED_VERSION);

    expect(result).toEqual({ value: "default", count: 0 });
    expect(console.error).toHaveBeenCalledWith(
      "[migration:test-store] Migration 14 → 15 failed, resetting to defaults",
      expect.any(Error),
    );
  });

  it("resets to defaults when version is NaN", () => {
    const migrate = createMigrate(14, {}, createInitial, "test-store");
    const result = migrate({ value: "data", count: 5 }, NaN);

    expect(result).toEqual({ value: "default", count: 0 });
    expect(console.warn).toHaveBeenCalledWith(
      "[migration:test-store] Invalid persisted version (NaN), resetting to defaults",
    );
  });

  it("resets to defaults when version is a float", () => {
    const migrate = createMigrate(14, {}, createInitial);
    const result = migrate({ value: "data", count: 5 }, 13.5);

    expect(result).toEqual({ value: "default", count: 0 });
  });

  it("resets to defaults when version is Infinity", () => {
    const migrate = createMigrate(14, {}, createInitial);
    const result = migrate({ value: "data", count: 5 }, Infinity);

    expect(result).toEqual({ value: "default", count: 0 });
  });

  it("logs no migration needed when already at current version", () => {
    const migrate = createMigrate(14, {}, createInitial, "test-store");
    const result = migrate({ value: "data", count: 5 }, 14);

    expect(result).toEqual({ value: "data", count: 5 });
    expect(console.log).toHaveBeenCalledWith(
      "[migration:test-store] Already at version 14, no migration needed",
    );
  });

  it("uses generic tag when storeName is not provided", () => {
    const migrate = createMigrate(14, {}, createInitial);
    migrate({ value: "data", count: 5 }, NaN);

    expect(console.warn).toHaveBeenCalledWith(
      "[migration] Invalid persisted version (NaN), resetting to defaults",
    );
  });

  describe("LEGACY_SHARED_VERSION", () => {
    it("should be 13", () => {
      expect(LEGACY_SHARED_VERSION).toBe(13);
    });
  });
});
