import { RadarChart } from "@/charts/RadarChart";
import { Card } from "@/theme/Card";
import { type ComponentProps, type FC } from "react";

type RadarChartCardProps = ComponentProps<typeof RadarChart>;

/** The skill radar chart on a light grey card. */
export const RadarChartCard: FC<RadarChartCardProps> = (props) => (
  <Card
    variant="outlined"
    backgroundColor="lightGrey1"
    alignItems="center"
    paddingVertical="s"
  >
    <RadarChart {...props} />
  </Card>
);
