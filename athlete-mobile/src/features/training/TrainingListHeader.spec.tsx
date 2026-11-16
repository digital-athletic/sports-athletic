import { fireEvent, render, screen } from "@/utils/testUtils";
import { type ReactNode } from "react";
import { TrainingListHeader } from "./TrainingListHeader";

type ScreenOptions = {
  title?: string;
  headerLeft?: () => ReactNode;
  headerRight?: () => ReactNode;
};

jest.mock("expo-router", () => ({
  // Renders both header slots so the tests see what the athlete sees.
  Stack: {
    Screen: (props: { options: ScreenOptions }) => (
      <>
        {props.options.headerLeft?.()}
        {props.options.headerRight?.()}
      </>
    ),
  },
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ back: jest.fn() }),
}));

describe("TrainingListHeader", () => {
  it("does not show the share button", async () => {
    await render(<TrainingListHeader onBack={jest.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Share the workout as text" }),
    ).not.toBeOnTheScreen();
  });

  it("calls onBack when the back control is pressed", async () => {
    const onBack = jest.fn();
    await render(<TrainingListHeader onBack={onBack} />);

    await fireEvent.press(screen.getByTestId("training-list-back-button"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
