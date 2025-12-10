import { usePowerTestData } from "@/features/statistics/hooks/usePowerTestData";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { FC } from "react";
import { useTranslation } from "react-i18next";

type PowerTestProps = {
  isSuccessScreen: boolean;
};

// FIXME: Stub implementation, to be replaced with modern charting solution in
// https://github.com/sports-athletics/sports-athletic/issues/22
export const PowerTest: FC<PowerTestProps> = (props: PowerTestProps) => {
  const { t } = useTranslation();

  const { chartData } = usePowerTestData();

  return (
    <Box
      flex={1}
      alignSelf="stretch"
      justifyContent="center"
      alignItems="center"
      padding="l"
      backgroundColor="lightGrey3"
      borderRadius="m"
      margin="m"
    >
      <Text variant="subtitle" color="darkGrey2" textAlign="center">
        Chart: {t("statistics.powerTest.title")}
      </Text>
      <Text variant="small" color="darkGrey1" textAlign="center" marginTop="s">
        {`${Math.max(0, chartData.dates.length - 1)} ${t("statistics.powerTest.yourResults").toLowerCase()}`}
      </Text>
    </Box>
  );
};
