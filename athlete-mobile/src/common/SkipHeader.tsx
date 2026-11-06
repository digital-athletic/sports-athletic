import { Alert } from "@/common/Alert";
import { I18nKey } from "@/i18n";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { Text } from "@/theme/Text";
import { useRouter } from "expo-router";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

interface SkipHeaderProps {
  alertTitle: I18nKey;
  alertMessage: I18nKey;
  confirmText?: I18nKey;
  cancelText?: I18nKey;
}

export const SkipHeader: FC<SkipHeaderProps> = ({
  alertTitle,
  alertMessage,
  confirmText,
  cancelText,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { setIsSkipped } = useAnamnesisStore();

  const showSkipAlert = () => {
    Alert.alert(t(alertTitle), t(alertMessage), [
      {
        text: t(confirmText || "common.yes"),
        onPress: () => {
          setIsSkipped(true);

          router.replace("/(tabs)/(home)");
        },
      },
      {
        text: t(cancelText || "common.no"),
      },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={showSkipAlert}
      accessibilityRole="button"
      accessibilityLabel={t("common.skip")}
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
      }}
    >
      <Text variant="skip">{t("common.skip")}</Text>
    </TouchableOpacity>
  );
};
