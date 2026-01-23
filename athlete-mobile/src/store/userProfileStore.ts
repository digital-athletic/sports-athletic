import { SharedConstants } from "@/constants/sharedConstants";
import { dateToDDMMYYYY } from "@/utils/date";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";

export interface UserPersonalDataType {
  username: string;
  gender: "MALE" | "FEMALE";
  birthday: string; // DD-MM-YYYY format
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
  birthday: dateToDDMMYYYY(new Date()),
});

const createInitialState = (): State => ({
  userId: null,
  personalData: createInitialPersonalData(),
  anamnesisCompleted: false,
  teamId: null,
});

type Actions = {
  setUserId: (userId: string | null) => void;
  setUsername: (username: string) => void;
  setGender: (gender: "MALE" | "FEMALE") => void;
  setBirthday: (birthday: string) => void;
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

        const [day, month, year] = birthday.split("-").map(Number);
        if (!day || !month || !year) return null;

        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        return age;
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
