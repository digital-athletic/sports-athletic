import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function WebViewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Web View</Text>
      <Text style={styles.description}>
        In-app web browser - Legacy: views/webview/WebViewContainer (in
        MoreStack)
      </Text>
      <Link href="../" style={styles.button}>
        <Text style={styles.buttonText}>Back</Text>
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
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 10 },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
  },
});
