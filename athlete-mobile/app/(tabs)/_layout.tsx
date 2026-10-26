import { useTheme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

/**
 * Main Tab Navigator Layout
 *
 * Primary app interface with bottom tabs.
 * Protected by Stack.Protected in root layout.
 */
export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const activeTintColor = colors.primary;
  const inactiveTintColor = colors.darkGrey1;
  // Ionicons rejects the numeric and null colors the tab bar callback may pass.
  const iconColor = (focused: boolean) =>
    focused ? activeTintColor : inactiveTintColor;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
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
          title: t("tabs.training"),
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="walk" size={size} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: t("tabs.statistics"),
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name="stats-chart"
              size={size}
              color={iconColor(focused)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused, size }) => (
            <Ionicons name="person" size={size} color={iconColor(focused)} />
          ),
        }}
      />
    </Tabs>
  );
}
