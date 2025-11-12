import { PrimaryButton } from "@/components/PrimaryButton";
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
        <Link href="/training/training-success">
          <PrimaryButton color="#28a745">Complete Training</PrimaryButton>
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
  linkButton: {
    padding: 15,
    alignItems: "center",
  },
  linkButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
