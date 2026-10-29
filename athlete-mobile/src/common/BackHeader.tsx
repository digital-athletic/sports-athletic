import { useTheme } from "@/theme/theme";
import { useRouter } from "expo-router";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { Ionicon } from "./Ionicon";

interface BackHeaderProps {
  onBack?: () => void;
}

export const BackHeader: FC<BackHeaderProps> = ({ onBack }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const onPress = onBack ?? (() => router.back());

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("common.back")}
    >
      <Ionicon
        name="arrow-back"
        size={30}
        color={theme.colors.black}
        decorative
      />
    </TouchableOpacity>
  );
};
