import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { type FC } from "react";
import { Image, StyleSheet } from "react-native";

/** Short advice of the coach, shown as a quiet card next to his face. */
export const CoachTip: FC<{ text: string }> = ({ text }) => (
  <Box
    flexDirection="row"
    alignItems="center"
    gap="m"
    padding="m"
    borderRadius="xl"
    backgroundColor="surfaceContainerLow"
    borderWidth={1}
    borderColor="outlineVariant"
  >
    <Image
      source={require("../../../../assets/img/coach/face.png")}
      style={styles.face}
      resizeMode="contain"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
    <Box flex={1}>
      <Text variant="small" color="onSurface">
        {text}
      </Text>
    </Box>
  </Box>
);

const styles = StyleSheet.create({
  face: {
    width: 44,
    height: 44,
  },
});
