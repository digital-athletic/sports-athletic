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
 * Hook for logout functionality
 * Clears auth state and navigates to onboarding
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
      // TODO: Clear other stores when reset methods are available
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
 * Hook for delete account functionality
 * Deletes user account and logs out
 */
export function useDeleteAccount() {
  const { t } = useTranslation();
  const { logout } = useLogout();
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
      logout();
      // Resets training plan and workout data
      clearUserWorkoutData();
      // Resets local exercise progress data
      clearProgress();
      // Resets local anamnesis data
      clearAnamnesisData();
      // Resets user profile & anamnesisCompleted flag
      clearProfile();
      // Resets workout history
      clearWorkoutHistory();
      // Resets training schedule
      clearTrainingSchedule();
      // Resets equipment selections
      clearPlaces();
      // Resets user preferences
      clearSettings();
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
