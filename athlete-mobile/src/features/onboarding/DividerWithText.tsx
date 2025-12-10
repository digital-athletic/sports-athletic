import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";

type Props = {
  text: string;
};

/**
 * DividerWithText Component
 *
 * Renders a horizontal divider line with centered text
 * Migrated from legacy/views/onboarding/Onboarding.js renderDivider
 */
const LINE_HEIGHT = 20;

export const DividerWithText: FC<Props> = ({ text }) => {
  return (
    <Box
      alignSelf="stretch"
      marginHorizontal="m"
      marginBottom="s"
      height={LINE_HEIGHT}
      alignItems="center"
    >
      <Box
        justifyContent="center"
        alignItems="stretch"
        position="absolute"
        top={0}
        right={0}
        bottom={0}
        left={0}
      >
        <Box height={1} backgroundColor="darkGrey2" />
      </Box>
      <Box
        backgroundColor="white"
        paddingHorizontal="xs"
        style={{ paddingTop: 2 }}
      >
        <Text
          color="darkGrey3"
          textAlign="center"
          textAlignVertical="top"
          height={LINE_HEIGHT}
          fontSize={14}
        >
          {text}
        </Text>
      </Box>
    </Box>
  );
};
