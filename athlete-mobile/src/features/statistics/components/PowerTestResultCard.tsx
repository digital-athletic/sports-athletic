import { Ionicon } from "@/common/Ionicon";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { formatDateForDisplay } from "@/utils/date";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

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
  const weights = [
    {
      label: t("statistics.powerTest.squad"),
      value: result.kneeDominant.barbell,
      color: colors.squad,
    },
    {
      label: t("statistics.powerTest.deadlift"),
      value: result.hipHinge.barbell,
      color: colors.deadlift,
    },
    {
      label: t("statistics.powerTest.benchPress"),
      value: result.horizontalPush.barbell,
      color: colors.benchPress,
    },
    {
      label: t("statistics.powerTest.rowing"),
      value: result.horizontalPull.barbell,
      color: colors.rowing,
    },
    {
      label: t("statistics.powerTest.shoulderPress"),
      value: result.verticalPush.barbell,
      color: colors.shoulderPress,
    },
  ];

  return (
    <>
      {weights.map((weight) => (
        <WeightRow
          key={weight.label}
          label={weight.label}
          weight={formatWeight(weight.value)}
          color={weight.color}
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
    <Box
      backgroundColor="white"
      borderWidth={1.5}
      borderColor="lightGrey2"
      borderRadius="xl"
      testID={testID}
    >
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
        <Ionicon
          name={expanded ? "chevron-up" : "chevron-down"}
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
    </Box>
  );
};
