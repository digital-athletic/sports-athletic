import { colors, darkColors } from "./colors";

// The palette before the color roles were introduced
const previousColors = {
  primary: "#C71B1B",
  primaryMuted: "#E38D8D",
  primaryDark: "#8F1010",
  primaryTint: "#FDF1F1",
  secondary: "#2ebcb8",
  white: "#FFF",
  black: "#000",
  transparent: "transparent",
  overlay: "rgba(0, 0, 0, 0.8)",
  lightGrey1: "#FAFAFA",
  surfaceSubtle: "#F2F2F2",
  lightGrey2: "#E8E8E8",
  lightGrey3: "#AAAAAA",
  darkGrey1: "#767676",
  darkGrey2: "#555555",
  darkGrey3: "#333333",
  iosTitleBorder: "#EFEFF4",
  facebookBlue: "#3B5998",
  googleRed: "#CF472E",
  settingsSwitchGreen: "#34C759",
  squad: "#000000",
  deadlift: "#9B59B6",
  benchPress: "#6DC33F",
  rowing: "#4791DE",
  shoulderPress: "#F46E70",
  success: "#34C759",
  successText: "#1E7B34",
  warning: "#FF9500",
  error: "#D70015",
  info: "#007AFF",
  warningTint: "#FFF3E0",
  infoTint: "#EAF3FF",
};

describe("colors: light scheme", () => {
  it("keeps every previous color key at its previous value", () => {
    expect(colors).toMatchObject(previousColors);
  });
});

describe("colors: dark scheme", () => {
  it("defines exactly the same keys as the light scheme", () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(colors).sort());
  });
});
