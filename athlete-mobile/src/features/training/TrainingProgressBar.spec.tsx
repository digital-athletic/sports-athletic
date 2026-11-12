import { theme } from "@/theme/theme";
import { render, screen } from "@/utils/testUtils";
import { type ReactNode } from "react";
import { TrainingProgressBar as AndroidTrainingProgressBar } from "./TrainingProgressBar.android";
import { TrainingProgressBar as IosTrainingProgressBar } from "./TrainingProgressBar.ios";

// Native views map to plain Views that keep their props readable.
jest.mock("@expo/ui/swift-ui", () => {
  const { createElement } = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Host: ({ children, testID }: { children?: ReactNode; testID?: string }) =>
      createElement(View, { testID }, children),
    ProgressView: (props: object) =>
      createElement(View, { testID: "native-progress", ...props }),
  };
});

// Modifiers become plain objects, e.g. tint("#C71B1B") is { tint: "#C71B1B" }.
jest.mock("@expo/ui/swift-ui/modifiers", () => ({
  progressViewStyle: (style: string) => ({ progressViewStyle: style }),
  tint: (color: string) => ({ tint: color }),
}));

jest.mock("@expo/ui/jetpack-compose", () => {
  const { createElement } = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return {
    Host: ({ children, testID }: { children?: ReactNode; testID?: string }) =>
      createElement(View, { testID }, children),
    LinearProgressIndicator: (props: object) =>
      createElement(View, { testID: "native-progress", ...props }),
  };
});

jest.mock("@expo/ui/jetpack-compose/modifiers", () => ({
  fillMaxWidth: () => ({ fillMaxWidth: true }),
}));

describe("TrainingProgressBar: iOS", () => {
  it.each([
    [0, 0],
    [0.5, 0.5],
    [1, 1],
    [-0.2, 0],
    [1.4, 1],
  ])("shows progress %p as value %p", async (progress, expected) => {
    await render(<IosTrainingProgressBar progress={progress} />);
    expect(screen.getByTestId("native-progress").props.value).toBe(expected);
  });

  it("draws a linear bar tinted in the primary color", async () => {
    await render(<IosTrainingProgressBar progress={0.5} />);
    expect(screen.getByTestId("native-progress").props.modifiers).toEqual([
      { progressViewStyle: "linear" },
      { tint: theme.colors.primary },
    ]);
  });

  it("is findable by its testID", async () => {
    await render(<IosTrainingProgressBar progress={0.5} />);
    expect(screen.getByTestId("training-progress-bar")).toBeTruthy();
  });
});

describe("TrainingProgressBar: Android", () => {
  it.each([
    [0, 0],
    [0.5, 0.5],
    [1, 1],
    [-0.2, 0],
    [1.4, 1],
  ])("shows progress %p as progress %p", async (progress, expected) => {
    await render(<AndroidTrainingProgressBar progress={progress} />);
    expect(screen.getByTestId("native-progress").props.progress).toBe(
      expected,
    );
  });

  it("uses the primary color on a light grey track", async () => {
    await render(<AndroidTrainingProgressBar progress={0.5} />);
    const indicator = screen.getByTestId("native-progress");
    expect(indicator.props.color).toBe(theme.colors.primary);
    expect(indicator.props.trackColor).toBe(theme.colors.lightGrey2);
  });});
