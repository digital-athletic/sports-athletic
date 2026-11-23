import { ExpoConfig } from "expo/config";
import {
  AndroidConfig,
  type ConfigPlugin,
  withAndroidColors,
  withAndroidStyles,
  withAppBuildGradle,
} from "expo/config-plugins";

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

// Same version as @expo/ui pulls in
const MATERIAL_DEPENDENCY = "com.google.android.material:material:1.13.0";

// Mirrors src/theme/colors.ts; config plugins cannot import app TypeScript
const MATERIAL3_COLORS = {
  colorOnPrimary: "#FFFFFF",
  colorError: "#D70015",
  colorOnError: "#FFFFFF",
};

/** Android: bases the app theme on Material 3, so native dialogs and widgets use it */
const withMaterial3Theme: ConfigPlugin = (config) => {
  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(MATERIAL_DEPENDENCY)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /dependencies\s*\{/,
        (match) => `${match}\n    implementation("${MATERIAL_DEPENDENCY}")`,
      );
    }
    return mod;
  });

  config = withAndroidColors(config, (mod) => {
    for (const [name, value] of Object.entries(MATERIAL3_COLORS)) {
      mod.modResults = AndroidConfig.Colors.assignColorValue(mod.modResults, {
        name,
        value,
      });
    }
    return mod;
  });

  return withAndroidStyles(config, (mod) => {
    const appTheme = AndroidConfig.Styles.getAppThemeGroup();
    const style = mod.modResults.resources.style?.find(
      (group) => group.$.name === appTheme.name,
    );
    if (style) {
      style.$.parent = "Theme.Material3.Light.NoActionBar";
    }
    for (const name of Object.keys(MATERIAL3_COLORS)) {
      mod.modResults = AndroidConfig.Styles.assignStylesValue(mod.modResults, {
        add: true,
        parent: appTheme,
        name,
        value: `@color/${name}`,
      });
    }
    return mod;
  });
};

export default (): ExpoConfig => withMaterial3Theme(baseConfig());

const baseConfig = (): ExpoConfig => ({
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
    "expo-asset",
    [
      "expo-audio",
      {
        microphonePermission: false,
      },
    ],
    "expo-video",
    "expo-image",
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
    "expo-sharing",
    "expo-status-bar",
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
    reactCompiler: true,
  },
});
