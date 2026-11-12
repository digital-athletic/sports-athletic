import { useAgeGroup } from "@/features/anamnesis/useAgeGroup";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import { canTakeStrengthTest } from "@/features/training/utils/strengthTestUtils";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Text } from "@/theme/Text";
import { useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { usePowerTestData } from "../hooks/usePowerTestData";
import { PowerTestChartCard } from "./PowerTestChartCard";
import { PowerTestResultCard } from "./PowerTestResultCard";

interface PowerTestProps {
  isSuccessScreen?: boolean;
  /** Undefined shows the whole history. */
  scale?: ScaleType;
}

interface PowerTestResultsProps {
  history: MaxValuesType[];
  isEntryExpanded: (index: number) => boolean;
  onToggleEntry: (index: number) => void;
}

/** The results label with one expandable card per result, or the empty state. */
const PowerTestResults: FC<PowerTestResultsProps> = ({
  history,
  isEntryExpanded,
  onToggleEntry,
}) => {
  const { t } = useTranslation();

  if (history.length === 0) {
    return (
      <Box alignItems="center" testID="power-test-no-results">
        <Text variant="subtitle" textAlign="center" color="onSurfaceVariant">
          {t("statistics.powerTest.noTestYet")}
        </Text>
      </Box>
    );
  }

  return (
    <Box gap="s" testID="power-test-results-container">
      <Text variant="sectionLabel" accessibilityRole="header">
        {t("statistics.powerTest.yourResults")}
      </Text>
      <Box gap="s" testID="power-test-results-list">
        {history.map((item, index) => (
          <PowerTestResultCard
            key={`${item.testAt}-${index}`}
            result={item}
            expanded={isEntryExpanded(index)}
            onToggle={() => onToggleEntry(index)}
            testID={`power-test-entry-${index}`}
          />
        ))}
      </Box>
    </Box>
  );
};

/** Start and manual entry of a strength test, both pill shaped. */
const PowerTestActions: FC<{ anamnesisCompleted: boolean }> = ({
  anamnesisCompleted,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const runWithAnamnesis = (action: () => void) => {
    if (anamnesisCompleted) return action();
    Alert.alert(
      t("statistics.powerTest.testNotPossible"),
      t("statistics.powerTest.anamnesisNeeded"),
      [
        { text: t("common.ok"), onPress: () => {} },
        {
          text: t("statistics.powerTest.startNow"),
          onPress: () => router.replace("/anamnesis"),
        },
      ],
    );
  };

  return (
    <Box gap="s">
      <Button
        variant="cta"
        onPress={() =>
          runWithAnamnesis(() =>
            router.push({
              pathname: "/training/muscle-soreness",
              params: { type: "TEST_WORKOUT" },
            }),
          )
        }
        accessibilityLabel={t("statistics.powerTest.startNewTest")}
        testID="power-test-start-button"
      >
        {t("statistics.powerTest.startNewTest")}
      </Button>
      <Button
        variant="ctaOutline"
        onPress={() =>
          runWithAnamnesis(() => router.push("/training/manual-strength-test"))
        }
        accessibilityLabel={t("statistics.powerTest.enterManually")}
        testID="power-test-manual-input-button"
      >
        {t("statistics.powerTest.enterManually")}
      </Button>
    </Box>
  );
};

/**
 * Power Test Statistics Component
 *
 * Displays power test history with chart visualization and results list.
 */
export const PowerTest: FC<PowerTestProps> = ({
  isSuccessScreen = false,
  scale,
}) => {
  const strengthTestAllowed = canTakeStrengthTest(useAgeGroup());
  const {
    sortedHistory,
    hasChartData,
    anamnesisCompleted,
    toggleHistoryEntry,
    isEntryExpanded,
  } = usePowerTestData({ expandFirstEntry: isSuccessScreen, scale });

  return (
    <Box
      flex={1}
      gap="m"
      paddingHorizontal="m"
      paddingTop="s"
      paddingBottom="l"
      testID="power-test-container"
    >
      <PowerTestChartCard hasChartData={hasChartData} scale={scale} />
      {!isSuccessScreen && strengthTestAllowed && (
        <PowerTestActions anamnesisCompleted={anamnesisCompleted} />
      )}
      <PowerTestResults
        history={sortedHistory}
        isEntryExpanded={isEntryExpanded}
        onToggleEntry={toggleHistoryEntry}
      />
    </Box>
  );
};
