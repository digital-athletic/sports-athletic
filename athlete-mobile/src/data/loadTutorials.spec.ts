import * as v from "valibot";
import TutorialsJson from "../../assets/data/tutorials.json";
import { loadTutorials, parseTutorials } from "./loadTutorials";
import { TutorialsFileSchema } from "@/schemas/tutorials.schema";

describe("loadTutorials: real file", () => {
  it("returns a known value", () => {
    const [pushUp] = loadTutorials();

    expect(pushUp).toEqual({
      ordering: 0,
      title: { default: "Liegestütz", en: "Push Up" },
      picture: "tutorialPictures/Liegestuetz.jpg",
      video: "tutorialVideos/Liegestuetz.mp4",
    });
  });

  it("keeps the umlauts of the German titles", () => {
    const titles = loadTutorials().map(({ title }) => title.default);

    expect(titles).toContain("Bankdrücken");
    expect(titles).toContain("Schulterfrontdrücken");
  });

  it("returns the same frozen value on every call", () => {
    const first = loadTutorials();

    expect(loadTutorials()).toBe(first);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first[0].title)).toBe(true);
  });

  // The screen uses the ordering as list key.
  it("has a unique ordering for every tutorial", () => {
    const orderings = loadTutorials().map(({ ordering }) => ordering);

    expect(new Set(orderings).size).toBe(orderings.length);
  });

  it("has an English title for every tutorial", () => {
    loadTutorials().forEach(({ title }) => {
      expect(typeof title.en).toBe("string");
    });
  });
});

describe("parseTutorials: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseTutorials({})).toThrow("Tutorials");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("returns a clone of the source", () => {
    const parsed = parseTutorials(TutorialsJson);

    expect(parsed).toEqual(TutorialsJson);
    expect(parsed).not.toBe(TutorialsJson);
  });
});

describe("TutorialsFileSchema", () => {
  it("accepts the real file", () => {
    expect(v.safeParse(TutorialsFileSchema, TutorialsJson).success).toBe(true);
  });

  it("rejects a title without the default text", () => {
    const invalid = structuredClone(TutorialsJson);
    Object.assign(invalid[0].title, { default: undefined });

    expect(v.safeParse(TutorialsFileSchema, invalid).success).toBe(false);
  });

  it("rejects a fractional ordering", () => {
    const invalid = structuredClone(TutorialsJson);
    Object.assign(invalid[0], { ordering: 0.5 });

    expect(v.safeParse(TutorialsFileSchema, invalid).success).toBe(false);
  });

  it("rejects an unknown key", () => {
    const invalid = structuredClone(TutorialsJson);
    Object.assign(invalid[0], { thumbnail: "x.jpg" });

    expect(v.safeParse(TutorialsFileSchema, invalid).success).toBe(false);
  });
});
