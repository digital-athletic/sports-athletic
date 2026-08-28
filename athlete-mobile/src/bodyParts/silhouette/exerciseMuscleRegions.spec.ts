import { type Side } from "@/bodyParts/types";
import {
  EXERCISE_REGIONS_BY_TAG,
  regionsForExerciseTag,
  resolveExerciseRegions,
} from "./exerciseMuscleRegions";
import { FRONT_REGION_IDS, BACK_REGION_IDS } from "./regionMapping";
import { getTagValues } from "@/utils/tagUtils";
import { TagGroups } from "@/constants/tagGroups";
import ExercisesData from "../../../assets/data/generator/Exercises.json";

type ExerciseFixture = { tags?: string[] };

const CATALOG_TAGS = [
  ...new Set(
    (ExercisesData as ExerciseFixture[]).flatMap((exercise) => [
      ...getTagValues(exercise.tags ?? [], TagGroups.MUSCLE),
      ...getTagValues(exercise.tags ?? [], TagGroups.MUSCLE_SECONDARY),
    ]),
  ),
];

describe("exerciseMuscleRegions: table integrity", () => {
  it("covers every muscle tag present in the exercise catalog", () => {
    const knownTags = new Set(Object.keys(EXERCISE_REGIONS_BY_TAG));
    const unmapped = CATALOG_TAGS.filter((tag) => !knownTags.has(tag));

    expect(unmapped).toEqual([]);
  });

  it("only lists regions that exist on the side they are declared for", () => {
    const frontIds = new Set(FRONT_REGION_IDS);
    const backIds = new Set(BACK_REGION_IDS);
    const misplaced = Object.entries(EXERCISE_REGIONS_BY_TAG).flatMap(
      ([tag, regions]) => [
        ...regions.FRONT.filter((region) => !frontIds.has(region)).map(
          (region) => `${tag} FRONT ${region}`,
        ),
        ...regions.BACK.filter((region) => !backIds.has(region)).map(
          (region) => `${tag} BACK ${region}`,
        ),
      ],
    );

    expect(misplaced).toEqual([]);
  });

  it("leaves only the deliberate non-region tags unhighlighted", () => {
    const sides: Side[] = ["FRONT", "BACK"];
    const zeroTags = Object.keys(EXERCISE_REGIONS_BY_TAG).filter((tag) =>
      sides.every((side) => regionsForExerciseTag(tag, side).length === 0),
    );

    expect(new Set(zeroTags)).toEqual(new Set(["CARDIO", "HEART"]));
  });
});

describe("exerciseMuscleRegions: spec required resolutions", () => {
  it("resolves GLUTES to both glute regions on the back only", () => {
    expect(regionsForExerciseTag("GLUTES", "BACK")).toEqual([
      "GLUTES_LEFT",
      "GLUTES_RIGHT",
    ]);
    expect(regionsForExerciseTag("GLUTES", "FRONT")).toEqual([]);
  });

  it("resolves SHOULDER_FRONT on the front side only", () => {
    expect(regionsForExerciseTag("SHOULDER_FRONT", "FRONT")).not.toEqual([]);
    expect(regionsForExerciseTag("SHOULDER_FRONT", "BACK")).toEqual([]);
  });

  it("resolves SHOULDER_REAR on the back side only", () => {
    expect(regionsForExerciseTag("SHOULDER_REAR", "BACK")).not.toEqual([]);
    expect(regionsForExerciseTag("SHOULDER_REAR", "FRONT")).toEqual([]);
  });

  it("resolves bare SHOULDER on both sides", () => {
    expect(regionsForExerciseTag("SHOULDER", "FRONT")).not.toEqual([]);
    expect(regionsForExerciseTag("SHOULDER", "BACK")).not.toEqual([]);
  });

  it("resolves ANKLE on the front shins as well as the back calves", () => {
    expect(regionsForExerciseTag("ANKLE", "FRONT")).toEqual([
      "SHIN_MUSCLES_LEFT",
      "SHIN_MUSCLES_RIGHT",
    ]);
    expect(regionsForExerciseTag("ANKLE", "BACK")).not.toEqual([]);
  });
});

describe("exerciseMuscleRegions: tag set resolution", () => {
  it("returns an empty array for an unknown tag without throwing", () => {
    expect(regionsForExerciseTag("TOTALLY_UNKNOWN", "FRONT")).toEqual([]);
    expect(regionsForExerciseTag("TOTALLY_UNKNOWN", "BACK")).toEqual([]);
    expect(resolveExerciseRegions(["TOTALLY_UNKNOWN"], "FRONT")).toEqual([]);
  });

  it("de duplicates regions shared by several tags", () => {
    expect(
      resolveExerciseRegions(["INNER_THIGH", "HIP_INTERNAL_ROTATOR"], "FRONT"),
    ).toEqual(["ADDUCTORS_LEFT", "ADDUCTORS_RIGHT"]);
  });
});

describe("exerciseMuscleRegions: thigh tags", () => {
  it("highlights both legs for the outer and inner thigh tags", () => {
    expect(regionsForExerciseTag("OUTER_THIGH", "FRONT")).toEqual([
      "ABDUCTORS_LEFT",
      "ABDUCTORS_RIGHT",
    ]);
    expect(regionsForExerciseTag("INNER_THIGH", "FRONT")).toEqual([
      "ADDUCTORS_LEFT",
      "ADDUCTORS_RIGHT",
    ]);
  });
});
