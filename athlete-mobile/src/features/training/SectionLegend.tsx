import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";

export const SectionLegend: FC = () => {
  const { t } = useTranslation();

  return (
    <Box justifyContent="space-between" flexDirection="column">
      <Text variant="xSmall" textAlign="center" padding="s" color="white">
        {t("training.status.week")}
      </Text>
      <Box alignSelf="stretch" marginBottom="l" style={styles.rotatedText}>
        <Text variant="xSmall" textAlign="center" padding="s" color="white">
          {t("training.status.intensity")}
        </Text>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  rotatedText: {
    transform: [{ rotateZ: "270deg" }],
  },
});
