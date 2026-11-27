import { render, screen, waitFor } from "@/utils/testUtils";
import { Dimensions } from "react-native";
import { VideoPlayer } from "./VideoPlayer";

const mockPlayer = {
  replaceAsync: jest.fn().mockResolvedValue(undefined),
};

jest.mock("expo-video", () => ({
  useVideoPlayer: () => mockPlayer,
  VideoView: () => null,
}));
// Latest payload per player event, e.g. { playingChange: { isPlaying: true } }.
// useEvent returns the initial value for an event without an entry.
let mockEventPayloads: Record<string, object> = {};
jest.mock("expo", () => ({
  ...jest.requireActual("expo"),
  useEvent: (_player: unknown, eventName: string, initialValue: object) =>
    mockEventPayloads[eventName] ?? initialValue,
}));
jest.mock("@/services/StorageService", () => ({
  getExerciseVideoUrl: (filename: string) => `https://test/${filename}`,
}));

beforeEach(() => {
  mockEventPayloads = {};
  mockPlayer.replaceAsync.mockClear();
});

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

  it("fills the column with the error message when the video fails to load", async () => {
    Dimensions.set({ window: tabletLandscape, screen: tabletLandscape });
    mockPlayer.replaceAsync.mockRejectedValueOnce(new Error("no network"));

    await render(<VideoPlayer source="clip.mp4" fillColumnInTallLandscape />);

    await screen.findByRole("alert");
    expect(screen.getByTestId("video-frame")).toHaveStyle({
      position: "absolute",
    });
  });
});

describe("VideoPlayer: exercise name over the video", () => {
  it("shows the exercise name while the video is not playing", async () => {
    await render(<VideoPlayer source="clip.mp4" title="Squat" />);

    expect(await screen.findByText("Squat")).toBeTruthy();
  });

  it("hides the exercise name while the video plays", async () => {
    mockEventPayloads = { playingChange: { isPlaying: true } };
    const setIsVideoPlaying = jest.fn();

    await render(
      <VideoPlayer
        source="clip.mp4"
        title="Squat"
        setIsVideoPlaying={setIsVideoPlaying}
      />,
    );

    // The video URL is set before replaceAsync runs, so the player view shows.
    await waitFor(() =>
      expect(mockPlayer.replaceAsync).toHaveBeenCalledWith(
        "https://test/clip.mp4",
      ),
    );
    expect(screen.queryByText("Squat")).toBeNull();
    expect(setIsVideoPlaying).toHaveBeenLastCalledWith(true);
  });

  it("shows the exercise name and reports no playback when the playing video failed", async () => {
    mockEventPayloads = {
      playingChange: { isPlaying: true },
      statusChange: { status: "error" },
    };
    const setIsVideoPlaying = jest.fn();

    await render(
      <VideoPlayer
        source="clip.mp4"
        title="Squat"
        setIsVideoPlaying={setIsVideoPlaying}
      />,
    );

    expect(await screen.findByText("Squat")).toBeTruthy();
    expect(setIsVideoPlaying).toHaveBeenLastCalledWith(false);
  });
});
