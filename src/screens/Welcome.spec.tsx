import { router } from "expo-router";
import { Alert } from "react-native";
import { useUserProfileStore } from "../store/userProfileStore";
import { fireEvent, render, waitFor } from "../utils/testUtils";
import { Welcome } from "./Welcome";

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

// Mock react-native Alert
jest.spyOn(Alert, "alert");

// Mock zustand store
jest.mock("../store/userProfileStore");

describe("<Welcome />", () => {
  const mockSetIsInInitialAnamnesis = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUserProfileStore as unknown as jest.Mock).mockReturnValue({
      isInInitialAnamnesis: false,
      anamnesisCompleted: false,
      setIsInInitialAnamnesis: mockSetIsInInitialAnamnesis,
    });
  });

  it("displays the welcome greeting", () => {
    const { getByText } = render(<Welcome />);
    // The text contains a newline which renders as multi-line
    expect(getByText(/I am Ingemar/i)).toBeTruthy();
    expect(getByText(/personal athletics coach/i)).toBeTruthy();
  });

  it("displays the title", () => {
    const { getByText } = render(<Welcome />);
    expect(getByText("Personal data")).toBeTruthy();
  });

  it("displays the coach image with accessibility label", () => {
    const { getByLabelText } = render(<Welcome />);
    expect(getByLabelText("Coach Ingemar")).toBeTruthy();
  });

  it("navigates to sport screen when button is pressed", () => {
    const { getByText } = render(<Welcome />);
    const button = getByText("Let's go");

    fireEvent.press(button);

    expect(router.push).toHaveBeenCalledWith("/anamnesis/sport");
  });

  it("shows abort alert when close is pressed", async () => {
    const { getByLabelText } = render(<Welcome />);

    // Find and press the skip/close button
    const closeButton = getByLabelText("skip");
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Abort editing profile?",
        "Your profile is incomplete.",
        expect.any(Array)
      );
    });
  });

  it("shows different message when anamnesis is completed", async () => {
    (useUserProfileStore as unknown as jest.Mock).mockReturnValue({
      isInInitialAnamnesis: false,
      anamnesisCompleted: true,
      setIsInInitialAnamnesis: mockSetIsInInitialAnamnesis,
    });

    const { getByLabelText } = render(<Welcome />);

    const closeButton = getByLabelText("skip");
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Abort editing profile?",
        "All your changes will be lost.",
        expect.any(Array)
      );
    });
  });

  it("navigates to profile when in initial anamnesis and confirms abort", async () => {
    (useUserProfileStore as unknown as jest.Mock).mockReturnValue({
      isInInitialAnamnesis: true,
      anamnesisCompleted: false,
      setIsInInitialAnamnesis: mockSetIsInInitialAnamnesis,
    });

    const { getByLabelText } = render(<Welcome />);

    const closeButton = getByLabelText("skip");
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Simulate pressing "YES"
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const yesButton = buttons[0];
    yesButton.onPress();

    expect(mockSetIsInInitialAnamnesis).toHaveBeenCalledWith(false);
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/profile");
  });

  it("navigates to home tabs when not in initial anamnesis and confirms abort", async () => {
    (useUserProfileStore as unknown as jest.Mock).mockReturnValue({
      isInInitialAnamnesis: false,
      anamnesisCompleted: false,
      setIsInInitialAnamnesis: mockSetIsInInitialAnamnesis,
    });

    const { getByLabelText } = render(<Welcome />);

    const closeButton = getByLabelText("skip");
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Simulate pressing "YES"
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const yesButton = buttons[0];
    yesButton.onPress();

    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });
});
