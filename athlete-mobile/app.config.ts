import { ExpoConfig } from "expo/config";

const variant =
  (process.env.APP_VARIANT as
    | "development"
    | "production"
    | "preview"
    | undefined) ?? "development";

const baseName = "Digital Athletic";

const name = {
  development: baseName + " (dev)",
  preview: baseName + " (preview)",
  production: baseName,
}[variant];
const icon = {
  development: "./assets/img/logos/app-icon/dev-icon.png",
  preview: "./assets/img/logos/app-icon/preview-icon.png",
  production: "./assets/img/logos/app-icon/app-icon.png",
}[variant];
const bundleIdentifier = {
  development: "de.digital-athletic.app.development",
  preview: "de.digital-athletic.app.preview",
  production: "de.digital-athletic.app",
}[variant];
const packageName = {
  development: "de.digital_athletic.app.development",
  preview: "de.digital_athletic.app.preview",
  production: "de.digital_athletic.app",
}[variant];

export default (): ExpoConfig => ({
  name,
  slug: "digital-athletic",
  scheme: "digitalathletic",
  version: "0.0.1",
  primaryColor: "#C71B1B",
  orientation: "default",
  icon,
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    predictiveBackGestureEnabled: false,
    package: packageName,
    blockedPermissions: [
      "android.permission.RECORD_AUDIO",
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
    ],
  },
  updates: {
    url: "https://u.expo.dev/c864ab15-691c-429b-9dc9-eb920db5358d",
    checkAutomatically: "ON_LOAD",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  plugins: [
    "expo-font",
    "expo-asset",
    [
      "expo-audio",
      {
        microphonePermission: false,
      },
    ],
    "expo-video",
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/img/logos/SA_dark.png",
        imageWidth: 150,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
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
  extra: {
    eas: {
      projectId: "c864ab15-691c-429b-9dc9-eb920db5358d",
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
