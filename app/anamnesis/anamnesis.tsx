import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Anamnesis Screen
 *
 * Health questionnaire for personalized training plans.
 * Legacy: views/data/Anamnesis
 */
export default function AnamnesisScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Questionnaire</Text>
      <Text style={styles.description}>
        Answer questions about your health and fitness
      </Text>

      <Link href="/anamnesis/training-days">
        <PrimaryButton>Continue to Training Days</PrimaryButton>
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
});
