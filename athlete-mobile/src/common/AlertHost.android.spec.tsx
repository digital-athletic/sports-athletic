import { type ReactNode } from "react";
import { act, fireEvent, render, screen } from "../utils/testUtils";
import {
  dismissCurrentAlert,
  enqueueAlert,
  getCurrentAlert,
} from "./alertQueue";
import { AlertHost } from "./AlertHost.android";

// Compose views map to React Native views; dialog slots render their children
// and a TextButton becomes a pressable button.
jest.mock("@expo/ui/jetpack-compose", () => {
  const { createElement, Fragment } = jest.requireActual("react");
  const { Pressable, Text, View } = jest.requireActual("react-native");
  const Slot = ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children);
  const AlertDialog = Object.assign(
    ({ children }: { children?: ReactNode }) =>
      createElement(View, { testID: "alert-dialog" }, children),
    {
      Title: Slot,
      Text: Slot,
      ConfirmButton: Slot,
      DismissButton: Slot,
    },
  );
  return {
    Host: ({ children }: { children?: ReactNode }) =>
      createElement(View, null, children),
    AlertDialog,
    Text: ({ children }: { children?: string }) =>
      createElement(Text, null, children),
    TextButton: ({
      children,
      onClick,
    }: {
      children?: ReactNode;
      onClick?: () => void;
    }) =>
      createElement(
        Pressable,
        { accessibilityRole: "button", onPress: onClick },
        children,
      ),
  };
});

afterEach(() => {
  while (getCurrentAlert()) {
    dismissCurrentAlert();
  }
});

describe("AlertHost android: dialog", () => {
  it("renders nothing while no alert is queued", async () => {
    await render(<AlertHost />);

    expect(screen.queryByTestId("alert-dialog")).toBeNull();
  });

  it("shows title, message and both buttons of a queued alert", async () => {
    await render(<AlertHost />);

    await act(async () => {
      enqueueAlert("Leave team?", "You can join again later.", [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive" },
      ]);
    });

    expect(screen.getByText("Leave team?")).toBeOnTheScreen();
    expect(screen.getByText("You can join again later.")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Leave" })).toBeOnTheScreen();
  });

  it("closes the dialog before running the button callback", async () => {
    const onLeave = jest.fn(() => {
      expect(getCurrentAlert()).toBeNull();
    });
    await render(<AlertHost />);
    await act(async () => {
      enqueueAlert("Leave team?", undefined, [
        { text: "Cancel", style: "cancel" },
        { text: "Leave", style: "destructive", onPress: onLeave },
      ]);
    });

    await fireEvent.press(screen.getByRole("button", { name: "Leave" }));

    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("alert-dialog")).toBeNull();
  });

  it("shows a second alert after the first one is closed", async () => {
    await render(<AlertHost />);
    await act(async () => {
      enqueueAlert("First");
      enqueueAlert("Second");
    });

    expect(screen.getByText("First")).toBeOnTheScreen();
    expect(screen.queryByText("Second")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "OK" }));

    expect(screen.getByText("Second")).toBeOnTheScreen();
  });
});
