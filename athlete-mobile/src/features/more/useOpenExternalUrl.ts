import { Alert } from "@/common/Alert";
import { SUPPORT_EMAIL } from "@/constants/AppConstants";
import { useTranslation } from "react-i18next";
import { Linking } from "react-native";

/** Returns a function that opens a URL outside the app and alerts when that fails. */
export const useOpenExternalUrl = (): ((url: string) => void) => {
  const { t } = useTranslation();

  return (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(
        t("more.linkError.title"),
        url.startsWith("mailto:")
          ? t("more.linkError.mailMessage", { email: SUPPORT_EMAIL })
          : t("more.linkError.message"),
      );
    });
  };
};
