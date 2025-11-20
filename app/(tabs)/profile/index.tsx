import { useAuthStore } from "@/store/authStore";
import { Box } from "@/theme/Box";
import { Text } from "@/theme/Text";
import { useTheme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, TouchableOpacity } from "react-native";

/**
 * More/Profile Menu Screen
 *
 * Main menu and profile hub.
 * Legacy: views/more/More
 */
export default function MoreScreen() {
  const { colors } = useTheme();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = () => {
    Alert.alert(
      t("onboarding.logoutQuestionTitle"),
      t("onboarding.logoutQuestionMessage"),
      [
        {
          text: t("onboarding.yesCaps"),
          onPress: () => {
            clearAuth();
            router.replace("/onboarding");
          },
        },
        {
          text: t("onboarding.noCaps"),
        },
      ]
    );
  };

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
      <Box flexGrow={1} backgroundColor="lightGrey1">
        <Box
          padding="l"
          paddingTop="xxl"
          backgroundColor="white"
          marginBottom="l"
        >
          <Text variant="title" marginBottom="xs">
            Profile & More
          </Text>
          <Text variant="subtitle">Manage your account and preferences</Text>
        </Box>

        <Box
          backgroundColor="white"
          borderTopWidth={1}
          borderBottomWidth={1}
          borderColor="lightGrey2"
        >
          {menuItems.map((item, index) => (
            <Link key={index} href={item.route as any}>
              <Box
                flexDirection="row"
                alignItems="center"
                justifyContent="space-between"
                padding="m"
                borderBottomWidth={1}
                borderBottomColor="lightGrey2"
              >
                <Box flexDirection="row" alignItems="center" gap="m">
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={colors.primary}
                  />
                  <Text variant="body">{item.title}</Text>
                </Box>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.darkGrey2}
                />
              </Box>
            </Link>
          ))}
        </Box>

        <Box
          backgroundColor="white"
          marginTop="l"
          borderTopWidth={1}
          borderBottomWidth={1}
          borderColor="lightGrey2"
        >
          <TouchableOpacity onPress={handleLogout}>
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="center"
              padding="m"
              style={{ height: 64 }}
            >
              <Box
                alignItems="center"
                justifyContent="center"
                marginRight="m"
                style={{
                  height: 40,
                  width: 40,
                  borderRadius: 20,
                  backgroundColor: colors.darkGrey1,
                }}
              >
                <Ionicons name="exit-outline" size={24} color="#fff" />
              </Box>
              <Text variant="body" style={{ fontSize: 18 }}>
                {t("onboarding.logoutButton")}
              </Text>
            </Box>
          </TouchableOpacity>
        </Box>
      </Box>
    </ScrollView>
  );
}
