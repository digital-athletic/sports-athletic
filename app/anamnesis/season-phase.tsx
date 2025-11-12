import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Season Phase Screen
 *
 * User selects current season phase.
 * Legacy: views/data/SeasonPhase
 */
export default function SeasonPhaseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Season Phase</Text>
      <Text style={styles.description}>Select your current season phase</Text>

      <Link href="/anamnesis/generating" style={styles.button}>
        <Text style={styles.buttonText}>Generate Training Plan</Text>
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
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
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
