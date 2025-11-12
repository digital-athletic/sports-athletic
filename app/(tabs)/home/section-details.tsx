import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Section Details Screen
 *
 * Detailed view of a training section with exercises and information.
 * Legacy: views/home/pages/SectionDetails
 */
export default function SectionDetailsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Section Details</Text>
      <Text style={styles.description}>
        Detailed view of training sections with exercises and instructions
      </Text>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Training Section Information</Text>
        <Text style={styles.sectionText}>
          This screen would display detailed information about a specific
          training section, including exercises, duration, difficulty, and
          instructions.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="/training">
          <PrimaryButton>Start This Section</PrimaryButton>
        </Link>

        <Link href="../" style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
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
    marginTop: 40,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  sectionBox: {
    backgroundColor: "#f5f5f5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  buttonContainer: {
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
