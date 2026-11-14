import { ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { liveRegionProps } from "@/common/announce";
import { HeadlineScreen } from "@/common/HeadlineScreen";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";
import { type SportTest } from "./models/SportTest";
import { PerformanceTestRow } from "./PerformanceTestRow";
import { referenceRangeFor } from "./referenceRange";
import { trainingStageFor } from "./trainingStage";
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
        {state.status === "loading" && (
          <ActivityIndicator
            testID="performance-tests-loading"
            accessibilityLabel={t("common.loading")}
          />
        )}

        {state.status === "error" && (
          <Box>
            <Text
              variant="body"
              color="error"
              marginBottom="m"
              accessibilityRole="alert"
              {...liveRegionProps}
            >
              {t("more.performanceTests.loadError")}
            </Text>
            <Button testID="performance-tests-retry" onPress={reload}>
              {t("common.retry")}
            </Button>
          </Box>
        )}

        {state.status === "loaded" && state.tests.length === 0 && (
          <Card
            variant="outlined"
            backgroundColor="lightGrey1"
            padding="l"
            testID="performance-tests-empty"
          >
            <Text variant="body">{t("more.performanceTests.empty")}</Text>
          </Card>
        )}

        {state.status === "loaded" && state.tests.length > 0 && (
          <PerformanceTestList tests={state.tests} />
        )}
      </Box>
    </HeadlineScreen>
  );
}

function PerformanceTestList({ tests }: { tests: SportTest[] }) {
  const sport = useUserWorkoutStore((state) => state.workoutData.sport);
  const position = useUserWorkoutStore(
    (state) => state.workoutData.tags.POSITION?.[0],
  );
  const gender = useUserProfileStore((state) => state.personalData.gender);
  const age = useUserProfileStore((state) => state.getAge());
  const trainingStage = trainingStageFor(sport, gender, age);

  return (
    <>
      {tests.map((test) => (
        <PerformanceTestRow
          key={test.id}
          test={test}
          range={referenceRangeFor(test, { gender, position, trainingStage })}
        />
      ))}
    </>
  );
}
