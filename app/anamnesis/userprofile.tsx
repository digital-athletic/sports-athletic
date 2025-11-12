import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

/**
 * User Profile Screen
 *
 * User enters basic profile information.
 * Legacy: views/data/Userprofile
 */
export default function UserprofileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.description}>Enter your profile information</Text>

      <Link href="/anamnesis/anamnesis" style={styles.button}>
        <Text style={styles.buttonText}>Continue to Anamnesis</Text>
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
