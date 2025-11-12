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
        <Link style={styles.primaryButton} href="/training/muscle-soreness">
          <Text style={styles.buttonText}>Start Training Session</Text>
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
  primaryButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
