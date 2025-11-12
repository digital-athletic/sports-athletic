import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Training Screen
 *
 * Active training execution screen.
 * Back gestures disabled to prevent accidental exits during training.
 * Legacy: views/training/Training
 */
export default function TrainingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Training in Progress</Text>
      <Text style={styles.description}>Execute your training exercises</Text>
      <Text style={styles.note}>
        ⚠️ Gestures disabled - use buttons to navigate
      </Text>

      <View style={styles.buttonContainer}>
        <Link href="/training/training-success" style={styles.primaryButton}>
          <Text style={styles.buttonText}>Complete Training</Text>
        </Link>

        <Link href="/training/exercise-information" style={styles.linkButton}>
          <Text style={styles.linkButtonText}>Exercise Information</Text>
        </Link>
      </View>
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
    marginBottom: 10,
  },
  note: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  primaryButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  linkButton: {
    padding: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
