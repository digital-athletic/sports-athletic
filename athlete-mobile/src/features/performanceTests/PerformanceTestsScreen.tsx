import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { Box } from "@/theme/Box";
import { formatDateToISO } from "@/utils/date";
import { type SportTest } from "./models/SportTest";
import { PerformanceTestRow } from "./PerformanceTestRow";
import { PerformanceTestsNotice } from "./PerformanceTestsNotice";
import { referenceRangeOnDate } from "./referenceRange";
import { latestResult, testValuesKey } from "./testValues";
import { useAthleteProfile } from "./useAthleteProfile";
import { usePerformanceTests } from "./usePerformanceTests";

/** Lists the performance tests of the athlete's sport with the athlete's reference range. */
export default function PerformanceTestsScreen() {
  const { t } = useTranslation();
  const { state, reload } = usePerformanceTests();

  return (
    <HeadlineScreen
      title={t("more.performanceTests.title")}
      heading={t("more.performanceTests.title")}
      description={t("more.performanceTests.description")}
    >
      <Box gap="s">
        {state.status !== "loaded" && (
          <PerformanceTestsNotice kind={state.status} onRetry={reload} />
        )}

        {state.status === "loaded" && state.tests.length === 0 && (
          <PerformanceTestsNotice kind="empty" onRetry={reload} />
        )}

        {state.status === "loaded" && state.tests.length > 0 && (
          <PerformanceTestList tests={state.tests} />
        )}
      </Box>
    </HeadlineScreen>
  );
}

function PerformanceTestList({ tests }: { tests: SportTest[] }) {
  const router = useRouter();
  const athlete = useAthleteProfile();
  const valuesByTest = usePerformanceTestValuesStore(
    (state) => state.valuesByTest,
  );
  const today = formatDateToISO(new Date());

  const openDetail = (testCode: string) => {
    router.navigate({
      pathname: "/(tabs)/(more)/performance-test/[testCode]",
      params: { testCode },
    });
  };

  return (
    <>
      {tests.map((test) => {
        const values = valuesByTest[testValuesKey(athlete.sport, test.code)];
        return (
          <PerformanceTestRow
            key={test.id}
            test={test}
            range={referenceRangeOnDate(test, athlete, today)}
            latest={latestResult(test, athlete, values ?? [])}
            onPress={() => openDetail(test.code)}
          />
        );
      })}
    </>
  );
}
