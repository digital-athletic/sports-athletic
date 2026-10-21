import * as v from "valibot";

import { TemplateSchema } from "./aiwl.schema";

type Json = Record<string, unknown>;

const template = (...blocks: Json[]): Json => ({
  aiwl: 1,
  id: "T",
  name: { en: "Test" },
  blocks,
});

const picksBlock = (extra: Json = {}): Json => ({
  kind: "picks",
  skill: "GKS",
  picks: [{ tags: [], count: 4 }],
  ...extra,
});
const durationBlock = (extra: Json = {}): Json => ({
  kind: "duration",
  skill: "MOB",
  duration: 600,
  ...extra,
});
const branchesBlock = (extra: Json = {}): Json => ({
  kind: "branches",
  skill: "WU",
  branches: ["11", "14"],
  ...extra,
});

const firstIssuePath = (data: unknown): string | undefined => {
  const result = v.safeParse(TemplateSchema, data);
  if (result.success) return undefined;
  return (result.issues[0].path ?? [])
    .map((item) => String(item.key))
    .join(".");
};

const gks: Json = {
  aiwl: 1,
  id: "GKS",
  name: { en: "Full body stability", de: "Ganzkörperstabilität" },
  blocks: [
    {
      kind: "picks",
      skill: "GKS",
      picks: {
        withWeights: [{ tags: [], count: 4 }],
        withoutWeights: [
          { tags: ["REGION_UPPER_BODY"], count: 3 },
          { tags: ["REGION_FULL_BODY"], count: 2 },
        ],
      },
      rest: { afterExercise: 45 },
    },
  ],
};

const prevShoulder: Json = {
  aiwl: 1,
  id: "PREVSHOULDER",
  name: { en: "Shoulder prevention", de: "Schulterprävention" },
  blocks: [
    {
      kind: "picks",
      skill: "WUSPEZIAL",
      picks: [
        {
          tags: [
            "SKILL_WU",
            "SKILL_WARM_UP",
            "SKILL_WARM_UP_SPECIAL",
            "PREVENTION_SHOULDER",
          ],
          count: 3,
        },
      ],
    },
    {
      kind: "picks",
      skill: "PREVSHOULDER",
      picks: [{ tags: ["SKILL_PREVENTION", "PREVENTION_SHOULDER"], count: 3 }],
      superset: "drawOrderWithLeftovers",
    },
  ],
};

const planSwr145: Json = {
  aiwl: 1,
  id: "PLAN_SWR1_45",
  name: { en: "Hypertrophy", de: "Muskelaufbau" },
  blocks: [
    {
      kind: "branches",
      skill: "WU",
      duration: 600,
      order: "muscleGroups",
      branches: ["11", "14", "17", "20", "23"],
    },
    {
      kind: "branches",
      skill: "SWR1",
      duration: 1500,
      order: "muscleGroups",
      branches: ["201", "205", "212"],
    },
    {
      kind: "branches",
      skill: "GKS",
      duration: 600,
      order: "muscleGroups",
      branches: ["301", "307", "315"],
    },
  ],
};

const mobGks30: Json = {
  aiwl: 1,
  id: "MOBGKS30",
  name: { en: "Mobility and stability", de: "Mobilität und Stabilität" },
  blocks: [
    {
      kind: "duration",
      skill: "MOB",
      duration: 600,
      setDuration: 60,
      order: "muscleGroups",
      bodyParts: { regions: ["upperBody"] },
    },
    {
      kind: "duration",
      skill: "GKS",
      duration: 1200,
      order: "muscleGroups",
      bodyParts: { regions: ["upperBody"] },
    },
  ],
};

describe("TemplateSchema: accepts", () => {
  it.each<[string, unknown]>([
    ["the GKS example with two list picks", gks],
    ["the PREVSHOULDER example", prevShoulder],
    ["the PLAN_SWR1_45 example with branches blocks", planSwr145],
    ["the MOBGKS30 example with duration blocks and bodyParts", mobGks30],
    [
      "a name with only en",
      { ...template(picksBlock()), name: { en: "Only" } },
    ],
    [
      "a $schema and a description",
      {
        ...template(picksBlock()),
        $schema: "https://example.com/aiwl.json",
        description: { en: "A workout." },
      },
    ],
    ["a partial rest", template(picksBlock({ rest: { afterExercise: 45 } }))],
    [
      "an empty tags list in a pick",
      template(picksBlock({ picks: [{ tags: [], count: 1 }] })),
    ],
    [
      "a branches block with a duration",
      template(branchesBlock({ duration: 300 })),
    ],
  ])("%s", (_label, data) => {
    expect(v.safeParse(TemplateSchema, data).success).toBe(true);
  });
});

