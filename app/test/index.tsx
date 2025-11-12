import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function TestScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Menu</Text>
      <Text style={styles.description}>
        Development and testing screens - Legacy: views/test/Test
      </Text>
      <Link href="/test/test-training" style={styles.button}>
        <Text style={styles.buttonText}>Test Training</Text>
      </Link>
      <Link href="../" style={styles.button}>
        <Text style={styles.buttonText}>Back</Text>
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
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 200,
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
