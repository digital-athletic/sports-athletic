import { type FC } from "react";
import { ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { liveRegionProps } from "@/common/announce";
import { Box } from "@/theme/Box";
import { Button } from "@/theme/Button";
import { Card } from "@/theme/Card";
import { Text } from "@/theme/Text";

type Props = {
  kind: "loading" | "error" | "empty";
  onRetry: () => void;
};

/** What the performance test screens show instead of content: loading, load error or no tests. */
export const PerformanceTestsNotice: FC<Props> = ({ kind, onRetry }) => {
  const { t } = useTranslation();

  if (kind === "loading") {
    return (
      <ActivityIndicator
        testID="performance-tests-loading"
        accessibilityLabel={t("common.loading")}
      />
    );
  }

  if (kind === "error") {
    return (
      <Box>
        <Text
          variant="body"
          color="error"
          marginBottom="m"
          accessibilityRole="alert"
          {...liveRegionProps}
        >
          {t("more.performanceTests.loadError")}
        </Text>
        <Button testID="performance-tests-retry" onPress={onRetry}>
          {t("common.retry")}
        </Button>
      </Box>
    );
  }

  return (
    <Card
      variant="outlined"
      backgroundColor="lightGrey1"
      padding="l"
      testID="performance-tests-empty"
    >
      <Text variant="body">{t("more.performanceTests.empty")}</Text>
    </Card>
  );
};
