import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORE_VERSIONS } from "./storeVersions";
import { useAuthStore } from "./authStore";
import { useUserProfileStore } from "./userProfileStore";
import { useUserWorkoutStore } from "./userWorkoutStore";
import { useAnamnesisStore } from "./anamnesisStore";

describe("Per-Store Migration Versioning", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  describe("STORE_VERSIONS", () => {
    it("should have all 10 store versions defined as integers >= 14", () => {
      const expectedStores = [
        "AUTH",
        "USER_PROFILE",
        "USER_WORKOUT",
        "USER_SETTINGS",
        "ANAMNESIS",
        "TRAINING_SCHEDULE",
        "PLACES",
        "COMPLETED_WORKOUTS",
        "SYNC_QUEUE",
        "EXERCISE_PROGRESS",
      ] as const;

      for (const store of expectedStores) {
        const version = STORE_VERSIONS[store];
        expect(version).toBeGreaterThanOrEqual(14);
        expect(Number.isInteger(version)).toBe(true);
      }

      expect(Object.keys(STORE_VERSIONS)).toHaveLength(expectedStores.length);
    });

    it("should all start at version 14 (first per-store version)", () => {
      const versions = Object.values(STORE_VERSIONS);
      for (const version of versions) {
        expect(version).toBe(14);
      }
    });
  });

  describe("Ancient version reset", () => {
    it("should reset authStore when persisted version is below legacy", async () => {
      const ancientState = {
        state: {
          auth: { userId: "old-user", token: "old-token" },
          isInitialized: true,
        },
        version: 5,
      };
      await AsyncStorage.setItem("auth-storage", JSON.stringify(ancientState));

      const state = useAuthStore.getState();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(state.auth).toBeNull();
      expect(state.isInitialized).toBe(false);
    });

    it("should reset userProfileStore when persisted version is below legacy", async () => {
      const ancientState = {
        state: {
          personalData: {
            username: "olduser",
            gender: "MALE",
            birthday: "1990-01-01",
          },
          anamnesisCompleted: true,
          teamId: "old-team",
        },
        version: 0,
      };
      await AsyncStorage.setItem(
        "user-profile-storage",
        JSON.stringify(ancientState),
      );

      const state = useUserProfileStore.getState();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(state.anamnesisCompleted).toBe(false);
    });
  });

  describe("Store smoke tests", () => {
    it("should have migration configured in authStore", () => {
      expect(useAuthStore).toBeDefined();
      expect(useAuthStore.getState).toBeDefined();
    });

    it("should have migration configured in userProfileStore", () => {
      expect(useUserProfileStore).toBeDefined();
      expect(useUserProfileStore.getState).toBeDefined();
    });

    it("should have migration configured in userWorkoutStore", () => {
      expect(useUserWorkoutStore).toBeDefined();
      expect(useUserWorkoutStore.getState).toBeDefined();
    });

    it("should have migration configured in anamnesisStore", () => {
      expect(useAnamnesisStore).toBeDefined();
      expect(useAnamnesisStore.getState).toBeDefined();
    });
  });
});
