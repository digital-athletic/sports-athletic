import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";

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
        <Ionicon name={iconName} size={32} color={colors.primary} decorative />
        <Text variant="cardTitle" textAlign="center" fontSize={14}>
          {title}
        </Text>
        <Text variant="xSmall" textAlign="center" color="darkGrey1">
          {subtitle}
        </Text>
      </Box>
    </TouchableOpacity>
  );
};

type HomeTrainingShortcutsProps = {
  /** Places the tiles below each other, in a column next to the plan card. */
  stacked: boolean;
};

export const HomeTrainingShortcuts: FC<HomeTrainingShortcutsProps> = ({
  stacked,
}) => {
  const { t } = useTranslation();

  // The tab bar below already keeps clear of the home indicator.
  // iOS keeps layout values of the other arrangement after a rotation and lets
  // the tiles run past the screen edge; a fresh mount per arrangement avoids it.
  return (
    <Box
      key={stacked ? "stacked" : "row"}
      flex={stacked ? 1 : undefined}
      flexDirection={stacked ? "column" : "row"}
      paddingHorizontal="l"
      paddingTop={stacked ? "l" : "none"}
      paddingLeft={stacked ? "none" : "l"}
      paddingBottom="l"
      gap="m"
      testID="home-shortcuts"
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
