import { useTheme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

/**
 * Main Tab Navigator Layout
 *
 * Primary app interface with bottom tabs.
 * Legacy: MainStack (Tab Navigator) with HomeStack, StatisticsStack, and MoreStack
 *
 * Note: TeamStack is disabled in legacy app
 */
export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.darkGrey1,
        tabBarStyle: {
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginBottom: Platform.OS === "ios" ? 0 : 5,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Training",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="walk" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
