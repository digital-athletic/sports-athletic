// Material 3 color roles, see https://m3.material.io/styles/color/roles
type ColorRole =
  | "primary"
  | "onPrimary"
  | "primaryContainer"
  | "onPrimaryContainer"
  | "primaryFixed"
  | "primaryFixedDim"
  | "onPrimaryFixed"
  | "onPrimaryFixedVariant"
  | "secondary"
  | "onSecondary"
  | "secondaryContainer"
  | "onSecondaryContainer"
  | "secondaryFixed"
  | "secondaryFixedDim"
  | "onSecondaryFixed"
  | "onSecondaryFixedVariant"
  | "tertiary"
  | "onTertiary"
  | "tertiaryContainer"
  | "onTertiaryContainer"
  | "tertiaryFixed"
  | "tertiaryFixedDim"
  | "onTertiaryFixed"
  | "onTertiaryFixedVariant"
  | "error"
  | "onError"
  | "errorContainer"
  | "onErrorContainer"
  | "surface"
  | "surfaceDim"
  | "surfaceBright"
  | "surfaceContainerLowest"
  | "surfaceContainerLow"
  | "surfaceContainer"
  | "surfaceContainerHigh"
  | "surfaceContainerHighest"
  | "onSurface"
  | "onSurfaceVariant"
  | "outline"
  | "outlineVariant"
  | "inverseSurface"
  | "inverseOnSurface"
  | "inversePrimary"
  | "scrim"
  | "shadow";

type ColorRoles = Record<ColorRole, string>;

// Reuses the existing app colors; roles without one come from the
// Material Theme Builder export (seed #C71B1B, color match).
const lightRoles: ColorRoles = {
  primary: "#C71B1B",
  onPrimary: "#FFF",
  primaryContainer: "#FDF1F1",
  onPrimaryContainer: "#8F1010",
  primaryFixed: "#FFDAD5",
  primaryFixedDim: "#FFB4AA",
  onPrimaryFixed: "#410002",
  onPrimaryFixedVariant: "#930009",

  secondary: "#2ebcb8",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#2EBCB8",
  onSecondaryContainer: "#004645",
  secondaryFixed: "#77F6F2",
  secondaryFixedDim: "#56D9D5",
  onSecondaryFixed: "#00201F",
  onSecondaryFixedVariant: "#00504E",

  tertiary: "#6F4400",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#905900",
  onTertiaryContainer: "#FFDEBC",
  tertiaryFixed: "#FFDDB9",
  tertiaryFixedDim: "#FFB963",
  onTertiaryFixed: "#2B1700",
  onTertiaryFixedVariant: "#663E00",

  error: "#D70015",
  onError: "#FFF",
  errorContainer: "#D70015",
  onErrorContainer: "#FFE6E3",

  surface: "#FFF",
  surfaceDim: "#F2D3CF",
  surfaceBright: "#FFF8F7",
  surfaceContainerLowest: "#FFF",
  surfaceContainerLow: "#FAFAFA",
  surfaceContainer: "#F2F2F2",
  surfaceContainerHigh: "#E8E8E8",
  surfaceContainerHighest: "#FBDBD7",
  onSurface: "#333333",
  onSurfaceVariant: "#767676",
  outline: "#AAAAAA",
  outlineVariant: "#E8E8E8",

  inverseSurface: "#333333",
  inverseOnSurface: "#FFF",
  inversePrimary: "#FFB4AA",
  scrim: "#000000",
  shadow: "#000000",
};

// Material Theme Builder export (seed #C71B1B, color match), dark scheme
const darkRoles: ColorRoles = {
  primary: "#FFB4AA",
  onPrimary: "#690004",
  primaryContainer: "#C71B1B",
  onPrimaryContainer: "#FFDBD7",
  primaryFixed: "#FFDAD5",
  primaryFixedDim: "#FFB4AA",
  onPrimaryFixed: "#410002",
  onPrimaryFixedVariant: "#930009",

  secondary: "#56D9D5",
  onSecondary: "#003736",
  secondaryContainer: "#2EBCB8",
  onSecondaryContainer: "#004645",
  secondaryFixed: "#77F6F2",
  secondaryFixedDim: "#56D9D5",
  onSecondaryFixed: "#00201F",
  onSecondaryFixedVariant: "#00504E",

  tertiary: "#FFB963",
  onTertiary: "#472A00",
  tertiaryContainer: "#905900",
  onTertiaryContainer: "#FFDEBC",
  tertiaryFixed: "#FFDDB9",
  tertiaryFixedDim: "#FFB963",
  onTertiaryFixed: "#2B1700",
  onTertiaryFixedVariant: "#663E00",

  error: "#FFB4AB",
  onError: "#690005",
  errorContainer: "#D70015",
  onErrorContainer: "#FFE6E3",

  surface: "#1F0F0D",
  surfaceDim: "#1F0F0D",
  surfaceBright: "#483432",
  surfaceContainerLowest: "#190A09",
  surfaceContainerLow: "#281715",
  surfaceContainer: "#2C1B19",
  surfaceContainerHigh: "#382523",
  surfaceContainerHighest: "#43302E",
  onSurface: "#FBDBD7",
  onSurfaceVariant: "#E5BDB8",
  outline: "#AC8884",
  outlineVariant: "#5C403C",

  inverseSurface: "#FBDBD7",
  inverseOnSurface: "#3F2C29",
  inversePrimary: "#BD1115",
  scrim: "#000000",
  shadow: "#000000",
};

// Old keys kept until every screen uses the roles directly
const legacyAliases = (roles: ColorRoles) => ({
  primaryDark: roles.onPrimaryContainer,
  primaryTint: roles.primaryContainer,
  white: roles.surface,
  lightGrey1: roles.surfaceContainerLow,
  // Track of a pill toggle, between lightGrey1 and lightGrey2
  surfaceSubtle: roles.surfaceContainer,
  lightGrey2: roles.outlineVariant,
  lightGrey3: roles.outline,
  darkGrey1: roles.onSurfaceVariant,
  darkGrey3: roles.onSurface,
});

// Colors without a matching role, identical in both schemes
const unassignedColors = {
  primaryMuted: "#E38D8D",
  black: "#000",
  transparent: "transparent",
  overlay: "rgba(0, 0, 0, 0.8)",
  darkGrey2: "#555555",
  iosTitleBorder: "#EFEFF4",

  // Social colors
  facebookBlue: "#3B5998",
  googleRed: "#CF472E",
  settingsSwitchGreen: "#34C759",

  // Test colors
  squad: "#000000",
  deadlift: "#9B59B6",
  benchPress: "#6DC33F",
  rowing: "#4791DE",
  shoulderPress: "#F46E70",

  // Status colors
  success: "#34C759",
  successText: "#1E7B34",
  warning: "#FF9500",
  info: "#007AFF",

  // Subtle status backgrounds (tints)
  warningTint: "#FFF3E0",
  infoTint: "#EAF3FF",
};

const buildColors = (roles: ColorRoles) => ({
  ...roles,
  ...legacyAliases(roles),
  ...unassignedColors,
});

export const colors = buildColors(lightRoles);

export const darkColors = buildColors(darkRoles);
