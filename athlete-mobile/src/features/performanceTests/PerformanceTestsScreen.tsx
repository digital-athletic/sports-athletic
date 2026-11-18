import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { SelectMenu } from "@/form/SelectMenu";
import { usePerformanceTestValuesStore } from "@/store/performanceTestValuesStore";
import { Box } from "@/theme/Box";
import { formatDateToISO } from "@/utils/date";
import { type SportTest } from "./models/SportTest";
import { PerformanceTestRow } from "./PerformanceTestRow";
import { PerformanceTestsExportButton } from "./PerformanceTestsExportButton";
import { PerformanceTestsNotice } from "./PerformanceTestsNotice";
import { referenceRangeOnDate } from "./referenceRange";
import {
  categoriesOfTests,
  filterTestsByCategory,
  resolveCategoryLabel,
} from "./testCategories";
import { latestResult, valuesOfTest } from "./testValues";
import { useAthleteProfile } from "./useAthleteProfile";
import { usePerformanceTests } from "./usePerformanceTests";

/** Value of the "All categories" option. The database rejects blank categories, so no category can equal it. */
const ALL_CATEGORIES = "";

/** Lists the performance tests of every sport with the athlete's reference range. */
export default function PerformanceTestsScreen() {
  const { t } = useTranslation();
  const { state, reload } = usePerformanceTests();

  return (
    <HeadlineScreen
      title={t("more.performanceTests.title")}
      heading={t("more.performanceTests.title")}
      description={t("more.performanceTests.description")}
      headerRight={
        <PerformanceTestsExportButton
          tests={state.status === "loaded" ? state.tests : []}
        />
      }
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
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();
  const athlete = useAthleteProfile();
  const values = usePerformanceTestValuesStore((state) => state.values);
  const today = formatDateToISO(new Date());

  const openDetail = (testCode: string) => {
    router.navigate({
      pathname: "/(tabs)/(more)/performance-test/[testCode]",
      params: { testCode },
    });
  };

  const categories = categoriesOfTests(tests);
  // A guarded state update during render clears a selected category that is
  // missing from the loaded tests, so the list shows all categories. When a
  // later load brings the category back, the category stays unselected.
  const isStale = selected !== null && !categories.includes(selected);
  if (isStale) setSelected(null);
  const activeCategory = isStale ? null : selected;
  const options = [
    { value: ALL_CATEGORIES, label: t("more.performanceTests.allCategories") },
    ...categories.map((category) => ({
      value: category,
      label: resolveCategoryLabel(category, t),
    })),
  ];

  return (
    <>
      <SelectMenu
        options={options}
        value={activeCategory ?? ALL_CATEGORIES}
        onChange={(value) =>
          setSelected(value === ALL_CATEGORIES ? null : value)
        }
        accessibilityLabel={t("more.performanceTests.categoryFilter")}
      />
      {filterTestsByCategory(tests, activeCategory).map((test) => (
        <PerformanceTestRow
          key={test.id}
          test={test}
          range={referenceRangeOnDate(test, athlete, today)}
          latest={latestResult(
            test,
            athlete,
            valuesOfTest(values, athlete.sport, test.code),
          )}
          onPress={() => openDetail(test.code)}
        />
      ))}
    </>
  );
}
