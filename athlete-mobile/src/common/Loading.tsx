import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { Box } from "../theme/Box";
import { Text } from "../theme/Text";

export interface LoadingProps {
  show: boolean;
  text: string;
  onClose?: () => void;
}

export const Loading: FC<LoadingProps> = ({ show, text, onClose }) => {
  const { t } = useTranslation();

  if (!show) {
    return null;
  }

  return (
    <Box style={styles.overlay}>
      <ActivityIndicator color="#fff" />
      <Text variant="body" style={styles.text}>
        {text}
      </Text>
      {onClose && (
        <TouchableOpacity onPress={onClose}>
          <Text variant="body" style={styles.closeText}>
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
    backgroundColor: "rgba(0,0,0,0.8)",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  text: {
    marginVertical: 16,
    fontSize: 16,
    color: "#fff",
  },
  closeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
