import { create } from "zustand";
import { persist } from "zustand/middleware";
import { asyncStorage } from "./middleware";

export interface UserPersonalDataType {
  username: string;
  gender: "MALE" | "FEMALE";
  birthday: string; // DD-MM-YYYY format
}

export interface UserProfileState {
  userId: string | null;
  personalData: UserPersonalDataType;
  isInInitialAnamnesis: boolean;
  anamnesisCompleted: boolean;
  teamId: string | null;

  // Actions
  setUserId: (userId: string | null) => void;
  setUsername: (username: string) => void;
  setGender: (gender: "MALE" | "FEMALE") => void;
  setBirthday: (birthday: string) => void;
  setPersonalData: (data: Partial<UserPersonalDataType>) => void;
  setIsInInitialAnamnesis: (value: boolean) => void;
  setAnamnesisCompleted: (completed: boolean) => void;
  setTeamId: (teamId: string | null) => void;
  clearProfile: () => void;

  // Selectors
  getAge: () => number | null;
}

const DEFAULT_PERSONAL_DATA: UserPersonalDataType = {
  username: "",
  gender: "MALE",
  birthday: "",
};

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
    (set, get) => ({
      userId: null,
      personalData: DEFAULT_PERSONAL_DATA,
      isInInitialAnamnesis: false,
      anamnesisCompleted: false,
      teamId: null,

      setUserId: (userId) => set({ userId }),

      setUsername: (username) =>
        set((state) => ({
          personalData: { ...state.personalData, username },
        })),

      setGender: (gender) =>
        set((state) => ({
          personalData: { ...state.personalData, gender },
        })),

      setBirthday: (birthday) =>
        set((state) => ({
          personalData: { ...state.personalData, birthday },
        })),

      setPersonalData: (data) =>
        set((state) => ({
          personalData: { ...state.personalData, ...data },
        })),

      setIsInInitialAnamnesis: (value) => set({ isInInitialAnamnesis: value }),

      setAnamnesisCompleted: (completed) =>
        set({ anamnesisCompleted: completed }),

      setTeamId: (teamId) => set({ teamId }),

      clearProfile: () =>
        set({
          userId: null,
          personalData: DEFAULT_PERSONAL_DATA,
          isInInitialAnamnesis: false,
          anamnesisCompleted: false,
          teamId: null,
        }),

      getAge: () => {
        const { birthday } = get().personalData;
        if (!birthday) return null;

        // Parse DD-MM-YYYY format
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
    }),
    {
      name: "user-profile-storage",
      storage: asyncStorage,
    }
  )
);
