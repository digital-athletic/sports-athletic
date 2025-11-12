import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * More/Profile Menu Screen
 *
 * Main menu and profile hub.
 * Legacy: views/more/More
 */
export default function MoreScreen() {
  const menuItems = [
    { title: "Profile", icon: "person-outline", route: "/profile/profile" },
    { title: "Settings", icon: "settings-outline", route: "/profile/settings" },
    {
      title: "Exercises",
      icon: "barbell-outline",
      route: "/profile/exercises",
    },
    {
      title: "Tutorials",
      icon: "school-outline",
      route: "/profile/tutorials",
    },
    {
      title: "Equipment",
      icon: "fitness-outline",
      route: "/profile/equipment",
    },
    {
      title: "Notifications",
      icon: "notifications-outline",
      route: "/profile/notifications",
    },
    { title: "Subscribe", icon: "card-outline", route: "/profile/subscribe" },
    {
      title: "Subscription Status",
      icon: "checkmark-circle-outline",
      route: "/profile/subscription-status",
    },
    {
      title: "Privacy Policy",
      icon: "shield-outline",
      route: "/profile/privacy",
    },
    {
      title: "Imprint",
      icon: "information-circle-outline",
      route: "/profile/imprint",
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile & More</Text>
        <Text style={styles.subtitle}>Manage your account and preferences</Text>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <Link key={index} href={item.route as any} style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <Ionicons name={item.icon as any} size={24} color="#007AFF" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
  },
});
