import { Alert } from "@/common/Alert";
import { useSynchronizationStore } from "@/features/training/synchronizationStore";
import { useTrainingStore } from "@/features/training/trainingStore";
import { useNetworkState } from "@/hooks/useNetworkState";
import {
  deleteAccount as supabaseDeleteAccount,
  logout as supabaseLogout,
} from "@/services/AuthService";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useAuthStore } from "@/store/authStore";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useSyncQueueStore } from "@/store/syncQueueStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserDataBackupStore } from "@/store/userDataBackupStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserSettingsStore } from "@/store/userSettingsStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function useLogout() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = useNetworkState();
  const router = useRouter();

  const clearAuth = useAuthStore((state) => state.clearAuth);
  const userId = useAuthStore((state) => state.auth?.userId);
  const setConsentStatus = useUserSettingsStore(
    (state) => state.setConsentStatus,
  );
  const resetProfile = useUserProfileStore((state) => state.resetProfile);
  const takeSnapshot = useUserDataBackupStore((state) => state.takeSnapshot);

  const logout = async () => {
    setIsLoading(true);
    if (userId) {
      takeSnapshot(userId);
    }

    // Order matters, otherwise user is stuck on the wrong screen
    clearAuth();
    router.replace("/onboarding");
    try {
      await supabaseLogout();
    } catch {
      Alert.alert(t("onboarding.alertErrorTitle"), t("more.logoutFailed"));
    } finally {
      setConsentStatus("loading");
      resetProfile();
      setIsLoading(false);
    }
  };

  const confirmLogout = () => {
    if (!isOnline) {
      Alert.alert(t("more.logoutQuestionTitle"), t("common.noConnection"));
      return;
    }

    Alert.alert(
      t("more.logoutQuestionTitle"),
      t("more.logoutQuestionMessage"),
      [
        {
          text: t("common.yes"),
          onPress: logout,
        },
        {
          text: t("common.no"),
        },
      ],
    );
  };

  return { logout: confirmLogout, isLoading };
}

/** Explicitly navigates to onboarding even when supabaseLogout throws after a successful deletion. */
export function useDeleteAccount() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = useNetworkState();
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const userId = useAuthStore((state) => state.auth?.userId);
  const { resetProgress } = useExerciseProgressStore();
  const { resetAnamnesisData } = useAnamnesisStore();
  const { resetProfile } = useUserProfileStore();
  const { resetUserWorkoutData } = useUserWorkoutStore();
  const { clearWorkoutHistory } = useCompletedWorkoutsStore();
  const { resetTrainingSchedule } = useTrainingScheduleStore();
  const { resetPlaces } = usePlacesStore();
  const { resetSettings } = useUserSettingsStore();
  const { clearUserItems } = useSyncQueueStore();
  const { clearTraining } = useTrainingStore();
  const { resetSynchronization } = useSynchronizationStore();

  const deleteAccount = async () => {
    setIsLoading(true);
    let deletionSucceeded = false;
    try {
      await supabaseDeleteAccount();
      deletionSucceeded = true;
      await supabaseLogout();
    } catch {
      Alert.alert(t("onboarding.alertErrorTitle"), t("more.deleteFailed"));
    } finally {
      // Clear stores and navigate only when the account was actually deleted.
      // This runs even if supabaseLogout throws, preventing a stale session
      // from persisting after a successful server-side deletion.
      if (deletionSucceeded) {
        clearAuth();
        resetUserWorkoutData();
        resetProgress();
        resetAnamnesisData();
        resetProfile();
        clearWorkoutHistory();
        resetTrainingSchedule();
        resetPlaces();
        resetSettings();
        if (userId) {
          clearUserItems(userId);
        }
        clearTraining();
        resetSynchronization();
        router.replace("/onboarding");
      }
      setIsLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!isOnline) {
      Alert.alert(t("more.deleteQuestionTitle"), t("common.noConnection"));
      return;
    }

    Alert.alert(
      t("more.deleteQuestionTitle"),
      t("more.deleteQuestionMessage"),
      [
        {
          text: t("common.yes"),
          onPress: deleteAccount,
        },
        {
          text: t("common.no"),
        },
      ],
    );
  };

  return { deleteAccount: confirmDelete, isLoading };
}
