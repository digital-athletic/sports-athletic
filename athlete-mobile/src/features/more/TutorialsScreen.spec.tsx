import { loadTutorials } from "@/data/loadTutorials";
import { fireEvent, render } from "../../utils/testUtils";
import TutorialsScreen from "./TutorialsScreen";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ navigate: mockNavigate }),
}));

describe("TutorialsScreen: list of technique videos", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("lists one row per video and no player", async () => {
    const { getAllByRole, queryByTestId } = await render(<TutorialsScreen />);

    expect(getAllByRole("button")).toHaveLength(loadTutorials().length);
    expect(queryByTestId("video-frame")).toBeNull();
  });

  it("opens the video page of the tapped row", async () => {
    const { getByText } = await render(<TutorialsScreen />);

    await fireEvent.press(getByText("Push Up"));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(tabs)/(more)/tutorial/[tutorialId]",
        params: expect.objectContaining({ tutorialId: "0" }),
      }),
    );
  });
});
