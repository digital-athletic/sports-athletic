import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ImprintScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Imprint</Text>
      <Text style={styles.description}>
        Legal imprint - Legacy: views/more/pages/Imprint
      </Text>
      <Link href="../">
        <PrimaryButton>Back</PrimaryButton>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 10 },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
});
