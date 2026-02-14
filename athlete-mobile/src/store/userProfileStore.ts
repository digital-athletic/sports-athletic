import { calculateAgeFromBirthday, formatDateToISO } from "@/utils/date";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { userProfileStoreMigrations } from "./migrations/userProfileStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";

export interface UserPersonalDataType {
  username: string;
  gender: "MALE" | "FEMALE";
  birthday: string; // Date of birth in ISO 8601 format (YYYY-MM-DD)
  height?: number; // Height in cm (50-250)
  weight?: number; // Weight in kg (20-300)
}

export type State = {
  personalData: UserPersonalDataType;
  anamnesisCompleted: boolean;
  teamId: string | null;
  _hasHydrated: boolean;
};

const createInitialPersonalData = (): UserPersonalDataType => ({
  username: "",
  gender: "MALE",
  birthday: formatDateToISO(new Date()),
});

const createInitialState = (): State => ({
  personalData: createInitialPersonalData(),
  anamnesisCompleted: false,
  teamId: null,
  _hasHydrated: false,
});

export const DEFAULT_STATE = createInitialState();

type Actions = {
  setUsername: (username: string) => void;
  setGender: (gender: "MALE" | "FEMALE") => void;
  setBirthday: (birthday: string) => void;
  setHeight: (height: number) => void;
  setWeight: (weight: number) => void;
  setPersonalData: (data: Partial<UserPersonalDataType>) => void;
  setAnamnesisCompleted: (completed: boolean) => void;
  setTeamId: (teamId: string | null) => void;
  resetProfile: () => void;
  setHasHydrated: (hydrated: boolean) => void;
};

type Selectors = {
  getAge: () => number | null;
};

export type UserProfileState = State & Actions & Selectors;

/**
 * User Profile Store
 *
 * Manages user profile data and onboarding state.
 * Note: userId is managed by authStore as the single source of truth.
 *
 * @example
 * ```tsx
 * const { personalData, setUsername, getAge } = useUserProfileStore();
 *
 * // Update username
 * setUsername('JohnDoe');
 *
 * // Get calculated age
 * const age = getAge();
 *
 * // Check anamnesis status
 * if (!anamnesisCompleted) {
 *   // Show anamnesis flow
 * }
 * ```
 */
export const useUserProfileStore = create<UserProfileState>()(
  persist(
    immer((set, get) => ({
      ...createInitialState(),

      setUsername: (username) =>
        set((state) => {
          state.personalData.username = username;
        }),

      setGender: (gender) =>
        set((state) => {
          state.personalData.gender = gender;
        }),

      setBirthday: (birthday) =>
        set((state) => {
          state.personalData.birthday = birthday;
        }),

      setHeight: (height) =>
        set((state) => {
          state.personalData.height = height;
        }),

      setWeight: (weight) =>
        set((state) => {
          state.personalData.weight = weight;
        }),

      setPersonalData: (data) =>
        set((state) => {
          state.personalData = { ...state.personalData, ...data };
        }),

      setAnamnesisCompleted: (completed) =>
        set((state) => {
          state.anamnesisCompleted = completed;
        }),

      setTeamId: (teamId) =>
        set((state) => {
          state.teamId = teamId;
        }),

      resetProfile: () =>
        set((state) => {
          const initialState = createInitialState();
          state.personalData = initialState.personalData;
          state.anamnesisCompleted = initialState.anamnesisCompleted;
          state.teamId = initialState.teamId;
        }),

      setHasHydrated: (hydrated) =>
        set((state) => {
          state._hasHydrated = hydrated;
        }),

      getAge: () => {
        const { birthday } = get().personalData;
        if (!birthday) return null;
        return calculateAgeFromBirthday(birthday);
      },
    })),
    {
      name: "user-profile-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.USER_PROFILE,
      migrate: createMigrate(
        STORE_VERSIONS.USER_PROFILE,
        userProfileStoreMigrations,
        createInitialState,
        "user-profile",
      ),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.error("Error hydrating user profile store:", error);
        }
        // Always mark as hydrated, even if there was an error
        // This prevents the app from being stuck in loading state
        useUserProfileStore.getState().setHasHydrated(true);
      },
    },
  ),
);
