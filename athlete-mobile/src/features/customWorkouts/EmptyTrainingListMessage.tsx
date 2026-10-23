import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

export const EmptyTrainingListMessage: FC<PropsWithChildren> = ({
  children,
}) => {
  const { t } = useTranslation();

  return (
    <Box
      flex={1}
      backgroundColor="lightGrey1"
      justifyContent="center"
      alignItems="center"
      padding="l"
    >
      <Text
        variant="body"
        color="darkGrey1"
        textAlign="center"
        accessibilityRole="text"
      >
        {t("screens.home.additionalTrainings.noWorkouts")}
      </Text>
      {children}
    </Box>
  );
};
