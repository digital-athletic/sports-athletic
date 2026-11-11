import { AppIcon } from "@/common/AppIcon";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import { POWER_TEST_EXERCISES } from "@/features/statistics/models/powerTestExercises";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { formatDateForDisplay } from "@/utils/date";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";
import IconChevronDown from "@tabler/icons-react-native/IconChevronDown";
import IconChevronUp from "@tabler/icons-react-native/IconChevronUp";

interface PowerTestResultCardProps {
  result: MaxValuesType;
  expanded: boolean;
  onToggle: () => void;
  testID: string;
}

const formatWeight = (value: number | undefined) =>
  `${Math.round((value ?? 0) * 2) / 2} kg`;

const WeightRow: FC<{ label: string; weight: string; color: string }> = ({
  label,
  weight,
  color,
}) => (
  <Box
    height={36}
    flexDirection="row"
    justifyContent="space-between"
    alignItems="center"
  >
    <Text variant="body" style={{ color }}>
      {label}
    </Text>
    <Text variant="body" style={{ color }}>
      {weight}
    </Text>
  </Box>
);

/** The five weights of a result, each in the colour of its chart line. */
const ResultWeights: FC<{ result: MaxValuesType }> = ({ result }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <>
      {POWER_TEST_EXERCISES.map((exercise) => (
        <WeightRow
          key={exercise.direction}
          label={t(exercise.resultKey)}
          weight={formatWeight(result[exercise.direction].barbell)}
          color={colors[exercise.color]}
        />
      ))}
    </>
  );
};

/** One strength test result: the date as header, expanding to the five weights. */
export const PowerTestResultCard: FC<PowerTestResultCardProps> = ({
  result,
  expanded,
  onToggle,
  testID,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const date = formatDateForDisplay(new Date(result.testAt));

  return (
    <Card variant="outlined" testID={testID}>
      <Pressable
        onPress={onToggle}
        style={{
          minHeight: 56,
          paddingHorizontal: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        accessibilityLabel={t("statistics.powerTest.toggleEntry", { date })}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        // react-native-web 0.21 maps only the aria props, not accessibilityState.
        aria-expanded={expanded}
      >
        <Text variant="body" fontWeight="600">
          {date}
        </Text>
        <AppIcon
          icon={expanded ? IconChevronUp : IconChevronDown}
          size={20}
          color={colors.darkGrey1}
          decorative
        />
      </Pressable>

      {expanded && (
        <Box
          borderTopWidth={1}
          borderColor="lightGrey2"
          paddingHorizontal="m"
          paddingVertical="xs"
        >
          <ResultWeights result={result} />
        </Box>
      )}
    </Card>
  );
};
