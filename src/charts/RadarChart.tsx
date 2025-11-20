import { FC } from "react";

type RadarChartProps = {
  adjustScales: boolean; // use same value scale for all data groups
  userSkills: { [skill: string]: number };
  additionalSkills?: { [skill: string]: number }[];
  referenceSkills?: { [skill: string]: number };
};

// FIXME: Stub implementation, to be replaced with modern charting solution in
// https://github.com/sports-athletics/sports-athletic/issues/22
export const RadarChart: FC<RadarChartProps> = (props: RadarChartProps) => {
  return null;
};
