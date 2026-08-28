import { expandMuscleTags } from "./muscleTagMapping";
import { getTagValues } from "@/utils/tagUtils";
import { TagGroups } from "@/constants/tagGroups";
import ExercisesData from "../../assets/data/generator/Exercises.json";

type ExerciseFixture = { tags?: string[] };

const REAL_MUSCLE_TAGS = [
  ...new Set(
    (ExercisesData as ExerciseFixture[]).flatMap((exercise) => [
      ...getTagValues(exercise.tags ?? [], TagGroups.MUSCLE),
      ...getTagValues(exercise.tags ?? [], TagGroups.MUSCLE_SECONDARY),
    ]),
  ),
];

describe("muscleTagMapping: expandMuscleTags coverage", () => {
  it.each(REAL_MUSCLE_TAGS)(
    "expands every real exercise tag without dropping any value: %s",
    (tag) => {
      expect(expandMuscleTags([tag]).length).toBeGreaterThan(0);
    },
  );
});

describe("muscleTagMapping: neck orientation tags", () => {
  it("passes NECK front, rear and lateral tags through unchanged", () => {
    expect(expandMuscleTags(["NECK_FRONT"])).toEqual(["NECK_FRONT"]);
    expect(expandMuscleTags(["NECK_REAR"])).toEqual(["NECK_REAR"]);
    expect(expandMuscleTags(["NECK_LATERAL"])).toEqual(["NECK_LATERAL"]);
  });
});

describe("muscleTagMapping: generic body part expansions", () => {
  it("expands the thigh tags to their bilateral generic body parts", () => {
    expect(expandMuscleTags(["OUTER_THIGH"])).toEqual(["ABDUCTORS"]);
    expect(expandMuscleTags(["INNER_THIGH"])).toEqual(["ADDUCTORS"]);
  });

  it("expands the hip rotator tags to their bilateral generic body parts", () => {
    expect(expandMuscleTags(["HIP_EXTERNAL_ROTATOR"])).toEqual(["GLUTES"]);
    expect(expandMuscleTags(["HIP_INTERNAL_ROTATOR"])).toEqual(["ADDUCTORS"]);
  });

  it("expands the wrist flexor tag to the left and right pair only", () => {
    expect(expandMuscleTags(["WRIST_FLEXOR"])).toEqual([
      "WRIST_FLEXOR_LEFT",
      "WRIST_FLEXOR_RIGHT",
    ]);
  });
});
