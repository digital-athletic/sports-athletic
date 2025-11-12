import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Training Success Screen
 *
 * Training completion summary and celebration.
 * Back gestures disabled to ensure controlled flow.
 * Legacy: views/training/TrainingSuccess
 */
export default function TrainingSuccessScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Training Complete!</Text>
      <Text style={styles.description}>
        Great job completing your training session
      </Text>
      <Text style={styles.note}>
        ⚠️ Gestures disabled - use buttons to navigate
      </Text>

      <View style={styles.buttonContainer}>
        <Link href="/(tabs)" replace>
          <PrimaryButton color="#28a745">Return to Home</PrimaryButton>
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
  emoji: {
    fontSize: 64,
    marginBottom: 20,
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
});
