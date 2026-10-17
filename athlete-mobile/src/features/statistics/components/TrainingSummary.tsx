import { Ionicon, type IoniconName } from "@/common/Ionicon";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

interface TrainingSummaryProps {
  duration: string;
  count: string;
  xp: string;
  weight: string;
  testID?: string;
}

type SummaryType = "DURATION" | "COUNT" | "XP" | "WEIGHT";

const ICON_SIZE = 32;

const SUMMARY_ICONS: Record<SummaryType, IoniconName> = {
  DURATION: "time-outline",
  COUNT: "keypad-outline",
  XP: "trophy-outline",
  WEIGHT: "barbell-outline",
};

/**
 * Training Summary Component
 * Displays duration, count, XP, and weight statistics for a workout.
 */
export const TrainingSummary: FC<TrainingSummaryProps> = ({
  duration,
  count,
  xp,
  weight,
  testID,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const labels: Record<SummaryType, { title: string; alt: string }> = {
    DURATION: {
      title: t("statistics.workouts.summary.duration"),
      alt: t("statistics.workouts.summary.durationAlt"),
    },
    COUNT: {
      title: t("statistics.workouts.summary.count"),
      alt: t("statistics.workouts.summary.countAlt"),
    },
    XP: {
      title: t("statistics.workouts.summary.xp"),
      alt: t("statistics.workouts.summary.xpAlt"),
    },
    WEIGHT: {
      title: t("statistics.workouts.summary.weight"),
      alt: t("statistics.workouts.summary.weightAlt"),
    },
  };

  const values: Record<SummaryType, string> = {
    DURATION: duration,
    COUNT: count,
    XP: xp,
    WEIGHT: weight,
  };

  const renderEntry = (type: SummaryType) => (
    <Box
      key={`summary_${type}`}
      flexDirection="column"
      flex={1}
      justifyContent="space-between"
      alignItems="center"
      paddingVertical="m"
    >
      <Box flex={1} justifyContent="center" alignItems="center">
        <Ionicon
          name={SUMMARY_ICONS[type]}
          size={ICON_SIZE}
          color={colors.primary}
          decorative
        />
      </Box>
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text
          variant="small"
          textAlign="center"
          style={{ color: colors.darkGrey2 }}
        >
          {labels[type].title}
        </Text>
      </Box>
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text
          variant="body"
          textAlign="center"
          style={{ color: colors.darkGrey3 }}
        >
          {values[type]}
        </Text>
      </Box>
    </Box>
  );

  return (
    <Box
      flex={1}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      alignSelf="stretch"
      testID={testID}
    >
      {renderEntry("DURATION")}
      {renderEntry("COUNT")}
      {renderEntry("XP")}
      {renderEntry("WEIGHT")}
    </Box>
  );
};
