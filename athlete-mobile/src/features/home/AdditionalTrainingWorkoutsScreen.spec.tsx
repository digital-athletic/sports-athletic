import { render } from "@/utils/testUtils";
import AdditionalTrainingWorkoutsScreen from "./AdditionalTrainingWorkoutsScreen";

const mockUseLocalSearchParams = jest.fn();
const mockStackScreen = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  Stack: {
    Screen: (props: { options: { title?: string } }) => {
      mockStackScreen(props);
      return null;
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ title: "Team Alpha" });
});

describe("AdditionalTrainingWorkoutsScreen: header", () => {
  it("sets the title search param as the header title", () => {
    render(<AdditionalTrainingWorkoutsScreen />);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ title: "Team Alpha" }),
      }),
    );
  });

  it("falls back to the additional trainings title when the title param is missing", () => {
    mockUseLocalSearchParams.mockReturnValue({});

    render(<AdditionalTrainingWorkoutsScreen />);

    expect(mockStackScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ title: "Additional trainings" }),
      }),
    );
  });
});

describe("AdditionalTrainingWorkoutsScreen: empty state", () => {
  it("shows the no workouts message", () => {
    const { getByText } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(getByText("Currently no workouts available")).toBeTruthy();
  });

  it("marks the no workouts message as text for screen readers", () => {
    const { getByRole } = render(<AdditionalTrainingWorkoutsScreen />);

    expect(
      getByRole("text", { name: "Currently no workouts available" }),
    ).toBeTruthy();
  });
});
