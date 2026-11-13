import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { Box } from "../theme/Box";
import { Text } from "../theme/Text";
import { useTheme } from "../theme/theme";

export interface LoadingProps {
  show: boolean;
  text: string;
  onClose?: () => void;
}

export const Loading: FC<LoadingProps> = ({ show, text, onClose }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!show) {
    return null;
  }

  return (
    <Box style={styles.overlay}>
      <Box
        style={StyleSheet.absoluteFill}
        backgroundColor="scrim"
        opacity={0.8}
      />
      <ActivityIndicator color={colors.white} />
      <Text variant="body" color="white" style={styles.text}>
        {text}
      </Text>
      {onClose && (
        <TouchableOpacity onPress={onClose}>
          <Text variant="body" color="white" style={styles.closeText}>
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>
      )}
    </Box>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  text: {
    marginVertical: 16,
    fontSize: 16,
  },
  closeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
