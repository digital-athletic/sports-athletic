import {
  getSignedUrl,
  getVideoUrl,
  getImageUrl,
  getExerciseVideoUrl,
  getExercisePictureUrl,
  getTutorialVideoUrl,
  getTutorialPictureUrl,
} from "./StorageService";
import { supabase } from "./supabaseClient";

const mockCreateSignedUrl = jest.fn();

jest.mock("./supabaseClient", () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        createSignedUrl: mockCreateSignedUrl,
      })),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getSignedUrl", () => {
  it("returns the signed URL on success", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed/test.jpg?token=abc" },
      error: null,
    });

    const url = await getSignedUrl("images", "test.jpg");

    expect(supabase.storage.from).toHaveBeenCalledWith("images");
    expect(url).toBe("https://example.com/signed/test.jpg?token=abc");
  });

  it("passes the correct expiry to createSignedUrl", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed" },
      error: null,
    });

    await getSignedUrl("videos", "clip.mp4");

    expect(mockCreateSignedUrl).toHaveBeenCalledWith("clip.mp4", 3600);
  });

  it("returns null when createSignedUrl returns an error", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "Object not found" },
    });

    expect(await getSignedUrl("images", "missing.jpg")).toBeNull();
  });

  it("returns null when signedUrl is missing from response", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: null },
      error: null,
    });

    expect(await getSignedUrl("images", "broken.jpg")).toBeNull();
  });

  it("returns null when createSignedUrl throws a network error", async () => {
    mockCreateSignedUrl.mockRejectedValue(
      new TypeError("Network request failed"),
    );

    expect(await getSignedUrl("images", "offline.jpg")).toBeNull();
  });
});

describe("bucket-specific helpers", () => {
  beforeEach(() => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed" },
      error: null,
    });
  });

  it("getVideoUrl uses videos bucket", async () => {
    await getVideoUrl("clip.mp4");
    expect(supabase.storage.from).toHaveBeenCalledWith("videos");
  });

  it("getImageUrl uses images bucket", async () => {
    await getImageUrl("photo.jpg");
    expect(supabase.storage.from).toHaveBeenCalledWith("images");
  });

  it("getExerciseVideoUrl uses exercise_videos bucket", async () => {
    await getExerciseVideoUrl("squat.mp4");
    expect(supabase.storage.from).toHaveBeenCalledWith("exercise_videos");
  });

  it("getExercisePictureUrl uses exercise_pictures bucket", async () => {
    await getExercisePictureUrl("squat.jpg");
    expect(supabase.storage.from).toHaveBeenCalledWith("exercise_pictures");
  });

  it("getTutorialVideoUrl uses tutorial_videos bucket", async () => {
    await getTutorialVideoUrl("bench.mp4");
    expect(supabase.storage.from).toHaveBeenCalledWith("tutorial_videos");
  });

  it("getTutorialPictureUrl uses tutorial_pictures bucket", async () => {
    await getTutorialPictureUrl("bench.jpg");
    expect(supabase.storage.from).toHaveBeenCalledWith("tutorial_pictures");
  });
});

describe("bucket helpers return null on error", () => {
  beforeEach(() => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "fail" },
    });
  });

  it("all bucket helpers return null when getSignedUrl returns null", async () => {
    expect(await getVideoUrl("clip.mp4")).toBeNull();
    expect(await getImageUrl("photo.jpg")).toBeNull();
    expect(await getExerciseVideoUrl("squat.mp4")).toBeNull();
    expect(await getExercisePictureUrl("squat.jpg")).toBeNull();
    expect(await getTutorialVideoUrl("bench.mp4")).toBeNull();
    expect(await getTutorialPictureUrl("bench.jpg")).toBeNull();
  });
});
