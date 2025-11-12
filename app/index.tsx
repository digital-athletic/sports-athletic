import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Root Index Screen
 *
 * Entry point for navigation - simulates the Switch Navigator logic
 * from the legacy app. In production, this would check user state
 * and automatically route to the appropriate flow.
 */
export default function IndexScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sports Athletic</Text>
      <Text style={styles.subtitle}>Navigation Demo</Text>
      <Text style={styles.description}>
        Select a flow to explore the navigation hierarchy
      </Text>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Main App Flow</Text>
          <Text style={styles.cardDescription}>
            Navigate to the main tab-based interface with Home, Statistics, and
            Profile tabs.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.buttonText}>Go to Main App</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>👋 Onboarding Flow</Text>
          <Text style={styles.cardDescription}>
            First-time user experience and app introduction.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/onboarding")}
          >
            <Text style={styles.buttonText}>Start Onboarding</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Anamnesis Flow</Text>
          <Text style={styles.cardDescription}>
            User profile setup and health questionnaire.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/anamnesis")}
          >
            <Text style={styles.buttonText}>Start Anamnesis</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💪 Training Flow</Text>
          <Text style={styles.cardDescription}>
            Active training session with navigation buttons (Select → Soreness →
            Overview → Training → Success).
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/training")}
          >
            <Text style={styles.buttonText}>Start Training</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧪 Other Flows</Text>
          <Text style={styles.cardDescription}>
            Access test screens, web view, video player, and contact modal.
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => router.push("/test")}
            >
              <Text style={styles.quickButtonText}>Test</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => router.push("/webview")}
            >
              <Text style={styles.quickButtonText}>WebView</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => router.push("/video-player")}
            >
              <Text style={styles.quickButtonText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => router.push("/contact")}
            >
              <Text style={styles.quickButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 5,
    color: "#007AFF",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  cardContainer: {
    gap: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  quickButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
