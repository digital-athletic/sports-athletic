import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Image, ImageSourcePropType } from "react-native";

interface TrainingSummaryProps {
  duration: string;
  count: string;
  points: string;
  weight: string;
}

type SummaryType = "DURATION" | "COUNT" | "POINTS" | "WEIGHT";

const ICON_SIZE = 48;

const SUMMARY_ICONS: Record<SummaryType, ImageSourcePropType> = {
  DURATION: require("../../../../assets/img/trainingsSummary/time.png"),
  COUNT: require("../../../../assets/img/trainingsSummary/count.png"),
  POINTS: require("../../../../assets/img/trainingsSummary/trophy.png"),
  WEIGHT: require("../../../../assets/img/trainingsSummary/weight.png"),
};

/**
 * Training Summary Component
 * Displays duration, count, points, and weight statistics for a workout.
 */
export const TrainingSummary: FC<TrainingSummaryProps> = ({
  duration,
  count,
  points,
  weight,
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
    POINTS: {
      title: t("statistics.workouts.summary.points"),
      alt: t("statistics.workouts.summary.pointsAlt"),
    },
    WEIGHT: {
      title: t("statistics.workouts.summary.weight"),
      alt: t("statistics.workouts.summary.weightAlt"),
    },
  };

  const values: Record<SummaryType, string> = {
    DURATION: duration,
    COUNT: count,
    POINTS: points,
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
        <Image
          source={SUMMARY_ICONS[type]}
          style={{ width: ICON_SIZE, height: ICON_SIZE }}
          accessibilityLabel={labels[type].alt}
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
    >
      {renderEntry("DURATION")}
      {renderEntry("COUNT")}
      {renderEntry("POINTS")}
      {renderEntry("WEIGHT")}
    </Box>
  );
};
