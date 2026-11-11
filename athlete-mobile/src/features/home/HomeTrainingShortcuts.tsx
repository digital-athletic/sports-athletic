import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { router } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";
import IconClipboardList from "@tabler/icons-react-native/IconClipboardList";
import IconTargetArrow from "@tabler/icons-react-native/IconTargetArrow";

type ShortcutButtonProps = {
  icon: AppIconSource;
  title: string;
  subtitle: string;
  onPress: () => void;
};

const ShortcutButton: FC<ShortcutButtonProps> = ({
  icon,
  title,
  subtitle,
  onPress,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.quickstartButton,
        { backgroundColor: colors.lightGrey1, borderColor: colors.lightGrey2 },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Box alignItems="center" justifyContent="space-between" gap="s">
        <AppIcon icon={icon} size={32} color={colors.primary} decorative />
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
        icon={IconTargetArrow}
        title={t("screens.home.trainingShortcuts.focusAndPrevention.title")}
        subtitle={t(
          "screens.home.trainingShortcuts.focusAndPrevention.subtitle",
        )}
        onPress={() => router.push("/focus-trainings")}
      />
      <ShortcutButton
        icon={IconClipboardList}
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
    borderRadius: 16,
    borderWidth: 1.5,
  },
});
