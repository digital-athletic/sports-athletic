import { loadTutorials } from "@/data/loadTutorials";
import { fireEvent, render } from "../../utils/testUtils";
import TutorialsScreen from "./TutorialsScreen";

const mockNavigate = jest.fn();
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ navigate: mockNavigate }),
}));

// Renders each icon as a named host node, so the test finds it in the tree.
jest.mock("@tabler/icons-react-native/IconVideo", () => ({
  __esModule: true,
  default: (props: object) =>
    jest.requireActual("react").createElement("IconVideo", props),
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

  it("shows a video icon on every row", async () => {
    const { container } = await render(<TutorialsScreen />);

    const icons = container.queryAll((node) => node.type === "IconVideo");
    expect(icons).toHaveLength(loadTutorials().length);
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
