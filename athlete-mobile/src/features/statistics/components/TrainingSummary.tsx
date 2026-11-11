import { AppIcon, type AppIconSource } from "@/common/AppIcon";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import IconClock from "@tabler/icons-react-native/IconClock";
import IconDialpad from "@tabler/icons-react-native/IconDialpad";
import IconTrophy from "@tabler/icons-react-native/IconTrophy";
import IconWeight from "@tabler/icons-react-native/IconWeight";

interface TrainingSummaryProps {
  duration: string;
  count: string;
  xp: string;
  weight: string;
  testID?: string;
}

type SummaryType = "duration" | "count" | "xp" | "weight";

const ICON_CIRCLE_SIZE = 36;
const ICON_SIZE = 18;

const SUMMARY_ICONS: Record<SummaryType, AppIconSource> = {
  duration: IconClock,
  count: IconDialpad,
  xp: IconTrophy,
  weight: IconWeight,
};

const ROWS: readonly (readonly [SummaryType, SummaryType])[] = [
  ["duration", "count"],
  ["xp", "weight"],
];

interface SummaryCardProps {
  type: SummaryType;
  value: string;
  testID?: string;
}

const SummaryCard: FC<SummaryCardProps> = ({ type, value, testID }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const label = t(`statistics.workouts.summary.${type}`);

  return (
    <Card
      variant="outlined"
      flex={1}
      flexDirection="row"
      alignItems="center"
      gap="s"
      padding="s"
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Box
        width={ICON_CIRCLE_SIZE}
        height={ICON_CIRCLE_SIZE}
        borderRadius="round"
        backgroundColor="primaryTint"
        alignItems="center"
        justifyContent="center"
      >
        <AppIcon
          icon={SUMMARY_ICONS[type]}
          size={ICON_SIZE}
          color={colors.primary}
          decorative
        />
      </Box>
      <Box flex={1}>
        <Text
          fontSize={18}
          fontWeight="bold"
          numberOfLines={1}
          testID={testID ? `${testID}-${type}` : undefined}
        >
          {value}
        </Text>
        <Text variant="xSmall" color="darkGrey1">
          {label}
        </Text>
      </Box>
    </Card>
  );
};

/** Duration, exercise count, points and moved weight as a two by two grid of cards. */
export const TrainingSummary: FC<TrainingSummaryProps> = ({
  duration,
  count,
  xp,
  weight,
  testID,
}) => {
  const values: Record<SummaryType, string> = {
    duration,
    count,
    xp,
    weight,
  };

  return (
    <Box alignSelf="stretch" gap="s" testID={testID}>
      {ROWS.map((row) => (
        <Box key={row.join("-")} flexDirection="row" gap="s">
          {row.map((type) => (
            <SummaryCard
              key={type}
              type={type}
              value={values[type]}
              testID={testID}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};
