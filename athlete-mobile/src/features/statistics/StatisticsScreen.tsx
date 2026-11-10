import { PowerTest } from "@/features/statistics/components/PowerTest";
import { StatisticsHeader } from "@/features/statistics/components/StatisticsHeader";
import { Workouts } from "@/features/statistics/components/Workouts";
import type { ExportKind } from "@/features/statistics/models/statisticsCsv";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { Box } from "@/theme/Box";
import { ScrollBox } from "@/theme/ScrollBox";
import { useState, type FC } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Statistics Screen
 * User statistics and progress tracking. The toggle, the range chips and the
 * CSV export in the header apply to both views.
 */
export const StatisticsScreen: FC = () => {
  const [kind, setKind] = useState<ExportKind>("workouts");
  const [scale, setScale] = useState<ScaleType>("total");
  const { top } = useSafeAreaInsets();

  return (
    <ScrollBox flex={1} backgroundColor="white" style={{ marginTop: top }}>
      <StatisticsHeader
        kind={kind}
        onKindChange={setKind}
        scale={scale}
        setScale={setScale}
      />
      <Box
        flex={4}
        flexDirection="column"
        justifyContent="center"
        alignItems="stretch"
      >
        {kind === "workouts" ? (
          <Workouts scale={scale} />
        ) : (
          <PowerTest scale={scale} />
        )}
      </Box>
    </ScrollBox>
  );
};
