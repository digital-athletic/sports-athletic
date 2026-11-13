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
  | "shadow"
  // Custom colors, see https://m3.material.io/styles/color/advanced/define-new-colors
  | "success"
  | "onSuccess"
  | "successContainer"
  | "onSuccessContainer"
  | "warning"
  | "onWarning"
  | "warningContainer"
  | "onWarningContainer"
  | "info"
  | "onInfo"
  | "infoContainer"
  | "onInfoContainer";

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

  // Placeholders until the Theme Builder export: successContainer,
  // onWarningContainer, onInfoContainer
  success: "#34C759",
  onSuccess: "#FFF",
  successContainer: "#E3F7E8",
  onSuccessContainer: "#1E7B34",
  warning: "#FF9500",
  onWarning: "#FFF",
  warningContainer: "#FFF3E0",
  onWarningContainer: "#663E00",
  info: "#007AFF",
  onInfo: "#FFF",
  infoContainer: "#EAF3FF",
  onInfoContainer: "#00458F",
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

  // Light values until the Theme Builder export
  success: "#34C759",
  onSuccess: "#FFF",
  successContainer: "#E3F7E8",
  onSuccessContainer: "#1E7B34",
  warning: "#FF9500",
  onWarning: "#FFF",
  warningContainer: "#FFF3E0",
  onWarningContainer: "#663E00",
  info: "#007AFF",
  onInfo: "#FFF",
  infoContainer: "#EAF3FF",
  onInfoContainer: "#00458F",
};

// Colors without a matching role, identical in both schemes
const unassignedColors = {
  transparent: "transparent",
  // Content on photos, video and scrim
  white: "#FFF",

  // Test series in the charts
  squad: "#000000",
  deadlift: "#9B59B6",
  benchPress: "#6DC33F",
  rowing: "#4791DE",
  shoulderPress: "#F46E70",
};

const buildColors = (roles: ColorRoles) => ({
  ...roles,
  ...unassignedColors,
});

export const colors = buildColors(lightRoles);

export const darkColors = buildColors(darkRoles);
