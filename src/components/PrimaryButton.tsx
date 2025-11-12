import { FC, PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

export const PrimaryButton: FC<PropsWithChildren> = ({ children }) => {
  return (
    <View style={styles.primaryButton}>
      <Text style={styles.textOnPrimary}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  textOnPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
