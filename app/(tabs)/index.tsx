import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Home Screen (Training Tab)
 *
 * Main training dashboard showing available training sections.
 * Legacy: views/home/Home (HomeStack initial route)
 */
export default function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Training Home</Text>
      <Text style={styles.subtitle}>Your personalized training dashboard</Text>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today&apos;s Training</Text>
          <Text style={styles.cardDescription}>Start your daily workout</Text>
          <Link href="/training" style={styles.cardButton}>
            <Text style={styles.cardButtonText}>Start Training</Text>
          </Link>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Training Sections</Text>
          <Text style={styles.cardDescription}>Browse training categories</Text>
          <Link href="/home/section-details" style={styles.cardButton}>
            <Text style={styles.cardButtonText}>View Sections</Text>
          </Link>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Link href="/webview" style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>Web View</Text>
            </Link>
            <Link href="/video-player" style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>Video Player</Text>
            </Link>
            <Link href="/contact" style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>Contact</Text>
            </Link>
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
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
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
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  cardButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cardButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  quickActionButton: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  quickActionText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
