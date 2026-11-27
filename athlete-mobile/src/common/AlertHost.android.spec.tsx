import { type ReactNode } from "react";
import { act, fireEvent, render, screen } from "../utils/testUtils";
import { dismissAlert, enqueueAlert, getCurrentAlert } from "./alertQueue";
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
    Row: ({ children }: { children?: ReactNode }) =>
      createElement(View, null, children),
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
  for (let alert = getCurrentAlert(); alert; alert = getCurrentAlert()) {
    dismissAlert(alert);
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

  it("shows a third button and runs its callback", async () => {
    const onLater = jest.fn();
    await render(<AlertHost />);
    await act(async () => {
      enqueueAlert("Save changes?", undefined, [
        { text: "Later", onPress: onLater },
        { text: "Discard", style: "destructive" },
        { text: "Save" },
      ]);
    });

    expect(screen.getByRole("button", { name: "Discard" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Save" })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Later" }));

    expect(onLater).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("alert-dialog")).toBeNull();
  });

  it("keeps the next alert when a button is tapped twice", async () => {
    const onOk = jest.fn();
    await render(<AlertHost />);
    await act(async () => {
      enqueueAlert("First", undefined, [{ text: "OK", onPress: onOk }]);
      enqueueAlert("Second");
    });
    const firstOk = screen.getByRole("button", { name: "OK" });

    await fireEvent.press(firstOk);
    await fireEvent.press(firstOk);

    expect(onOk).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Second")).toBeOnTheScreen();
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
