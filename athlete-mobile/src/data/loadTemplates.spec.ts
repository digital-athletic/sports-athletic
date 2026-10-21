import { loadFocusTraining } from "./loadFocusTrainings";
import { loadSkillCatalogEntry } from "./loadSkillCatalog";
import {
  loadTemplate,
  loadTemplateName,
  loadTemplates,
  parseTemplates,
} from "./loadTemplates";
import { getAllSkillTrees } from "./skillTreeRegistry";
import { filterByTags } from "@/features/training/generators/focusTrainingSelection";
import type {
  BlockPick,
  CountBy,
  PicksBlock,
  PlacePicks,
  Rest,
  Superset,
  Template,
} from "@/schemas/aiwl.schema";
import type { FocusTrainingBlock } from "@/schemas/focusTraining.schema";
import type { SkillCatalogEntry } from "@/schemas/skillCatalog.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";

const IDS = [
  "WU",
  "MOB",
  "BR",
  "CD",
  "BAS",
  "GKS",
  "STABILITY",
  "PREV",
  "PREVSHOULDER",
  "PREVKNEE",
  "PREVWRIST",
  "PREVANKLE",
  "PREVSPINE",
];
const PLACES = ["withWeights", "withoutWeights"] as const;
type Place = (typeof PLACES)[number];

const COUNT_BY_OF_DRAW: Record<string, CountBy> = {
  slots: "sides",
  exercises: "exercises",
  pairs: "pairs",
};
const SUPERSET_OF_OLD: Record<string, Superset> = {
  none: "none",
  muscles: "muscles",
  drawOrder: "drawOrder",
  drawOrderAll: "drawOrderWithLeftovers",
};

const templateOf = (id: string): Template => {
  const template = loadTemplate(id);
  if (!template) throw new Error(`no template ${id}`);
  return template;
};

const blocksOf = (id: string): PicksBlock[] =>
  templateOf(id).blocks.map((block) => {
    if (block.kind !== "picks")
      throw new Error(`${id} has a ${block.kind} block`);
    return block;
  });

const entryOf = (code: string): SkillCatalogEntry => {
  const entry = loadSkillCatalogEntry(code);
  if (!entry) throw new Error(`no catalog entry for ${code}`);
  return entry;
};

const oldOf = (id: string) => {
  const old = loadFocusTraining(id);
  if (!old) throw new Error(`no old template ${id}`);
  return old;
};

const picksAt = (picks: PlacePicks, place: Place): BlockPick[] =>
  Array.isArray(picks) ? picks : picks[place];

const oldPicksAt = (
  block: FocusTrainingBlock,
  place: Place,
  templateTags: string[],
): BlockPick[] =>
  (place === "withoutWeights"
    ? (block.picksWithoutWeights ?? block.picks)
    : block.picks
  ).map((pick) => ({
    ...pick,
    tags: [...pick.tags, ...templateTags.filter((t) => !pick.tags.includes(t))],
  }));

const effective = (block: PicksBlock) => {
  const entry = entryOf(block.skill);
  return {
    countBy: block.countBy ?? entry.countBy,
    fallbackToWholeTree: block.fallbackToWholeTree ?? entry.fallbackToWholeTree,
    sets: block.sets ?? entry.sets,
    superset: block.superset ?? entry.superset,
    setDuration: block.setDuration,
    rest: { ...entry.rest, ...block.rest },
  };
};

const validGks = {
  aiwl: 1,
  id: "GKS",
  name: { en: "Full body stability", de: "Ganzkörperstabilität" },
  blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 4 }] }],
};

describe("loadTemplates: real files", () => {
  it("has the 13 templates", () => {
    expect(Object.keys(loadTemplates()).sort()).toEqual([...IDS].sort());
  });

  it.each(IDS)("keys the template %s by its id", (id) => {
    expect(loadTemplates()[id].id).toBe(id);
  });

  it("returns the same frozen value on every call", () => {
    const first = loadTemplates();

    expect(loadTemplates()).toBe(first);
    expect(Object.isFrozen(first.WU.blocks[0])).toBe(true);
  });

  it("returns the template value for a known id", () => {
    expect(loadTemplate("GKS")).toBe(loadTemplates().GKS);
  });

  it.each(["PLAN", "constructor"])("returns undefined for %s", (id) => {
    expect(loadTemplate(id)).toBeUndefined();
  });

  it.each(IDS)("has only picks blocks in %s", (id) => {
    expect(() => blocksOf(id)).not.toThrow();
  });

  it.each(IDS)("names catalog skills in the blocks of %s", (id) => {
    blocksOf(id).forEach((block) =>
      expect(loadSkillCatalogEntry(block.skill)).toBeDefined(),
    );
  });
});

