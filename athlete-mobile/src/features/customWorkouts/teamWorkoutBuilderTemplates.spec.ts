import { validateCustomWorkoutText } from "./validateCustomWorkout";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { Template } from "@/schemas/aiwl.schema";

// Mirrors BUILDER_SKILLS in trainer-web/src/utils/workoutBuilder.ts: the skills
// a trainer picks in the workout builder and the tags each one offers. A trainer
// picks tags of one group per section, so the tags of a section never mix
// regions and prevention areas.
const PICKS_SKILLS: Record<
  string,
  { regions: string[]; prevention: string[] }
> = {
  WU: {
    regions: ["REGION_UPPER_BODY", "REGION_LOWER_BODY"],
    prevention: ["PREVENTION_KNEE_HIP", "PREVENTION_ANKLE"],
  },
  MOB: {
    regions: ["REGION_UPPER_BODY", "REGION_LOWER_BODY", "REGION_CORE"],
    prevention: [
      "PREVENTION_SHOULDER",
      "PREVENTION_KNEE_HIP",
      "PREVENTION_SPINE",
      "PREVENTION_ANKLE",
    ],
  },
  GKS: {
    regions: ["REGION_UPPER_BODY", "REGION_FULL_BODY"],
    prevention: [
      "PREVENTION_SHOULDER",
      "PREVENTION_KNEE_HIP",
      "PREVENTION_ANKLE",
    ],
  },
  PREV: {
    regions: [
      "REGION_UPPER_BODY",
      "REGION_LOWER_BODY",
      "REGION_CORE",
      "REGION_FULL_BODY",
    ],
    prevention: [
      "PREVENTION_SHOULDER",
      "PREVENTION_KNEE_HIP",
      "PREVENTION_SPINE",
      "PREVENTION_ANKLE",
      "PREVENTION_WRIST_ELBOW",
    ],
  },
  SWR1: {
    regions: ["REGION_UPPER_BODY", "REGION_LOWER_BODY", "REGION_CORE"],
    prevention: [
      "PREVENTION_SHOULDER",
      "PREVENTION_KNEE_HIP",
      "PREVENTION_SPINE",
      "PREVENTION_ANKLE",
    ],
  },
  SK: { regions: ["REGION_UPPER_BODY", "REGION_LOWER_BODY"], prevention: [] },
  PLYO_MEDIUM: { regions: ["REGION_LOWER_BODY"], prevention: [] },
  CD: { regions: ["REGION_UPPER_BODY", "REGION_LOWER_BODY"], prevention: [] },
};

const CARDIO_SKILLS = [
  "CARDIO_1_LAKTAT",
  "CARDIO_2",
  "CARDIO_3",
  "CARDIO_4",
  "CARDIO_5",
];

// The builder's exercise and minute ranges.
const MIN_COUNT = 1;
const MAX_COUNT = 20;
const MIN_SECONDS = 5 * 60;
const MAX_SECONDS = 120 * 60;
const MAX_SECTIONS = 20;

const builderTemplate = (
  blocks: Template["blocks"],
  name = "Tuesday stability",
): Template => ({
  aiwl: 1,
  id: "6f1c2d3e-0000-4000-8000-000000000000",
  name: { en: name },
  blocks,
});

const imports = (template: Template): boolean =>
  validateCustomWorkoutText(JSON.stringify(template), getAllSkillTrees())
    .success;

const picksCases = Object.entries(PICKS_SKILLS).flatMap(
  ([skill, { regions, prevention }]) =>
    [
      [],
      ...regions.map((tag) => [tag]),
      regions,
      ...prevention.map((tag) => [tag]),
    ]
      .concat(prevention.length > 0 ? [prevention] : [])
      .flatMap((tags) =>
        [MIN_COUNT, MAX_COUNT].map((count) => ({ skill, tags, count })),
      ),
);

describe("team workout builder templates: picks sections", () => {
  it.each(picksCases)(
    "imports $skill with tags $tags and count $count",
    ({ skill, tags, count }) => {
      const template = builderTemplate([
        { kind: "picks", skill, picks: [{ tags, count }] },
      ]);

      expect(imports(template)).toBe(true);
    },
  );
});

describe("team workout builder templates: cardio sections", () => {
  it.each(
    CARDIO_SKILLS.flatMap((skill) =>
      [MIN_SECONDS, MAX_SECONDS].map((duration) => ({ skill, duration })),
    ),
  )("imports $skill for $duration seconds", ({ skill, duration }) => {
    const template = builderTemplate([{ kind: "duration", skill, duration }]);

    expect(imports(template)).toBe(true);
  });
});

describe("team workout builder templates: whole workouts", () => {
  it("imports the workout from the issue example", () => {
    const template = builderTemplate([
      {
        kind: "picks",
        skill: "GKS",
        picks: [{ tags: ["REGION_UPPER_BODY"], count: 5 }],
      },
      { kind: "duration", skill: "CARDIO_2", duration: 1200 },
    ]);

    expect(imports(template)).toBe(true);
  });

  it("imports the largest workout the builder allows", () => {
    const skills = [...Object.keys(PICKS_SKILLS), ...CARDIO_SKILLS];
    const blocks: Template["blocks"] = Array.from(
      { length: MAX_SECTIONS },
      (_, index) => {
        const skill = skills[index % skills.length];
        return CARDIO_SKILLS.includes(skill)
          ? { kind: "duration", skill, duration: MAX_SECONDS }
          : { kind: "picks", skill, picks: [{ tags: [], count: MAX_COUNT }] };
      },
    );
    const template = builderTemplate(blocks, "N".repeat(100));

    expect(imports(template)).toBe(true);
  });

  it("rejects stability tagged with the core region", () => {
    // The stability tree lacks a core tagged exercise in one of the two weight
    // variants, so the builder does not offer the tag for stability.
    const template = builderTemplate([
      {
        kind: "picks",
        skill: "GKS",
        picks: [{ tags: ["REGION_CORE"], count: 5 }],
      },
    ]);

    expect(imports(template)).toBe(false);
  });
});
