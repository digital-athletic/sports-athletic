import { render, screen } from "@/utils/testUtils";
import { Dimensions } from "react-native";
import { VideoPlayer } from "./VideoPlayer";

const mockPlayer = {
  playing: false,
  pause: jest.fn(),
  replaceAsync: jest.fn().mockResolvedValue(undefined),
};

jest.mock("expo-video", () => ({
  useVideoPlayer: () => mockPlayer,
  VideoView: () => null,
}));
jest.mock("expo", () => ({
  ...jest.requireActual("expo"),
  useEvent: () => ({ isPlaying: false }),
}));
jest.mock("@/services/StorageService", () => ({
  getExerciseVideoUrl: (filename: string) => `https://test/${filename}`,
  getTutorialVideoUrl: (filename: string) => `https://test/${filename}`,
}));

const tabletLandscape = { width: 1280, height: 800, scale: 2, fontScale: 2 };
const tabletPortrait = { width: 800, height: 1280, scale: 2, fontScale: 2 };

describe("VideoPlayer: frame size", () => {
  it("fills the column in tall landscape when asked to", async () => {
    Dimensions.set({ window: tabletLandscape, screen: tabletLandscape });

    await render(<VideoPlayer source="clip.mp4" fillColumnInTallLandscape />);

    const frame = screen.getByTestId("video-frame");
    expect(frame).toHaveStyle({ position: "absolute", top: 0, bottom: 0 });
    expect(frame).not.toHaveStyle({ aspectRatio: 16 / 9 });
  });

  it("keeps the 16:9 box on a portrait window when asked to fill the column", async () => {
    Dimensions.set({ window: tabletPortrait, screen: tabletPortrait });

    await render(<VideoPlayer source="clip.mp4" fillColumnInTallLandscape />);

    expect(screen.getByTestId("video-frame")).toHaveStyle({
      aspectRatio: 16 / 9,
    });
  });

  it("keeps the 16:9 box in tall landscape by default", async () => {
    Dimensions.set({ window: tabletLandscape, screen: tabletLandscape });

    await render(<VideoPlayer source="clip.mp4" />);

    expect(screen.getByTestId("video-frame")).toHaveStyle({
      aspectRatio: 16 / 9,
    });
  });
});
