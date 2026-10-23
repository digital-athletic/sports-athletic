import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ShortcutButtonProps = {
  iconName: IoniconName;
  title: string;
  subtitle: string;
  onPress: () => void;
};

const ShortcutButton: FC<ShortcutButtonProps> = ({
  iconName,
  title,
  subtitle,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.quickstartButton, { backgroundColor: colors.white }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Box alignItems="center" justifyContent="space-between" gap="s">
        <Ionicon name={iconName} size={48} color={colors.primary} decorative />
        <Text variant="cardTitle" textAlign="center" fontSize={14}>
          {title}
        </Text>
        <Text
          variant="description"
          textAlign="center"
          fontSize={12}
          color="darkGrey1"
        >
          {subtitle}
        </Text>
      </Box>
    </TouchableOpacity>
  );
};

export const HomeTrainingShortcuts: FC<{ isLandscape: boolean }> = ({
  isLandscape,
}) => {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Box
      flex={isLandscape ? 1 : undefined}
      flexDirection={isLandscape ? "column" : "row"}
      paddingHorizontal="l"
      paddingTop={isLandscape ? "l" : "none"}
      paddingLeft={isLandscape ? "none" : "l"}
      gap="m"
      style={{
        paddingBottom: Platform.OS === "ios" ? insets.bottom : spacing.l,
      }}
    >
      <ShortcutButton
        iconName="radio-button-on-outline"
        title={t("screens.home.trainingShortcuts.focusAndPrevention.title")}
        subtitle={t(
          "screens.home.trainingShortcuts.focusAndPrevention.subtitle",
        )}
        onPress={() => router.push("/focus-trainings")}
      />
      <ShortcutButton
        iconName="clipboard-outline"
        title={t("screens.home.trainingShortcuts.additionalTrainings.title")}
        subtitle={t(
          "screens.home.trainingShortcuts.additionalTrainings.subtitle",
        )}
        onPress={() => router.push("/additional-trainings")}
      />
    </Box>
  );
};

const styles = StyleSheet.create({
  quickstartButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#333",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
