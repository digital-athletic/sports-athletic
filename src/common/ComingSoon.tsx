import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

type Props = Record<string, never>;

/**
 * Placeholder component displayed for features coming soon.
 * Shows centered text with border styling.
 */
export const ComingSoon: FC<Props> = () => {
  const { t } = useTranslation();

  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      alignSelf="stretch"
      paddingHorizontal="m"
    >
      <Box
        justifyContent="center"
        alignItems="center"
        alignSelf="stretch"
        paddingVertical="l"
        borderRadius="m"
        borderWidth={1}
        borderColor={"darkGrey1"}
      >
        <Text variant="title" color="primary" textAlign="center">
          {t("common.comingSoon")}
        </Text>
      </Box>
    </Box>
  );
};

export default ComingSoon;
