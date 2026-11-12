import { Platform, Share } from "react-native";
import { shareWorkoutText } from "./shareWorkoutText";

describe("shareWorkoutText: native", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens the share sheet with the workout text", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({
      action: Share.sharedAction,
      activityType: undefined,
    });

    const result = await shareWorkoutText("Workout 11/12/2026");

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({ message: "Workout 11/12/2026" });
  });

  it("reports a dismissed share sheet", async () => {
    jest.spyOn(Share, "share").mockResolvedValue({
      action: Share.dismissedAction,
      activityType: undefined,
    });

    await expect(shareWorkoutText("x")).resolves.toBe("dismissed");
  });
});

describe("shareWorkoutText: web with a share sheet", () => {
  const share = jest.fn();
  const writeText = jest.fn();

  beforeEach(() => {
    share.mockReset().mockResolvedValue(undefined);
    writeText.mockReset().mockResolvedValue(undefined);
    jest.replaceProperty(Platform, "OS", "web");
    Object.defineProperty(globalThis.navigator, "share", {
      configurable: true,
      value: share,
    });
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis.navigator, "share");
    Reflect.deleteProperty(globalThis.navigator, "clipboard");
  });

  it("opens the browser share sheet instead of copying", async () => {
    const result = await shareWorkoutText("Workout 11/12/2026");

    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({ text: "Workout 11/12/2026" });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("reports a dismissed browser share sheet", async () => {
    share.mockRejectedValue(new DOMException("cancelled", "AbortError"));

    await expect(shareWorkoutText("x")).resolves.toBe("dismissed");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the text when the browser refuses to share", async () => {
    share.mockRejectedValue(new DOMException("blocked", "NotAllowedError"));

    await expect(shareWorkoutText("x")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("x");
  });
});

describe("shareWorkoutText: web without a share sheet", () => {
  const writeText = jest.fn();

  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    jest.replaceProperty(Platform, "OS", "web");
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis.navigator, "clipboard");
  });

  it("copies the workout text to the clipboard instead of sharing", async () => {
    const share = jest.spyOn(Share, "share");

    const result = await shareWorkoutText("Workout 11/12/2026");

    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("Workout 11/12/2026");
    expect(share).not.toHaveBeenCalled();
  });
});
