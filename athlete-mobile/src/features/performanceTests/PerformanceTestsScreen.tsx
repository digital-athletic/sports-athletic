import { useTranslation } from "react-i18next";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { Box } from "@/theme/Box";
import { formatDateToISO } from "@/utils/date";
import { type SportTest } from "./models/SportTest";
import { PerformanceTestRow } from "./PerformanceTestRow";
import { PerformanceTestsNotice } from "./PerformanceTestsNotice";
import { referenceRangeOnDate } from "./referenceRange";
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
  const athlete = useAthleteProfile();
  const today = formatDateToISO(new Date());

  return (
    <>
      {tests.map((test) => (
        <PerformanceTestRow
          key={test.id}
          test={test}
          range={referenceRangeOnDate(test, athlete, today)}
        />
      ))}
    </>
  );
}
