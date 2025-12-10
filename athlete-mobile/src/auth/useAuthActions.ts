import { useAuthStore } from "@/store/authStore";
import { logout as supabaseLogout } from "@/services/AuthService";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

/**
 * Hook for logout functionality
 * Clears auth state and navigates to onboarding
 */
export function useLogout() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabaseLogout();
      clearAuth();
      // TODO: Clear other stores when reset methods are available
      router.replace("/onboarding");
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

  const deleteAccount = async () => {
    try {
      // TODO: Call Firebase delete user API when available
      await logout();
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
