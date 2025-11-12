import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Training Days Screen
 *
 * User selects available training days.
 * Legacy: views/data/TrainingDays
 */
export default function TrainingDaysScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Training Days</Text>
      <Text style={styles.description}>
        Select your available training days
      </Text>

      <Link href="/anamnesis/season-phase" style={styles.button}>
        <Text style={styles.buttonText}>Continue to Season Phase</Text>
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
