import { PowerTest } from "@/features/statistics/components/PowerTest";
import { Workouts } from "@/features/statistics/components/Workouts";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { Text } from "@/theme/Text";
import { TouchableBox } from "@/theme/TouchableBox";
import { useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

enum View {
  WORKOUTS = 0,
  TESTS = 1,
}

const TABS = [
  {
    view: View.WORKOUTS,
    labelKey: "statistics.tabs.workouts",
    testID: "statistics-tab-workouts",
  },
  {
    view: View.TESTS,
    labelKey: "statistics.tabs.powerTest",
    testID: "statistics-tab-tests",
  },
] as const;

/**
 * Statistics Screen
 * User statistics and progress tracking with tabbed navigation.
 */
const StatisticsScreen: FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<View>(View.WORKOUTS);
  const { top } = useSafeAreaInsets();

  return (
    <ScrollBox flex={1} backgroundColor="lightGrey1" style={{ marginTop: top }}>
      <Box
        flexDirection="row"
        alignItems="stretch"
        height={52}
        backgroundColor="white"
        borderBottomWidth={1}
        borderBottomColor="lightGrey2"
      >
        {TABS.map(({ view: tabView, labelKey, testID }) => {
          const isActive = view === tabView;
          return (
            <TouchableBox
              key={tabView}
              flex={1}
              justifyContent="center"
              alignItems="center"
              borderBottomColor="primary"
              borderBottomWidth={isActive ? 3 : 0}
              onPress={() => setView(tabView)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t(labelKey)}
              testID={testID}
            >
              <Text
                fontSize={17}
                fontWeight={isActive ? "700" : "500"}
                color={isActive ? "primary" : "darkGrey1"}
              >
                {t(labelKey)}
              </Text>
            </TouchableBox>
          );
        })}
      </Box>
      <Box
        flex={4}
        flexDirection="column"
        justifyContent="center"
        alignItems="stretch"
      >
        {view === View.WORKOUTS ? <Workouts /> : <PowerTest />}
      </Box>
    </ScrollBox>
  );
};

export default StatisticsScreen;
