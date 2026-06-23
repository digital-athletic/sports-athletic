import {
  getPublicUrl,
  getExerciseVideoUrl,
  getExercisePictureUrl,
  getTutorialVideoUrl,
} from "./StorageService";
import { supabase } from "./supabaseClient";

const mockGetPublicUrl = jest.fn();

jest.mock("./supabaseClient", () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPublicUrl.mockReturnValue({
    data: { publicUrl: "https://example.com/public/test.jpg" },
  });
});

describe("getPublicUrl", () => {
  it("returns the public URL for the given bucket and path", () => {
    const url = getPublicUrl("images", "test.jpg");

    expect(supabase.storage.from).toHaveBeenCalledWith("images");
    expect(mockGetPublicUrl).toHaveBeenCalledWith("test.jpg");
    expect(url).toBe("https://example.com/public/test.jpg");
  });
});

describe("bucket-specific helpers", () => {
  it("getExerciseVideoUrl uses exercise_videos bucket", () => {
    getExerciseVideoUrl("squat.mp4");
    expect(supabase.storage.from).toHaveBeenCalledWith("exercise_videos");
  });

  it("getExercisePictureUrl uses exercise_pictures bucket", () => {
    getExercisePictureUrl("squat.jpg");
    expect(supabase.storage.from).toHaveBeenCalledWith("exercise_pictures");
  });

  it("getTutorialVideoUrl uses tutorial_videos bucket", () => {
    getTutorialVideoUrl("bench.mp4");
    expect(supabase.storage.from).toHaveBeenCalledWith("tutorial_videos");
  });
});
