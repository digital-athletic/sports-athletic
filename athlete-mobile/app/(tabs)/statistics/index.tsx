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
        justifyContent="center"
        alignItems="stretch"
        height={52}
        gap="xs"
      >
        <TouchableBox
          flex={1}
          justifyContent="center"
          alignItems="center"
          borderBottomColor="primary"
          backgroundColor="lightGrey2"
          borderBottomWidth={view === View.WORKOUTS ? 2 : 0}
          onPress={() => setView(View.WORKOUTS)}
          accessibilityRole="tab"
          accessibilityState={{ selected: view === View.WORKOUTS }}
          accessibilityLabel={t("statistics.tabs.workouts")}
        >
          <Text
            variant="title"
            style={{ fontWeight: view === View.WORKOUTS ? "bold" : "normal" }}
          >
            {t("statistics.tabs.workouts")}
          </Text>
        </TouchableBox>
        <TouchableBox
          flex={1}
          justifyContent="center"
          alignItems="center"
          borderBottomColor="primary"
          backgroundColor="lightGrey2"
          borderBottomWidth={view === View.TESTS ? 2 : 0}
          onPress={() => setView(View.TESTS)}
          accessibilityRole="tab"
          accessibilityState={{ selected: view === View.TESTS }}
          accessibilityLabel={t("statistics.tabs.powerTest")}
        >
          <Text
            variant="title"
            style={{ fontWeight: view === View.TESTS ? "bold" : "normal" }}
          >
            {t("statistics.tabs.powerTest")}
          </Text>
        </TouchableBox>
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
