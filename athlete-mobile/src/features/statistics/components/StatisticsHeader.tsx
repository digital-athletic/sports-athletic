import { ScaleButton } from "@/features/statistics/components/ScaleButton";
import { StatisticsExportButton } from "@/features/statistics/components/StatisticsExportButton";
import type { ExportKind } from "@/features/statistics/models/statisticsCsv";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { Box } from "@/theme/Box";
import type { FC } from "react";

const SCALES: ScaleType[] = ["week", "month", "year", "total"];

interface StatisticsHeaderProps {
  kind: ExportKind;
  scale: ScaleType;
  setScale: (scale: ScaleType) => void;
}

/** Range filters, with the CSV export on its own row below them. */
export const StatisticsHeader: FC<StatisticsHeaderProps> = ({
  kind,
  scale,
  setScale,
}) => (
  <Box padding="l" paddingBottom="s" testID="statistics-header">
    <Box flexDirection="row" justifyContent="center" alignItems="center">
      {SCALES.map((option) => (
        <ScaleButton
          key={option}
          isActive={scale === option}
          scale={option}
          setScale={setScale}
        />
      ))}
    </Box>
    <Box alignItems="flex-end" marginTop="s">
      <StatisticsExportButton kind={kind} scale={scale} />
    </Box>
  </Box>
);
