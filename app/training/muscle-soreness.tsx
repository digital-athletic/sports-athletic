import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Muscle Soreness Screen
 *
 * User reports muscle soreness before training.
 * Legacy: views/training/MuscleSoreness
 */
export default function MuscleSorenessScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muscle Soreness</Text>
      <Text style={styles.description}>
        Report any muscle soreness before training
      </Text>

      <View style={styles.buttonContainer}>
        <Link href="/training/training-overview">
          <PrimaryButton>Continue to Overview</PrimaryButton>
        </Link>

        <Link href="../" style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back</Text>
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
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