describe("loadTemplateName", () => {
  it("returns the German name for German", () => {
    expect(loadTemplateName("PREVKNEE", "de")).toBe("Knie- und Hüftprävention");
  });

  it.each(["fr", undefined])("returns the English name for %s", (language) => {
    expect(loadTemplateName("PREVKNEE", language)).toBe(
      "Knee and hip prevention",
    );
  });

  it("returns undefined for an unknown id", () => {
    expect(loadTemplateName("PLAN", "en")).toBeUndefined();
  });
});

describe("loadTemplates: no redundant block override", () => {
  it.each(IDS)("overrides only values that differ in %s", (id) => {
    const redundant = blocksOf(id).flatMap((block, index) => {
      const entry = entryOf(block.skill);
      const fields = (
        ["countBy", "fallbackToWholeTree", "superset", "sets"] as const
      )
        .filter((field) => block[field] === entry[field])
        .map((field) => `${index}.${field}`);
      const rest = (Object.keys(block.rest ?? {}) as (keyof Rest)[])
        .filter((key) => block.rest?.[key] === entry.rest?.[key])
        .map((key) => `${index}.rest.${key}`);
      return [...fields, ...rest];
    });

    expect(redundant).toEqual([]);
  });
});

// Temporary until the slice that deletes focusTrainings.json.
describe("loadTemplates: parity with the old focus trainings", () => {
  it.each(IDS)("keeps the old title of %s", (id) => {
    expect(templateOf(id).name).toMatchObject(oldOf(id).title);
  });

  it.each(IDS)("keeps the old block count of %s", (id) => {
    expect(blocksOf(id)).toHaveLength(oldOf(id).blocks.length);
  });

  it.each(IDS)("keeps the old skill of every block in %s", (id) => {
    expect(blocksOf(id).map((block) => block.skill)).toEqual(
      oldOf(id).blocks.map((block) => block.skill ?? id),
    );
  });

  it.each(IDS.flatMap((id) => PLACES.map((place) => [id, place] as const)))(
    "keeps the old picks of %s %s",
    (id, place) => {
      const tags = oldOf(id).tags ?? [];

      expect(blocksOf(id).map((block) => picksAt(block.picks, place))).toEqual(
        oldOf(id).blocks.map((block) => oldPicksAt(block, place, tags)),
      );
    },
  );

  it.each(IDS)("resolves the old block values of %s", (id) => {
    expect(blocksOf(id).map(effective)).toEqual(
      oldOf(id).blocks.map((old) => ({
        countBy: COUNT_BY_OF_DRAW[old.draw],
        fallbackToWholeTree: old.fallback,
        sets: old.sets,
        superset: SUPERSET_OF_OLD[old.superset],
        setDuration: old.work,
        rest: {
          withinSuperset: old.pause.superset,
          betweenSets: old.pause.sets,
          afterExercise: old.pause.exercise,
        },
      })),
    );
  });
});

describe("loadTemplates: pool guard", () => {
  it.each(IDS.flatMap((id) => PLACES.map((place) => [id, place] as const)))(
    "matches a branch of the skill trees for every pick of %s %s",
    (id, place) => {
      const trees = getAllSkillTrees();
      const unmatched = blocksOf(id).flatMap((block, index) => {
        const branches: SkillTreeType = {};
        entryOf(block.skill).skillTree[place].forEach((name) =>
          Object.assign(branches, trees[name]),
        );
        return picksAt(block.picks, place)
          .filter(
            (pick) =>
              Object.keys(filterByTags(branches, pick.tags)).length === 0,
          )
          .map((pick) => `${index}: ${pick.tags.join(",")}`);
      });

      expect(unmatched).toEqual([]);
    },
  );
});

describe("parseTemplates: error paths", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("accepts a valid file", () => {
    expect(parseTemplates({ GKS: validGks }).GKS.id).toBe("GKS");
  });

  it("throws when the file key and the id differ", () => {
    expect(() => parseTemplates({ GKS: { ...validGks, id: "WU" } })).toThrow(
      "GKS.id",
    );
  });

  it("names the path of a bad pick", () => {
    const badPick = {
      ...validGks,
      blocks: [{ ...validGks.blocks[0], picks: [{ tags: [], count: 0 }] }],
    };

    expect(() => parseTemplates({ GKS: badPick })).toThrow(
      "GKS.blocks[0].picks",
    );
  });
});
