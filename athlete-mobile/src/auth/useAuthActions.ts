import {
  deleteAccount as supabaseDeleteAccount,
  logout as supabaseLogout,
} from "@/services/AuthService";
import { useSubscriptionStore } from "@/features/subscription/subscriptionStore";
import { useSynchronizationStore } from "@/features/training/synchronizationStore";
import { useTrainingStore } from "@/features/training/trainingStore";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useAuthStore } from "@/store/authStore";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useSyncQueueStore } from "@/store/syncQueueStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserSettingsStore } from "@/store/userSettingsStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { syncManager } from "@/services/SyncManager";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/common/Alert";

/**
 * Hook for logout functionality.
 * Handles Supabase signout and clears auth state.
 * Explicitly navigates to onboarding to ensure navigation state is reset.
 */
export function useLogout() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabaseLogout();
      clearAuth();
      // Stack.Protected in _layout.tsx automatically redirects to onboarding
      // when user becomes null
    } catch {
      Alert.alert(t("onboarding.alertErrorTitle"), t("more.logoutFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const confirmLogout = () => {
    if (!syncManager.isOnline) {
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

/**
 * Hook for delete account functionality.
 * Handles Supabase signout and clears all user data stores.
 * Stack.Protected in _layout.tsx handles redirect to onboarding.
 */
export function useDeleteAccount() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { resetProgress } = useExerciseProgressStore();
  const { resetAnamnesisData } = useAnamnesisStore();
  const { resetProfile } = useUserProfileStore();
  const { resetUserWorkoutData } = useUserWorkoutStore();
  const { clearWorkoutHistory } = useCompletedWorkoutsStore();
  const { resetTrainingSchedule } = useTrainingScheduleStore();
  const { resetPlaces } = usePlacesStore();
  const { resetSettings } = useUserSettingsStore();
  const { clearSyncQueue } = useSyncQueueStore();
  const { resetSubscription } = useSubscriptionStore();
  const { clearTraining } = useTrainingStore();
  const { resetSynchronization } = useSynchronizationStore();

  const deleteAccount = async () => {
    setIsLoading(true);
    try {
      await supabaseDeleteAccount();
      await supabaseLogout();

      // Clear stores with no default state, reset stores to their defaults
      clearAuth();
      resetUserWorkoutData();
      resetProgress();
      resetAnamnesisData();
      resetProfile();
      clearWorkoutHistory();
      resetTrainingSchedule();
      resetPlaces();
      resetSettings();
      clearSyncQueue();
      resetSubscription();
      clearTraining();
      resetSynchronization();
      // Stack.Protected in _layout.tsx automatically redirects to onboarding
      // when user becomes null
    } catch {
      Alert.alert(t("onboarding.alertErrorTitle"), t("more.deleteFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!syncManager.isOnline) {
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
