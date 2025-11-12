import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Onboarding Screen
 *
 * Main onboarding screen for first-time users.
 * Legacy: views/onboarding/Onboarding
 */
export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding</Text>
      <Text style={styles.description}>
        First-time user experience and app introduction
      </Text>

      <View style={styles.buttonContainer}>
        <Link href="/onboarding/webview" style={styles.button}>
          <Text style={styles.buttonText}>View Web Content</Text>
        </Link>

        <Link href="/anamnesis" style={styles.button}>
          <Text style={styles.buttonText}>Continue to Anamnesis</Text>
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
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