describe("TemplateSchema: rejects at the template level", () => {
  it.each<[string, unknown, string]>([
    ["aiwl 2", { ...template(picksBlock()), aiwl: 2 }, "aiwl"],
    [
      "a missing aiwl",
      { id: "T", name: { en: "T" }, blocks: [picksBlock()] },
      "aiwl",
    ],
    [
      "an unknown template key",
      { ...template(picksBlock()), tags: [] },
      "tags",
    ],
    ["empty blocks", template(), "blocks"],
    [
      "a name without en",
      { ...template(picksBlock()), name: { de: "Test" } },
      "name.en",
    ],
    ["an empty en", { ...template(picksBlock()), name: { en: "" } }, "name.en"],
  ])("%s", (_label, data, path) => {
    expect(firstIssuePath(data)).toBe(path);
  });
});

describe("TemplateSchema: rejects wrong block kinds and keys", () => {
  it.each<[string, Json, string]>([
    ["an unknown kind", { kind: "slots", skill: "GKS" }, "blocks.0.kind"],
    [
      "a picks block with duration",
      picksBlock({ duration: 600 }),
      "blocks.0.duration",
    ],
    [
      "a duration block with picks",
      durationBlock({ picks: [{ tags: [], count: 1 }] }),
      "blocks.0.picks",
    ],
    [
      "a branches block with bodyParts",
      branchesBlock({ bodyParts: { regions: ["core"] } }),
      "blocks.0.bodyParts",
    ],
    [
      "a picks block with branches",
      picksBlock({ branches: ["11"] }),
      "blocks.0.branches",
    ],
    [
      "a branches block without branches",
      { kind: "branches", skill: "WU" },
      "blocks.0.branches",
    ],
    [
      "a branches block with empty branches",
      branchesBlock({ branches: [] }),
      "blocks.0.branches",
    ],
  ])("%s", (_label, block, path) => {
    expect(firstIssuePath(template(block))).toBe(path);
  });
});

describe("TemplateSchema: rejects wrong picks and body parts", () => {
  it.each<[string, Json, string]>([
    [
      "region arms",
      durationBlock({ bodyParts: { regions: ["arms"] } }),
      "blocks.0.bodyParts.regions.0",
    ],
    [
      "pick count 0",
      picksBlock({ picks: [{ tags: [], count: 0 }] }),
      "blocks.0.picks",
    ],
    [
      "pick count 1.5",
      picksBlock({ picks: [{ tags: [], count: 1.5 }] }),
      "blocks.0.picks",
    ],
    [
      "an unknown pick key",
      picksBlock({ picks: [{ tags: [], count: 1, weight: 2 }] }),
      "blocks.0.picks",
    ],
    [
      "picks with withWeights only",
      picksBlock({ picks: { withWeights: [{ tags: [], count: 1 }] } }),
      "blocks.0.picks",
    ],
    ["empty picks", picksBlock({ picks: [] }), "blocks.0.picks"],
  ])("%s", (_label, block, path) => {
    expect(firstIssuePath(template(block))?.startsWith(path)).toBe(true);
  });
});

describe("TemplateSchema: rejects wrong block settings", () => {
  it.each<[string, Json, string]>([
    [
      "the old superset name drawOrderAll",
      picksBlock({ superset: "drawOrderAll" }),
      "blocks.0.superset",
    ],
    [
      "the old countBy name slots",
      picksBlock({ countBy: "slots" }),
      "blocks.0.countBy",
    ],
    [
      "rest.superset",
      picksBlock({ rest: { superset: 5 } }),
      "blocks.0.rest.superset",
    ],
    [
      "a negative rest",
      picksBlock({ rest: { afterExercise: -1 } }),
      "blocks.0.rest.afterExercise",
    ],
    ["setDuration 0", picksBlock({ setDuration: 0 }), "blocks.0.setDuration"],
    ["sets 0", picksBlock({ sets: 0 }), "blocks.0.sets"],
    ["order random", picksBlock({ order: "random" }), "blocks.0.order"],
  ])("%s", (_label, block, path) => {
    expect(firstIssuePath(template(block))).toBe(path);
  });
});
