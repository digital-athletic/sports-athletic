import { type FC } from "react";
import { Pressable, StyleSheet } from "react-native";
import { type TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import {
  type SportTest,
  type SportTestReferenceValue,
} from "./models/SportTest";
import { TestIconCircle } from "./TestIconCircle";
import { formatValueWithUnit, type LatestResult } from "./testValues";
import { useReferenceLine, useTestName } from "./useTestLabels";
import { ValueStatusPill } from "./ValueStatusPill";

type Props = {
  test: SportTest;
  range: SportTestReferenceValue | null;
  latest: LatestResult | null;
  onPress: () => void;
};

const LatestValue: FC<{ test: SportTest; latest: LatestResult | null }> = ({
  test,
  latest,
}) => {
  const { t, i18n } = useTranslation();

  if (latest === null) {
    return (
      <Text
        variant="small"
        fontSize={{ phone: 14, tablet: 17 }}
        color="darkGrey1"
      >
        {t("more.performanceTests.noValue")}
      </Text>
    );
  }

  return (
    <Box alignItems="flex-end" gap="xs">
      <Text
        variant="body"
        fontSize={{ phone: 16, tablet: 20 }}
        fontWeight="600"
      >
        {formatValueWithUnit(latest.value.value, test.unit, i18n.language)}
      </Text>
      {latest.status && <ValueStatusPill status={latest.status} />}
    </Box>
  );
};

function describeLatest(
  test: SportTest,
  latest: LatestResult | null,
  t: TFunction,
  language: string,
): string {
  if (latest === null) return t("more.performanceTests.noValue");

  const value = formatValueWithUnit(latest.value.value, test.unit, language);
  if (latest.status === null) return value;

  return `${value}, ${t(`more.performanceTests.status.${latest.status}`)}`;
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
});

/** One test as a pressable card with its icon, name, reference range and latest value. */
export const PerformanceTestRow: FC<Props> = ({
  test,
  range,
  latest,
  onPress,
}) => {
  const { t, i18n } = useTranslation();

  const name = useTestName(test.code);
  const reference = useReferenceLine(test, range);
  const latestLabel = describeLatest(test, latest, t, i18n.language);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${reference}, ${latestLabel}`}
      testID={`performance-test-row-${test.code}`}
    >
      <Card
        variant="outlined"
        backgroundColor="lightGrey1"
        flexDirection="row"
        alignItems="center"
        gap={{ phone: "s", tablet: "m" }}
        padding={{ phone: "s", tablet: "m" }}
      >
        <TestIconCircle />
        <Box flex={1}>
          <Text
            variant="body"
            fontSize={{ phone: 16, tablet: 20 }}
            fontWeight="600"
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text
            variant="small"
            fontSize={{ phone: 14, tablet: 17 }}
            color="darkGrey1"
          >
            {reference}
          </Text>
        </Box>
        <Box testID={`performance-test-latest-${test.code}`}>
          <LatestValue test={test} latest={latest} />
        </Box>
      </Card>
    </Pressable>
  );
};
