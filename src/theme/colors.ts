import { KnownBaseTheme } from "@shopify/restyle";

export const colors: KnownBaseTheme["colors"] = {
  // Primary colors
  primary: "#007AFF",
  primaryLight: "#4A9EFF",
  primaryDark: "#0051D5",

  // Background colors
  mainBackground: "#fff",
  secondaryBackground: "#f5f5f5",
  cardBackground: "#fff",
  inputBackground: "#f9f9f9",
  buttonSecondaryBackground: "#f0f0f0",
  darkBackground: "#000",

  // Text colors
  textPrimary: "#333",
  textSecondary: "#666",
  textTertiary: "#999",
  textOnPrimary: "#fff",
  textDisabled: "#ccc",
  textLink: "#007AFF",

  // Border colors
  border: "#e0e0e0",
  borderPrimary: "#007AFF",
  borderFocus: "#007AFF",

  // Shadow colors
  shadow: "#000",

  // Status colors
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  info: "#007AFF",
} as const;
