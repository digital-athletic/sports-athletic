import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { asyncStorage } from "./middleware";
import { createMigrate } from "./migrations/createMigrate";
import { userDataBackupStoreMigrations } from "./migrations/userDataBackupStoreMigrations";
import { STORE_VERSIONS } from "./storeVersions";
import {
  useUserProfileStore,
  type UserPersonalDataType,
} from "./userProfileStore";

interface ProfileSnapshot {
  personalData: UserPersonalDataType;
  anamnesisCompleted: boolean;
  teamId: string | null;
}

export interface UserDataSnapshot {
  profile?: ProfileSnapshot;
}

export type State = {
  snapshots: Record<string, UserDataSnapshot>;
};

type Actions = {
  takeSnapshot: (userId: string) => void;
  restoreSnapshot: (userId: string) => void;
  purgeSnapshot: (userId: string) => void;
};

type UserDataBackupState = State & Actions;

const createInitialState = (): State => ({
  snapshots: {},
});

export const useUserDataBackupStore = create<UserDataBackupState>()(
  persist(
    immer((set, get) => ({
      ...createInitialState(),

      takeSnapshot: (userId) =>
        set((state) => {
          const { personalData, anamnesisCompleted, teamId } =
            useUserProfileStore.getState();
          state.snapshots[userId] = {
            profile: {
              personalData: { ...personalData },
              anamnesisCompleted,
              teamId,
            },
          };
        }),

      restoreSnapshot: (userId) => {
        const backup = get().snapshots[userId];
        if (!backup?.profile) return;
        const { setPersonalData, setAnamnesisCompleted, setTeamId } =
          useUserProfileStore.getState();
        setPersonalData(backup.profile.personalData);
        setAnamnesisCompleted(backup.profile.anamnesisCompleted);
        setTeamId(backup.profile.teamId);
      },

      purgeSnapshot: (userId) =>
        set((state) => {
          delete state.snapshots[userId];
        }),
    })),
    {
      name: "user-data-backup-storage",
      storage: asyncStorage,
      version: STORE_VERSIONS.USER_DATA_BACKUP,
      migrate: createMigrate(
        STORE_VERSIONS.USER_DATA_BACKUP,
        userDataBackupStoreMigrations,
        createInitialState,
        "user-data-backup",
      ),
    },
  ),
);
