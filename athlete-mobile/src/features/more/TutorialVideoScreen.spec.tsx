import { render } from "../../utils/testUtils";
import TutorialVideoScreen from "./TutorialVideoScreen";

let mockTutorialId = "0";
jest.mock("expo-router", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    Stack: {
      Screen: ({ options }: { options: { title: string } }) => (
        <Text>{`header: ${options.title}`}</Text>
      ),
    },
    useLocalSearchParams: () => ({ tutorialId: mockTutorialId }),
  };
});

jest.mock("@/video/VideoPlayer", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    VideoPlayer: ({ source }: { source: string }) => (
      <Text>{`player: ${source}`}</Text>
    ),
  };
});

describe("TutorialVideoScreen: one technique video", () => {
  it("shows the player of the video with its title in the header", async () => {
    mockTutorialId = "0";

    const { getByText } = await render(<TutorialVideoScreen />);

    expect(getByText("header: Push Up")).toBeTruthy();
    expect(getByText("player: tutorialVideos/Liegestuetz.mp4")).toBeTruthy();
  });

  it("shows no player for an unknown video", async () => {
    mockTutorialId = "unknown";

    const { queryByText } = await render(<TutorialVideoScreen />);

    expect(queryByText(/^player:/)).toBeNull();
  });
});
