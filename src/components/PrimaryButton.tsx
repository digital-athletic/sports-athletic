import { FC, PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  color?: string;
};

export const PrimaryButton: FC<PropsWithChildren<Props>> = ({
  children,
  color,
}) => {
  const styles = useStyles(color);
  return (
    <View style={styles.primaryButton}>
      <Text style={styles.textOnPrimary}>{children}</Text>
    </View>
  );
};

const useStyles = (color?: string) =>
  StyleSheet.create({
    primaryButton: {
      backgroundColor: color ?? "#007AFF",
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      width: "100%",
    },
    textOnPrimary: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });
