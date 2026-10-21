import { renderHook } from "@testing-library/react-native";
import { useVoiceCoach } from "./useVoiceCoach";

type MockPlayer = {
  duration: number;
  pause: jest.Mock;
  play: jest.Mock;
  seekTo: jest.Mock;
};

const mockPlayersBySource = new Map<string, MockPlayer>();
// Models the asynchronous useAudioPlayerStatus the old hook relied on; the
// hook must play and pause correctly whatever this reports.
const mockStatus = { playing: false };

jest.mock("../../../../assets/audio/start_5sec.mp3", () => "start_5sec");
jest.mock("../../../../assets/audio/pause_3sec.mp3", () => "pause_3sec");

jest.mock("expo-audio", () => ({
  useAudioPlayer: (source: string) => {
    let player = mockPlayersBySource.get(source);
    if (!player) {
      player = {
        duration: 5.8,
        pause: jest.fn(),
        play: jest.fn(),
        seekTo: jest.fn(),
      };
      mockPlayersBySource.set(source, player);
    }
    return player;
  },
  useAudioPlayerStatus: () => ({ ...mockStatus }),
}));

type HookProps = Parameters<typeof useVoiceCoach>[0];

const renderVoiceCoach = (initialProps: HookProps) =>
  renderHook((props: HookProps) => useVoiceCoach(props), { initialProps });

const getPlayer = (source: string) => {
  const player = mockPlayersBySource.get(source);
  if (!player) throw new Error(`no player for ${source}`);
  return player;
};
const startPlayer = () => getPlayer("start_5sec");
const pausePlayer = () => getPlayer("pause_3sec");

const baseProps: HookProps = {
  countdown: 10,
  exerciseId: "squat",
  isActive: true,
  isPauseNext: false,
};

beforeEach(() => {
  mockStatus.playing = false;
  for (const player of mockPlayersBySource.values()) {
    player.pause.mockClear();
    player.play.mockClear();
    player.seekTo.mockClear();
  }
});

describe("useVoiceCoach: start cue", () => {
  it("stays silent before the final six seconds", () => {
    renderVoiceCoach(baseProps);
    expect(startPlayer().play).not.toHaveBeenCalled();
  });

  it("plays once for the whole countdown window", () => {
    const { rerender } = renderVoiceCoach(baseProps);
    for (const countdown of [6, 5, 4, 3, 2, 1]) {
      rerender({ ...baseProps, countdown });
    }
    expect(startPlayer().play).toHaveBeenCalledTimes(1);
    expect(startPlayer().seekTo).toHaveBeenCalledWith(0);
  });

  it("does not replay when the clip finishes while the countdown still shows one second", () => {
    const { rerender } = renderVoiceCoach({ ...baseProps, countdown: 6 });
    mockStatus.playing = true;
    rerender({ ...baseProps, countdown: 1 });
    mockStatus.playing = false;
    rerender({ ...baseProps, countdown: 1 });
    expect(startPlayer().play).toHaveBeenCalledTimes(1);
  });

  it("pauses the clip when the countdown ends before the status reports playing", () => {
    const { rerender } = renderVoiceCoach({ ...baseProps, countdown: 1 });
    rerender({ ...baseProps, countdown: undefined });
    expect(startPlayer().pause).toHaveBeenCalledTimes(1);
  });

  it("seeks so the clip ends with the countdown when it starts late", () => {
    renderVoiceCoach({ ...baseProps, countdown: 3 });
    expect(startPlayer().seekTo).toHaveBeenCalledWith(2.8);
  });

  it("pauses on a manual pause and resumes at the remaining time", () => {
    const { rerender } = renderVoiceCoach({ ...baseProps, countdown: 5 });
    rerender({ ...baseProps, countdown: 5, isActive: false });
    expect(startPlayer().pause).toHaveBeenCalledTimes(1);

    rerender({ ...baseProps, countdown: 5 });
    expect(startPlayer().play).toHaveBeenCalledTimes(2);
  });

  it("plays again for the next exercise", () => {
    const { rerender } = renderVoiceCoach({ ...baseProps, countdown: 1 });
    rerender({ ...baseProps, countdown: 5, exerciseId: "lunge" });
    expect(startPlayer().play).toHaveBeenCalledTimes(2);
  });
});

describe("useVoiceCoach: pause cue", () => {
  it("plays the pause clip in the final four seconds when a pause follows", () => {
    const { rerender } = renderVoiceCoach({
      ...baseProps,
      countdown: 5,
      isPauseNext: true,
    });
    expect(pausePlayer().play).not.toHaveBeenCalled();

    rerender({ ...baseProps, countdown: 4, isPauseNext: true });
    expect(pausePlayer().play).toHaveBeenCalledTimes(1);
    expect(startPlayer().play).not.toHaveBeenCalled();
  });

  it("switches from the start clip to the pause clip when the next exercise changes to a pause", () => {
    const { rerender } = renderVoiceCoach({ ...baseProps, countdown: 3 });
    rerender({ ...baseProps, countdown: 3, isPauseNext: true });
    expect(startPlayer().pause).toHaveBeenCalledTimes(1);
    expect(pausePlayer().play).toHaveBeenCalledTimes(1);
  });
});
