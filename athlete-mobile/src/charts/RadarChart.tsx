import { UserSkills } from "@/features/statistics/models/WorkoutsData";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { FC } from "react";

type RadarChartProps = {
  adjustScales: boolean; // use same value scale for all data groups
  userSkills: UserSkills;
  additionalSkills?: { [skill: string]: number }[];
  referenceSkills?: { [skill: string]: number };
};

// FIXME: Stub implementation, to be replaced with modern charting solution in
// https://github.com/sports-athletics/sports-athletic/issues/22
export const RadarChart: FC<RadarChartProps> = (props: RadarChartProps) => {
  return (
    <Box
      backgroundColor="lightGrey3"
      height={200}
      width="100%"
      justifyContent="center"
      alignItems="center"
    >
      <Text>Radar Chart</Text>
    </Box>
  );
};
