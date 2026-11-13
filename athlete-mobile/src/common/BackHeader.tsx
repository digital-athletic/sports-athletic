import { useTheme } from "@/theme/theme";
import { useRouter } from "expo-router";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";
import { AppIcon } from "./AppIcon";
import IconArrowLeft from "@tabler/icons-react-native/IconArrowLeft";

interface BackHeaderProps {
  onBack?: () => void;
  testID?: string;
}

export const BackHeader: FC<BackHeaderProps> = ({ onBack, testID }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const onPress = onBack ?? (() => router.back());

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t("common.back")}
      testID={testID}
    >
      <AppIcon
        icon={IconArrowLeft}
        size={30}
        color={theme.colors.onSurface}
        decorative
      />
    </TouchableOpacity>
  );
};
