import { PrimaryButton } from "@/components/PrimaryButton";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * Sport Selection Screen
 *
 * User selects their primary sport.
 * Legacy: views/data/Sport (initial route in AnamnesisStack)
 */
export default function SportScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Sport</Text>
      <Text style={styles.description}>Choose your primary sport</Text>

      <Link href="/anamnesis/userprofile">
        <PrimaryButton>Continue to Profile</PrimaryButton>
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
