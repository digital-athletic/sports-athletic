import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type ThemeColor } from "@/theme/theme";
import { type ValueStatus } from "./valueStatus";

type Props = { status: ValueStatus };

const DOT_COLORS: Record<ValueStatus, ThemeColor> = {
  IN_RANGE: "success",
  ABOVE_RANGE: "success",
  BELOW_RANGE: "warning",
};

/** The status of a value as a coloured dot with dark text, so the text keeps its contrast. */
export const ValueStatusPill: FC<Props> = ({ status }) => {
  const { t } = useTranslation();

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      alignSelf="flex-start"
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
        backgroundColor={DOT_COLORS[status]}
      />
      <Text
        variant="xSmall"
        fontSize={{ phone: 12, tablet: 15 }}
        color="darkGrey3"
      >
        {t(`more.performanceTests.status.${status}`)}
      </Text>
    </Box>
  );
};
