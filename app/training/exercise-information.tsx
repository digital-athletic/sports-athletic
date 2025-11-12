import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Exercise Information Screen
 *
 * Detailed information about exercises.
 * Accessible from training overview and active training screens.
 * Legacy: views/training/ExerciseInformation
 */
export default function ExerciseInformationScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Exercise Information</Text>
      <Text style={styles.description}>
        Detailed instructions and tips for exercises
      </Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Exercise Details</Text>
        <Text style={styles.infoText}>
          This screen would display detailed information about the selected
          exercise, including proper form, common mistakes, and video
          demonstrations.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="../">
          <PrimaryButton>Back to Training</PrimaryButton>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 40,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  infoBox: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 15,
  },
});
