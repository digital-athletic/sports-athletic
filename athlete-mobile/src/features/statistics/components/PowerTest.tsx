import { PowerTest as Chart } from "@/charts/PowerTest";
import { Alert } from "@/common/Alert";
import { Coaching } from "@/common/Coaching";
import { Ionicon } from "@/common/Ionicon";
import { useAgeGroup } from "@/features/anamnesis/useAgeGroup";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { MaxValuesType } from "@/features/training/models/MaxValues";
import { canTakeStrengthTest } from "@/features/training/utils/strengthTestUtils";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import { formatDateForDisplay } from "@/utils/date";
import { useRouter } from "expo-router";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, TouchableOpacity } from "react-native";
import { usePowerTestData } from "../hooks/usePowerTestData";

interface PowerTestProps {
  isSuccessScreen?: boolean;
  /** Undefined shows the whole history. */
  scale?: ScaleType;
}

/**
 * Power Test Statistics Component
 *
 * Displays power test history with chart visualization and results list.
 */
export const PowerTest: FC<PowerTestProps> = ({
  isSuccessScreen = false,
  scale,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const strengthTestAllowed = canTakeStrengthTest(useAgeGroup());

  const {
    sortedHistory,
    hasHistory,
    hasChartData,
    anamnesisCompleted,
    toggleHistoryEntry,
    isEntryExpanded,
  } = usePowerTestData({ expandFirstEntry: isSuccessScreen, scale });

  const startTestWorkout = () => {
    if (anamnesisCompleted) {
      router.push({
        pathname: "/training/muscle-soreness",
        params: { type: "TEST_WORKOUT", originPath: "/(tabs)/statistics" },
      });
    } else {
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
    }
  };

  const renderChart = () => {
    if (!hasChartData) {
      return (
        <Box alignSelf="stretch" padding="l">
          <Coaching text={t("statistics.powerTest.gymOnly")} />
        </Box>
      );
    }

    return <Chart scale={scale} />;
  };

  const renderLegend = () => {
    if (!hasHistory) return null;

    return (
      <Box
        alignSelf="stretch"
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="center"
        alignItems="center"
      >
        <Text variant="small" padding="xs" style={{ color: colors.squad }}>
          {t("statistics.powerTest.legendSquad")}
        </Text>
        <Text variant="small" padding="xs" style={{ color: colors.deadlift }}>
          {t("statistics.powerTest.legendDeadlift")}
        </Text>
        <Text variant="small" padding="xs" style={{ color: colors.benchPress }}>
          {t("statistics.powerTest.legendBenchPress")}
        </Text>
        <Text variant="small" padding="xs" style={{ color: colors.rowing }}>
          {t("statistics.powerTest.legendRowing")}
        </Text>
        <Text
          variant="small"
          padding="xs"
          style={{ color: colors.shoulderPress }}
        >
          {t("statistics.powerTest.legendShoulderPress")}
        </Text>
      </Box>
    );
  };

  const renderStartTestButton = () => {
    if (isSuccessScreen || !strengthTestAllowed) return null;

    return (
      <TouchableOpacity
        onPress={startTestWorkout}
        accessibilityLabel={t("statistics.powerTest.startNewTest")}
        accessibilityRole="button"
        testID="power-test-start-button"
      >
        <Box
          alignSelf="stretch"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          margin="l"
          padding="m"
          borderRadius="m"
          backgroundColor="primary"
        >
          <Text variant="button" color="white">
            {t("statistics.powerTest.startNewTest")}
          </Text>
        </Box>
      </TouchableOpacity>
    );
  };

  const navigateToManualInput = () => {
    if (anamnesisCompleted) {
      router.push("/training/manual-strength-test");
    } else {
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
    }
  };

  const renderManualInputButton = () => {
    if (isSuccessScreen || !strengthTestAllowed) return null;

    return (
      <TouchableOpacity
        onPress={navigateToManualInput}
        accessibilityLabel={t("statistics.powerTest.enterManually")}
        accessibilityRole="button"
        testID="power-test-manual-input-button"
      >
        <Box
          alignSelf="stretch"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          marginHorizontal="l"
          marginBottom="l"
          padding="m"
          borderRadius="m"
          borderWidth={1}
          borderColor="primary"
        >
          <Text variant="button" color="primary">
            {t("statistics.powerTest.enterManually")}
          </Text>
        </Box>
      </TouchableOpacity>
    );
  };

  const renderHistoryEntry = ({
    item,
    index,
  }: {
    item: MaxValuesType;
    index: number;
  }) => {
    const visible = isEntryExpanded(index);
    const iconName = visible ? "chevron-up" : "chevron-down";
    const date = formatDateForDisplay(new Date(item.testAt));

    const formatWeight = (value: number | undefined) =>
      `${Math.round((value ?? 0) * 2) / 2} kg`;

    return (
      <Box
        flexDirection="row"
        alignItems="stretch"
        width="100%"
        testID={`power-test-entry-${index}`}
      >
        <Box
          flex={1}
          width="100%"
          alignSelf="stretch"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          borderTopWidth={1}
          borderColor="lightGrey2"
          marginHorizontal="l"
        >
          <TouchableOpacity
            onPress={() => toggleHistoryEntry(index)}
            style={{
              height: 48,
              alignSelf: "stretch",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            accessibilityLabel={t("statistics.powerTest.toggleEntry", { date })}
            accessibilityRole="button"
            accessibilityState={{ expanded: visible }}
          >
            <Text variant="body">{date}</Text>
            <Ionicon
              name={iconName}
              size={20}
              color={colors.darkGrey3}
              decorative
            />
          </TouchableOpacity>

          {visible && (
            <>
              <Box
                height={36}
                alignSelf="stretch"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text variant="body" style={{ color: colors.squad }}>
                  {t("statistics.powerTest.squad")}
                </Text>
                <Text variant="body" style={{ color: colors.squad }}>
                  {formatWeight(item.kneeDominant.barbell)}
                </Text>
              </Box>
              <Box
                height={36}
                alignSelf="stretch"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text variant="body" style={{ color: colors.deadlift }}>
                  {t("statistics.powerTest.deadlift")}
                </Text>
                <Text variant="body" style={{ color: colors.deadlift }}>
                  {formatWeight(item.hipHinge.barbell)}
                </Text>
              </Box>
              <Box
                height={36}
                alignSelf="stretch"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text variant="body" style={{ color: colors.benchPress }}>
                  {t("statistics.powerTest.benchPress")}
                </Text>
                <Text variant="body" style={{ color: colors.benchPress }}>
                  {formatWeight(item.horizontalPush.barbell)}
                </Text>
              </Box>
              <Box
                height={36}
                alignSelf="stretch"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text variant="body" style={{ color: colors.rowing }}>
                  {t("statistics.powerTest.rowing")}
                </Text>
                <Text variant="body" style={{ color: colors.rowing }}>
                  {formatWeight(item.horizontalPull.barbell)}
                </Text>
              </Box>
              <Box
                height={36}
                alignSelf="stretch"
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Text variant="body" style={{ color: colors.shoulderPress }}>
                  {t("statistics.powerTest.shoulderPress")}
                </Text>
                <Text variant="body" style={{ color: colors.shoulderPress }}>
                  {formatWeight(item.verticalPush.barbell)}
                </Text>
              </Box>
            </>
          )}
        </Box>
      </Box>
    );
  };

  const renderHistory = () => {
    if (!hasHistory) {
      return (
        <Box
          flex={1}
          alignSelf="stretch"
          justifyContent="center"
          alignItems="center"
          testID="power-test-no-results"
        >
          <Text variant="subtitle" padding="l" color="darkGrey2">
            {t("statistics.powerTest.noTestYet")}
          </Text>
        </Box>
      );
    }

    return (
      <Box
        flex={1}
        alignSelf="stretch"
        justifyContent="center"
        alignItems="center"
        testID="power-test-results-container"
      >
        <Text variant="title" padding="m" alignSelf="stretch" color="darkGrey3">
          {t("statistics.powerTest.yourResults")}
        </Text>
        <FlatList
          // TODO: rethink screen nesting in regards to outer scrollbox in the statistics index screen
          scrollEnabled={false}
          disableVirtualization
          data={sortedHistory}
          renderItem={renderHistoryEntry}
          keyExtractor={(item, index) => `${item.testAt}-${index}`}
          initialNumToRender={10}
          style={{ width: "100%" }}
          testID="power-test-results-list"
        />
      </Box>
    );
  };

  return (
    <Box
      flex={1}
      justifyContent="flex-start"
      alignItems="stretch"
      testID="power-test-container"
    >
      {renderChart()}
      {renderLegend()}
      {renderStartTestButton()}
      {renderManualInputButton()}
      {renderHistory()}
    </Box>
  );
};
