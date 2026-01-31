import { logout as supabaseLogout } from "@/services/AuthService";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useAuthStore } from "@/store/authStore";
import { useCompletedWorkoutsStore } from "@/store/completedWorkoutsStore";
import { useExerciseProgressStore } from "@/store/exerciseProgressStore";
import { usePlacesStore } from "@/store/placesStore";
import { useTrainingScheduleStore } from "@/store/trainingScheduleStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserSettingsStore } from "@/store/userSettingsStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
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
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { clearProgress } = useExerciseProgressStore();
  const { clearAnamnesisData } = useAnamnesisStore();
  const { clearProfile } = useUserProfileStore();
  const { clearUserWorkoutData } = useUserWorkoutStore();
  const { clearWorkoutHistory } = useCompletedWorkoutsStore();
  const { clearTrainingSchedule } = useTrainingScheduleStore();
  const { clearPlaces } = usePlacesStore();
  const { clearSettings } = useUserSettingsStore();

  const deleteAccount = async () => {
    try {
      // TODO: Delete user from Supabase
      // See: https://github.com/sports-athletics/sports-athletic/issues/219
      await supabaseLogout();

      // Clear all user data stores
      clearAuth();
      clearUserWorkoutData();
      clearProgress();
      clearAnamnesisData();
      clearProfile();
      clearWorkoutHistory();
      clearTrainingSchedule();
      clearPlaces();
      clearSettings();
      // Stack.Protected in _layout.tsx automatically redirects to onboarding
      // when user becomes null
    } catch {
      Alert.alert(t("onboarding.alertErrorTitle"), t("more.deleteFailed"));
    }
  };

  const confirmDelete = () => {
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

  return { deleteAccount: confirmDelete };
}
