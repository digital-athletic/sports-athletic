import { colors, darkColors } from "./colors";

// Light role values that replaced the old color names
const lightRoleValues = {
  primary: "#C71B1B",
  onPrimaryContainer: "#8F1010",
  primaryContainer: "#FDF1F1",
  secondary: "#2ebcb8",
  surface: "#FFF",
  surfaceContainerLow: "#FAFAFA",
  surfaceContainer: "#F2F2F2",
  surfaceContainerHigh: "#E8E8E8",
  outlineVariant: "#E8E8E8",
  outline: "#AAAAAA",
  onSurfaceVariant: "#767676",
  onSurface: "#333333",
  error: "#D70015",
  success: "#34C759",
  onSuccessContainer: "#1E7B34",
  warning: "#FF9500",
  warningContainer: "#FFF3E0",
  info: "#007AFF",
  infoContainer: "#EAF3FF",
};

describe("colors: light scheme", () => {
  it("keeps the values the old color names had", () => {
    expect(colors).toMatchObject(lightRoleValues);
  });
});

describe("colors: dark scheme", () => {
  it("defines exactly the same keys as the light scheme", () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(colors).sort());
  });
});
