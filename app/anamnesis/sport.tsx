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

      <Link href="/anamnesis/userprofile" style={styles.button}>
        <Text style={styles.buttonText}>Continue to Profile</Text>
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
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 200,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
