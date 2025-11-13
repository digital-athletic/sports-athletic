import { Box, Text } from "@/components";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import { ScrollView } from "react-native";

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
    <ScrollView>
      <Box flexGrow={1} backgroundColor="secondaryBackground">
        <Box
          padding="l"
          paddingTop="xxl"
          backgroundColor="mainBackground"
          marginBottom="l"
        >
          <Text variant="title" marginBottom="xs">
            Profile & More
          </Text>
          <Text variant="subtitle">Manage your account and preferences</Text>
        </Box>

        <Box
          backgroundColor="mainBackground"
          borderTopWidth={1}
          borderBottomWidth={1}
          borderColor="border"
        >
          {menuItems.map((item, index) => (
            <Link key={index} href={item.route as any}>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                padding="m"
                borderBottomWidth={1}
                borderBottomColor="inputBackground"
              >
                <Box flexDirection="row" alignItems="center" gap="m">
                  <Ionicons name={item.icon as any} size={24} color="#007AFF" />
                  <Text variant="body">{item.title}</Text>
                </Box>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </Box>
            </Link>
          ))}
        </Box>
      </Box>
    </ScrollView>
  );
}
