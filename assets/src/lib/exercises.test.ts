import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildMetadata,
  parseExercises,
  type MirrorConfig,
} from "./exercises.ts";

describe("parseExercises", () => {
  it("keeps exercises with a video and strips the folder prefix", () => {
    const exercises = parseExercises([
      { id: "2", name: "b", video: "exerciseVideos/2.mp4", picture: null },
      { id: "999999", name: "Pause", video: null, picture: "p.jpg" },
      {
        id: "1",
        name: "a",
        video: "exerciseVideos/1.mp4",
        picture: "exercisePictures/1.jpg",
      },
    ]);
    assert.deepEqual(
      exercises.map((exercise) => [
        exercise.id,
        exercise.video,
        exercise.picture,
      ]),
      [
        ["1", "1.mp4", "1.jpg"],
        ["2", "2.mp4", null],
      ],
    );
  });
});

describe("buildMetadata", () => {
  const config: MirrorConfig = {
    creators: [{ name: "Doe, Jane" }],
    license: "cc-by-sa-4.0",
    language: "deu",
    descriptionFooter: "<p>footer</p>",
  };

  it("escapes the exercise text and adds the marker keyword", () => {
    const [exercise] = parseExercises([
      {
        id: "7",
        name: "x",
        displayName: "Squat <deep>",
        description: "a & b",
        video: "v.mp4",
      },
    ]);
    const metadata = buildMetadata(exercise, config);
    assert.equal(metadata.title, "Squat <deep> (Sports Athletic exercise 7)");
    assert.match(metadata.description, /<p>a &amp; b<\/p>/);
    assert.match(metadata.description, /Squat &lt;deep&gt;/);
    assert.ok(metadata.keywords.includes("sports-athletic-exercise-7"));
  });
});
