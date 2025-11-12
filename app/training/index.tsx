import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Select Training Screen
 *
 * Initial screen where users choose their training session.
 * Legacy: views/training/SelectTraining (initial route)
 */
export default function SelectTrainingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Training</Text>
      <Text style={styles.description}>Choose your training session</Text>

      <View style={styles.buttonContainer}>
        <Link href="/training/muscle-soreness">
          <PrimaryButton>Start Training Session</PrimaryButton>
        </Link>

        <Link style={styles.secondaryButton} href="../">
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
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
