import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

/**
 * Generating Screen
 *
 * Training plan generation loading screen.
 * Legacy: views/data/Generating
 */
export default function GeneratingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.title}>Generating Training Plan</Text>
      <Text style={styles.description}>
        Creating your personalized training plan...
      </Text>

      <Link href="/(tabs)" replace>
        <PrimaryButton>Complete Setup</PrimaryButton>
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
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
});
