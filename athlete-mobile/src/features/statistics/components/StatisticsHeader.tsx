import { ScaleButton } from "@/features/statistics/components/ScaleButton";
import type { ScaleType } from "@/features/statistics/models/WorkoutsData";
import { Box } from "@/theme/Box";
import type { FC } from "react";

const SCALES: ScaleType[] = ["week", "month", "year", "total"];

interface StatisticsHeaderProps {
  scale: ScaleType;
  setScale: (scale: ScaleType) => void;
}

/** Range filters that apply to both statistics tabs. */
export const StatisticsHeader: FC<StatisticsHeaderProps> = ({
  scale,
  setScale,
}) => (
  <Box padding="l" testID="statistics-header">
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
  </Box>
);
