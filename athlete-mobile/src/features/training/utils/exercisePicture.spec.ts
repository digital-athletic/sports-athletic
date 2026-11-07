import { getExercisePictureSource } from "./exercisePicture";

jest.mock("@/services/StorageService", () => ({
  getExercisePictureUrl: (fileName: string) =>
    `https://pictures.test/exercise_pictures/${fileName}`,
}));

describe("getExercisePictureSource: picture path to public URL", () => {
  it("returns the public URL for the file name of the picture path", () => {
    expect(getExercisePictureSource("exercisePictures/1-picture-x.jpg")).toBe(
      "https://pictures.test/exercise_pictures/1-picture-x.jpg",
    );
  });

  it("returns the public URL for a picture without a folder", () => {
    expect(getExercisePictureSource("1-picture-x.jpg")).toBe(
      "https://pictures.test/exercise_pictures/1-picture-x.jpg",
    );
  });

  it("returns null when the picture is null", () => {
    expect(getExercisePictureSource(null)).toBeNull();
  });

  it("returns null when the picture is undefined", () => {
    expect(getExercisePictureSource(undefined)).toBeNull();
  });

  it("returns null when the picture is an empty string", () => {
    expect(getExercisePictureSource("")).toBeNull();
  });
});
