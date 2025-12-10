import { Text } from "@/theme/Text";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

interface SkipHeaderProps {
  onSkip: () => void;
}

export const SkipHeader: FC<SkipHeaderProps> = ({ onSkip }) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={onSkip}
      accessibilityRole="button"
      accessibilityLabel={t("common.skip")}
    >
      <Text ml="m" variant="skip">
        {t("common.skip")}
      </Text>
    </TouchableOpacity>
  );
};
