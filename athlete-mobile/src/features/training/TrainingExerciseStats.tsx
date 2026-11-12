import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { type RowWeight } from "@/features/training/hooks/useTrainingListRows";
import { type HeartRateInterval } from "@/features/training/utils/heartRateUtils";
import { useTheme } from "@/theme/theme";
import { formatPlannedMinutes } from "@/utils/date";
import { Host, RNHostView, Row, Text } from "@expo/ui";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconClock from "@tabler/icons-react-native/IconClock";
import IconHeartbeat from "@tabler/icons-react-native/IconHeartbeat";
import IconRepeat from "@tabler/icons-react-native/IconRepeat";
import IconWeight from "@tabler/icons-react-native/IconWeight";

const ICON_SIZE = 18;

type StatTileProps = {
  icon: AppIconSource;
  value: string;
  caption: string;
  testID: string;
};

const StatTile: FC<StatTileProps> = ({ icon, value, caption, testID }) => {
  const { colors } = useTheme();

  return (
    <Row
      alignment="center"
      spacing={6}
      testID={testID}
      style={{
        backgroundColor: colors.surfaceContainerHigh,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
      }}
    >
      <RNHostView matchContents>
        <AppIcon
          icon={icon}
          size={ICON_SIZE}
          color={colors.primary}
          decorative
        />
      </RNHostView>
      <Text
        textStyle={{ fontSize: 18, fontWeight: "600", color: colors.onSurface }}
      >
        {value}
      </Text>
      <Text textStyle={{ fontSize: 14, color: colors.onSurfaceVariant }}>
        {caption}
      </Text>
    </Row>
  );
};

type Props = {
  targetReps?: number;
  targetWeight?: RowWeight;
  /** Planned duration of a steady run in seconds. */
  targetDuration?: number;
  heartRateBand?: HeartRateInterval;
};

/**
 * Native target tiles for the exercise sheet: reps and weight, or the planned
 * duration and heart rate band of a steady run. Renders nothing without any.
 */
export const TrainingExerciseStats: FC<Props> = ({
  targetReps,
  targetWeight,
  targetDuration,
  heartRateBand,
}) => {
  const { t } = useTranslation();

  if (
    targetReps === undefined &&
    !targetWeight &&
    targetDuration === undefined &&
    !heartRateBand
  ) {
    return null;
  }

  return (
    // The app has a light design only, so the tiles ignore a device in dark mode.
    <Host
      matchContents
      colorScheme="light"
      style={{ alignSelf: "center" }}
      testID="training-list-sheet-stats"
    >
      <Row spacing={8} alignment="center">
        {targetReps !== undefined && (
          <StatTile
            icon={IconRepeat}
            value={String(targetReps)}
            caption={t("training.active.repetitions")}
            testID="training-list-sheet-reps"
          />
        )}
        {targetWeight && (
          <StatTile
            icon={IconWeight}
            value={`${targetWeight.isPerHand ? t("training.active.2x") : ""}${targetWeight.kilos.toFixed(2)}`}
            caption={t("training.list.weightUnit")}
            testID="training-list-sheet-weight"
          />
        )}
        {targetDuration !== undefined && (
          <StatTile
            icon={IconClock}
            value={formatPlannedMinutes(targetDuration)}
            caption={t("training.list.minutesUnit")}
            testID="training-list-sheet-duration"
          />
        )}
        {heartRateBand && (
          <StatTile
            icon={IconHeartbeat}
            value={`${heartRateBand.low} - ${heartRateBand.high}`}
            caption={t("training.list.heartRateUnit")}
            testID="training-list-sheet-heart-rate"
          />
        )}
      </Row>
    </Host>
  );
};
