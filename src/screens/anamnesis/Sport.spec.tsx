import { router } from "expo-router";
import { Alert } from "react-native";
import { useUserProfileStore } from "../../store/userProfileStore";
import { useUserWorkoutStore } from "../../store/userWorkoutStore";
import { fireEvent, render, waitFor } from "../../utils/testUtils";
import { Sport } from "./Sport";

// Mock expo-router
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({ originPath: undefined })),
}));

// Mock react-native Alert
jest.spyOn(Alert, "alert");

// Mock zustand stores
jest.mock("../../store/userProfileStore");
jest.mock("../../store/userWorkoutStore");

describe("<Sport />", () => {
  const mockSetIsInInitialAnamnesis = jest.fn();
  const mockSetSport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUserProfileStore as unknown as jest.Mock).mockReturnValue({
      isInInitialAnamnesis: false,
      setIsInInitialAnamnesis: mockSetIsInInitialAnamnesis,
    });
    (useUserWorkoutStore as unknown as jest.Mock).mockReturnValue({
      workoutData: {
        sport: "FOOTBALL_SPORT",
      },
      setSport: mockSetSport,
    });
  });

  it("displays the sport selection title", () => {
    const { getByText } = render(<Sport />);
    expect(getByText("Sport")).toBeTruthy();
  });

  it("renders all sport options", () => {
    const { getByText } = render(<Sport />);

    // Check a few sport names are rendered
    expect(getByText("Handball")).toBeTruthy();
    expect(getByText("Football/Soccer")).toBeTruthy();
    expect(getByText("Volleyball")).toBeTruthy();
    expect(getByText("Basketball")).toBeTruthy();
  });

  it("renders sport images with accessibility labels", () => {
    const { getByLabelText } = render(<Sport />);

    expect(getByLabelText("Handball")).toBeTruthy();
    expect(getByLabelText("Football/Soccer")).toBeTruthy();
  });

  it("shows selected state for current sport", () => {
    const { getAllByText } = render(<Sport />);

    // "Selected" should appear once for the currently selected sport
    const selectedTexts = getAllByText("Selected");
    expect(selectedTexts.length).toBeGreaterThan(0);
  });

  it("calls setSport when a sport is selected", () => {
    const { getByLabelText } = render(<Sport />);

    const handballItem = getByLabelText("sport-item-HANDBALL_SPORT");
    fireEvent.press(handballItem);

    expect(mockSetSport).toHaveBeenCalledWith("HANDBALL_SPORT");
  });

  it("does not show Go On button when originPath is not Welcome", () => {
    const { queryByText } = render(<Sport />);

    expect(queryByText("Go On")).toBeNull();
  });

  it("shows Go On button when originPath is Welcome", () => {
    const { useLocalSearchParams } = require("expo-router");
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      originPath: "Welcome",
    });

    const { getByText } = render(<Sport />);

    expect(getByText("Go On")).toBeTruthy();
  });

  it("navigates to userprofile when Go On is pressed", () => {
    const { useLocalSearchParams } = require("expo-router");
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      originPath: "Welcome",
    });

    const { getByLabelText } = render(<Sport />);

    const goOnButton = getByLabelText("sport-go-on-button");
    fireEvent.press(goOnButton);

    expect(router.push).toHaveBeenCalledWith({
      pathname: "/anamnesis/userprofile",
      params: { originPath: "Sport" },
    });
  });

  it("shows abort alert when close is pressed", async () => {
    const { useLocalSearchParams } = require("expo-router");
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      originPath: "Welcome",
    });

    const { getByLabelText } = render(<Sport />);

    // Find and press the close button
    const closeButton = getByLabelText("skip");
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Abort questionnaire?",
        "Your profile is incomplete.",
        expect.any(Array)
      );
    });
  });

  it("navigates back when not in Welcome origin path", async () => {
    const { useLocalSearchParams } = require("expo-router");
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      originPath: "Settings",
    });

    const { getByLabelText } = render(<Sport />);

    const backButton = getByLabelText("Back");
    fireEvent.press(backButton);

    expect(router.back).toHaveBeenCalled();
  });

  it("navigates to tabs when in initial anamnesis and confirms abort", async () => {
    const { useLocalSearchParams } = require("expo-router");
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      originPath: "Welcome",
    });

    (useUserProfileStore as unknown as jest.Mock).mockReturnValue({
      isInInitialAnamnesis: true,
      setIsInInitialAnamnesis: mockSetIsInInitialAnamnesis,
    });

    const { getByLabelText } = render(<Sport />);

    const closeButton = getByLabelText("skip");
    fireEvent.press(closeButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Simulate user pressing YES
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const yesButton = alertCall[2][0];
    yesButton.onPress();

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/(tabs)");
      expect(mockSetIsInInitialAnamnesis).toHaveBeenCalledWith(false);
    });
  });
});
