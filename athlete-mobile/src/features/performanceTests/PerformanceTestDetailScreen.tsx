import { type FC } from "react";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { LegendPill } from "@/common/LegendPill";
import { RangeLineChart } from "@/charts/RangeLineChart";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { Box } from "@/theme/Box";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { formatDateForDisplay, formatDateToISO } from "@/utils/date";
import { type PerformanceTestValue } from "./models/PerformanceTestValue";
import { type SportTest } from "./models/SportTest";
import { PerformanceTestsNotice } from "./PerformanceTestsNotice";
import { referenceRangeOnDate } from "./referenceRange";
import {
  formatValueWithUnit,
  latestResult,
  rangeLinePoints,
  sortNewestFirst,
  testValuesKey,
} from "./testValues";
import { TestIconCircle } from "./TestIconCircle";
import { TestSectionCard, TestSectionTitle } from "./TestSectionCard";
import { TestValueEntryCard } from "./TestValueEntryCard";
import { useAthleteProfile } from "./useAthleteProfile";
import { usePerformanceTests } from "./usePerformanceTests";
import { useReferenceLine, useTestName } from "./useTestLabels";
import { ValueStatusPill } from "./ValueStatusPill";

const NO_VALUES: PerformanceTestValue[] = [];

const SummaryCard: FC<{
  test: SportTest;
  values: PerformanceTestValue[];
}> = ({ test, values }) => {
  const { t, i18n } = useTranslation();
  const athlete = useAthleteProfile();
  const latest = latestResult(test, athlete, values);

  return (
    <Card
      variant="outlined"
      backgroundColor="lightGrey1"
      flexDirection="row"
      alignItems="center"
      gap={{ phone: "s", tablet: "m" }}
      padding={{ phone: "m", tablet: "l" }}
      testID="performance-test-summary"
    >
      <TestIconCircle />
      <Box flex={1} gap="xs">
        <Text
          variant="small"
          fontSize={{ phone: 14, tablet: 17 }}
          color="darkGrey1"
        >
          {t("more.performanceTests.latestValue")}
        </Text>
        <Text variant="title" fontSize={{ phone: 24, tablet: 32 }}>
          {latest
            ? formatValueWithUnit(latest.value.value, test.unit, i18n.language)
            : t("more.performanceTests.noValue")}
        </Text>
      </Box>
      {latest?.status && <ValueStatusPill status={latest.status} />}
    </Card>
  );
};

const ChartCard: FC<{
  test: SportTest;
  values: PerformanceTestValue[];
}> = ({ test, values }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const athlete = useAthleteProfile();

  if (values.length === 0) {
    return (
      <TestSectionCard testID="performance-test-no-values">
        <Text variant="body" fontSize={{ phone: 16, tablet: 20 }}>
          {t("more.performanceTests.noValuesYet")}
        </Text>
      </TestSectionCard>
    );
  }

  const points = rangeLinePoints(test, athlete, values);
  const hasRange = points.some((point) => point.range !== null);

  return (
    <TestSectionCard>
      <RangeLineChart
        points={points}
        unit={test.unit}
        testID="performance-test-chart"
      />
      <Box flexDirection="row" flexWrap="wrap" gap="xs">
        <LegendPill
          label={t("more.performanceTests.legendValues")}
          color={colors.primary}
        />
        {hasRange && (
          <LegendPill
            label={t("more.performanceTests.legendRange")}
            color={colors.success}
          />
        )}
      </Box>
    </TestSectionCard>
  );
};

const HistoryRow: FC<{
  entry: PerformanceTestValue;
  unit: string;
  index: number;
}> = ({ entry, unit, index }) => {
  const { i18n } = useTranslation();

  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      testID={`performance-test-value-${index}`}
    >
      <Text
        variant="body"
        fontSize={{ phone: 16, tablet: 20 }}
        color="darkGrey1"
      >
        {formatDateForDisplay(entry.date)}
      </Text>
      <Text
        variant="body"
        fontSize={{ phone: 16, tablet: 20 }}
        fontWeight="600"
      >
        {formatValueWithUnit(entry.value, unit, i18n.language)}
      </Text>
    </Box>
  );
};

const HistoryCard: FC<{
  unit: string;
  values: PerformanceTestValue[];
}> = ({ unit, values }) => {
  const { t } = useTranslation();

  if (values.length === 0) return null;

  return (
    <TestSectionCard>
      <TestSectionTitle title={t("more.performanceTests.yourValues")} />
      {sortNewestFirst(values).map((entry, index) => (
        <HistoryRow key={entry.id} entry={entry} unit={unit} index={index} />
      ))}
    </TestSectionCard>
  );
};

const TestDetail: FC<{ test: SportTest }> = ({ test }) => {
  const athlete = useAthleteProfile();
  const valuesKey = testValuesKey(athlete.sport, test.code);
  const values =
    usePerformanceTestValuesStore((state) => state.valuesByTest[valuesKey]) ??
    NO_VALUES;
  const name = useTestName(test.code);
  const range = referenceRangeOnDate(
    test,
    athlete,
    formatDateToISO(new Date()),
  );
  const reference = useReferenceLine(test, range);

  return (
    <HeadlineScreen title={name} heading={name} description={reference}>
      <Box gap="s">
        <SummaryCard test={test} values={values} />
        <ChartCard test={test} values={values} />
        <TestValueEntryCard test={test} valuesKey={valuesKey} />
        <HistoryCard unit={test.unit} values={values} />
      </Box>
    </HeadlineScreen>
  );
};

/** Detail of one performance test: latest value, chart, entry and history. */
export default function PerformanceTestDetailScreen() {
  const { t } = useTranslation();
  const { testCode } = useLocalSearchParams<{ testCode: string }>();
  const { state, reload } = usePerformanceTests();

  const test =
    state.status === "loaded"
      ? state.tests.find((candidate) => candidate.code === testCode)
      : undefined;
  if (test) return <TestDetail test={test} />;

  return (
    <HeadlineScreen
      title={t("more.performanceTests.title")}
      heading={t("more.performanceTests.title")}
    >
      <PerformanceTestsNotice
        kind={state.status === "loaded" ? "empty" : state.status}
        onRetry={reload}
      />
    </HeadlineScreen>
  );
}
