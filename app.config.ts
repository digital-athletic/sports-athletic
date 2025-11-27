import { ExpoConfig } from "expo/config";

export default (): ExpoConfig => ({
  name: "Sports Athletic",
  slug: "sports-athletic",
  scheme: "sportsathletic",
  version: "1.0.0",
  primaryColor: "#C71B1B",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.sportsathletic.app",
  },
  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.sportsathletic.app",
  },
  plugins: [
    "expo-router",
    "expo-localization",
    "expo-dev-client",
    "expo-system-ui",
    [
      "@react-native-community/datetimepicker",
      {
        android: {
          datePicker: {
            colorAccent: {
              light: "#C71B1B",
            },
            textColor: {
              light: "#C71B1B",
            },
            colorControlActivated: {
              light: "#C71B1B",
            },
          },
          timePicker: {
            headerBackground: { light: "#C71B1B" },
            numbersSelectorColor: { light: "#C71B1B" },
          },
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
