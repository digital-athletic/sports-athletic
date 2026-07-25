import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";

export const CenteredLoading: FC = () => {
  const { t } = useTranslation();

  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      backgroundColor="white"
    >
      <Text variant="title">{t("common.loading")}</Text>
    </Box>
  );
};
