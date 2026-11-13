import { useTheme } from "@/theme/theme";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import IconCalendarStats from "@tabler/icons-react-native/IconCalendarStats";
import IconChartBar from "@tabler/icons-react-native/IconChartBar";
import IconUser from "@tabler/icons-react-native/IconUser";

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
  const inactiveTintColor = colors.onSurfaceVariant;
  // The tab bar callback may pass numeric and null colors, which the icons reject.
  const iconColor = (focused: boolean) =>
    focused ? activeTintColor : inactiveTintColor;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeTintColor,
        tabBarInactiveTintColor: inactiveTintColor,
        tabBarStyle: {
          backgroundColor: colors.surface,
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
            <IconCalendarStats size={size} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: t("tabs.statistics"),
          tabBarIcon: ({ focused, size }) => (
            <IconChartBar size={size} color={iconColor(focused)} />
          ),
        }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused, size }) => (
            <IconUser size={size} color={iconColor(focused)} />
          ),
        }}
      />
    </Tabs>
  );
}
