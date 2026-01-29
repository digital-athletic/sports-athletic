import { SharedConstants } from "@/constants/sharedConstants";
import { calculateAgeFromBirthday, dateToISODate } from "@/utils/date";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface UserPersonalDataType {
  username: string;
  gender: "MALE" | "FEMALE";
  birthday: string; // Date of birth in ISO 8601 format (YYYY-MM-DD)
  height?: number; // Height in cm (50-250)
  weight?: number; // Weight in kg (20-300)
}

type State = {
  userId: string | null;
  personalData: UserPersonalDataType;
  anamnesisCompleted: boolean;
  teamId: string | null;
};

const createInitialPersonalData = (): UserPersonalDataType => ({
  username: "",
  gender: "MALE",
  birthday: dateToISODate(new Date()),
});

const createInitialState = (): State => ({
  userId: null,
  personalData: createInitialPersonalData(),
  anamnesisCompleted: false,
  teamId: null,
});

export const DEFAULT_STATE = createInitialState();

type Actions = {
  setUserId: (userId: string | null) => void;
  setUsername: (username: string) => void;
  setGender: (gender: "MALE" | "FEMALE") => void;
  setBirthday: (birthday: string) => void;
  setHeight: (height: number) => void;
  setWeight: (weight: number) => void;
  setPersonalData: (data: Partial<UserPersonalDataType>) => void;
  setAnamnesisCompleted: (completed: boolean) => void;
  setTeamId: (teamId: string | null) => void;
  clearProfile: () => void;
};

type Selectors = {
  getAge: () => number | null;
};

export type UserProfileState = State & Actions & Selectors;

/**
 * User Profile Store
 *
 * Manages user identity, profile data, and onboarding state.
 * This store handles authentication-related user info and anamnesis flow.
 *
 * @example
 * ```tsx
 * const { userId, personalData, setUsername, getAge } = useUserProfileStore();
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

      setUserId: (userId) =>
        set((state) => {
          state.userId = userId;
        }),

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

      clearProfile: () =>
        set((state) => {
          const initialState = createInitialState();
          state.userId = initialState.userId;
          state.personalData = initialState.personalData;
          state.anamnesisCompleted = initialState.anamnesisCompleted;
          state.teamId = initialState.teamId;
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
      version: SharedConstants.PERSIST_VERSION,
      migrate: (persistedState, version) =>
        version < SharedConstants.PERSIST_VERSION
          ? createInitialState()
          : persistedState,
    },
  ),
);
