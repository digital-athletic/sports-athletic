import { type FC } from "react";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";

type LegendPillProps = { label: string; color: string };

/** A chart legend entry: a coloured dot and its label in a small pill. */
export const LegendPill: FC<LegendPillProps> = ({ label, color }) => (
  <Box
    flexDirection="row"
    alignItems="center"
    gap="xs"
    paddingHorizontal="s"
    paddingVertical="xs"
    borderRadius="round"
    backgroundColor="surfaceSubtle"
  >
    <Box
      width={8}
      height={8}
      borderRadius="round"
      style={{ backgroundColor: color }}
    />
    <Text variant="xSmall" color="darkGrey3">
      {label}
    </Text>
  </Box>
);
