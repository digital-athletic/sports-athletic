import * as v from "valibot";
import FocusTrainingsJson from "../../assets/data/generator/focusTrainings.json";
import {
  loadFocusTraining,
  loadFocusTrainings,
  loadFocusTrainingTitle,
  parseFocusTrainings,
} from "./loadFocusTrainings";
import { loadIntensityConfig } from "./loadIntensityConfig";
import { getAllSkillTrees } from "./skillTreeRegistry";
import { getSkillTree } from "@/features/training/utils/skillTreeUtils";
import type { TrainingType } from "@/features/training/models/Training";
import { FocusTrainingsSchema } from "@/schemas/focusTraining.schema";

const PREVENTION_AREAS: [TrainingType, string][] = [
  ["PREVSHOULDER", "PREVENTION_SHOULDER"],
  ["PREVKNEE", "PREVENTION_KNEE_HIP"],
  ["PREVWRIST", "PREVENTION_WRIST_ELBOW"],
  ["PREVANKLE", "PREVENTION_ANKLE"],
  ["PREVSPINE", "PREVENTION_SPINE"],
];
const PREVENTION_TYPES = PREVENTION_AREAS.map(([type]) => type);

const blockOf = (type: TrainingType, index = 0) => {
  const block = loadFocusTraining(type)?.blocks[index];
  if (!block) throw new Error(`no block ${index} for ${type}`);
  return block;
};

describe("loadFocusTrainings: real file", () => {
  it("has a template for every focus training type", () => {
    expect(Object.keys(loadFocusTrainings()).sort()).toEqual(
      [
        "BAS",
        "BR",
        "CD",
        "GKS",
        "MOB",
        "PREV",
        "PREVANKLE",
        "PREVKNEE",
        "PREVSHOULDER",
        "PREVSPINE",
        "PREVWRIST",
        "STABILITY",
        "WU",
      ].sort(),
    );
  });

  it("returns the same frozen value on every call", () => {
    const first = loadFocusTrainings();

    expect(loadFocusTrainings()).toBe(first);
    expect(Object.isFrozen(first.WU.blocks[0].picks)).toBe(true);
  });

  it("asks for a foam roller or a foam ball in a foam rolling training", () => {
    expect(loadFocusTraining("BR")?.requiredEquipment).toEqual([
      "FOAM_ROLLER",
      "FOAM_BALL",
    ]);
  });

  it.each<TrainingType>(["WU", "MOB", "BR", "CD"])(
    "fills 10 slots of one minute in one set for %s",
    (type) => {
      const block = blockOf(type);

      expect(block.draw).toBe("slots");
      expect(block.picks).toEqual([{ tags: [], count: 10 }]);
      expect(block.sets).toBe(1);
      expect(block.work).toBe(60);
    },
  );

  it("draws 3 upper body and 2 full body exercises for a full body stability training without weights", () => {
    expect(blockOf("GKS").picksWithoutWeights).toEqual([
      { tags: ["REGION_UPPER_BODY"], count: 3 },
      { tags: ["REGION_FULL_BODY"], count: 2 },
    ]);
  });

  it("falls back to the whole skill tree only in the stability trainings", () => {
    const withFallback = Object.entries(loadFocusTrainings())
      .filter(([, template]) => template.blocks.some((block) => block.fallback))
      .map(([type]) => type);

    expect(withFallback.sort()).toEqual(["BAS", "GKS"]);
  });

  it.each(PREVENTION_AREAS)(
    "limits %s to its prevention area",
    (type, area) => {
      const template = loadFocusTraining(type);

      expect(template?.tags).toEqual([area]);
      template?.blocks.forEach((block) =>
        block.picks.forEach((pick) => expect(pick.tags).toContain(area)),
      );
    },
  );

  it.each(PREVENTION_TYPES)(
    "starts %s with 3 special warm up exercises and continues with 3 superset pairs",
    (type) => {
      const warmUp = blockOf(type, 0);
      const main = blockOf(type, 1);

      expect(warmUp.skillTree).toBe("WUSPEZIAL");
      expect(warmUp.skill).toBe("WUSPEZIAL");
      expect(warmUp.picks[0].count).toBe(3);
      expect(main.draw).toBe("pairs");
      expect(main.picks[0].count).toBe(3);
    },
  );

  const warmUpVolume = {
    sets: 1,
    pause: { superset: 10, sets: 10, exercise: 10 },
  };
  it.each<{ type: TrainingType; index: number; volume: object }>([
    { type: "WU", index: 0, volume: { ...warmUpVolume, superset: "none" } },
    {
      type: "BAS",
      index: 0,
      volume: {
        sets: 2,
        pause: { superset: 30, sets: 60, exercise: 30 },
        superset: "drawOrder",
      },
    },
    {
      type: "GKS",
      index: 0,
      volume: {
        sets: 2,
        pause: { superset: 45, sets: 90, exercise: 45 },
        superset: "none",
      },
    },
    {
      type: "STABILITY",
      index: 0,
      volume: {
        sets: 2,
        pause: { superset: 30, sets: 60, exercise: 60 },
        superset: "muscles",
      },
    },
    ...PREVENTION_TYPES.flatMap((type) => [
      { type, index: 0, volume: { ...warmUpVolume, superset: "muscles" } },
      {
        type,
        index: 1,
        volume: {
          sets: 2,
          pause: { superset: 30, sets: 60, exercise: 60 },
          superset: "drawOrderAll",
        },
      },
    ]),
  ])("sets the volume of $type block $index", ({ type, index, volume }) => {
    expect(blockOf(type, index)).toMatchObject(volume);
  });

  it("returns undefined for a type without a template", () => {
    expect(loadFocusTraining("PLAN")).toBeUndefined();
  });

  it("returns undefined for an object prototype key", () => {
    expect(loadFocusTraining("constructor")).toBeUndefined();
  });

  it.each<{
    type: TrainingType;
    focusArea: string;
    progression: boolean;
    regions?: string[];
  }>([
    { type: "WU", focusArea: "WARMUP", progression: false },
    { type: "CD", focusArea: "WARMUP", progression: false },
    { type: "MOB", focusArea: "MOBILITY", progression: false },
    { type: "BR", focusArea: "MOBILITY", progression: false },
    { type: "BAS", focusArea: "STABILITY", progression: true },
    { type: "GKS", focusArea: "STABILITY", progression: true },
    { type: "STABILITY", focusArea: "STABILITY", progression: true },
    { type: "PREV", focusArea: "PREVENTION", progression: true },
    {
      type: "PREVKNEE",
      focusArea: "PREVENTION",
      progression: true,
      regions: ["KNEE", "HIP", "KNEE_HIP"],
    },
    {
      type: "PREVWRIST",
      focusArea: "PREVENTION",
      progression: true,
      regions: ["WRIST", "ELBOW", "WRIST_ELBOW"],
    },
  ])(
    "reads focus area, progression and regions of $type",
    ({ type, focusArea, progression, regions }) => {
      const template = loadFocusTraining(type);

      expect(template?.focusArea).toBe(focusArea);
      expect(template?.progression).toBe(progression);
      expect(template?.regions).toEqual(regions);
    },
  );

  it.each([true, false])(
    "names only skill trees with branches, with weights %s",
    (hasWeights) => {
      for (const template of Object.values(loadFocusTrainings())) {
        for (const name of template.skillTrees) {
          const tree = getSkillTree(getAllSkillTrees(), name, [], hasWeights);
          expect(Object.keys(tree ?? {}).length).toBeGreaterThan(0);
        }
      }
    },
  );

  it("names only existing intensity configurations", () => {
    for (const template of Object.values(loadFocusTrainings())) {
      for (const name of [
        template.intensity,
        template.intensityWithoutWeights,
      ]) {
        if (name) expect(() => loadIntensityConfig(name)).not.toThrow();
      }
    }
  });
});

describe("loadFocusTrainingTitle", () => {
  it("returns the German title for German", () => {
    expect(loadFocusTrainingTitle("PREVKNEE", "de")).toBe(
      "Knie- und Hüftprävention",
    );
  });

  it("returns the English title for every other language", () => {
    expect(loadFocusTrainingTitle("PREVKNEE", "fr")).toBe(
      "Knee and hip prevention",
    );
    expect(loadFocusTrainingTitle("PREVKNEE", undefined)).toBe(
      "Knee and hip prevention",
    );
  });

  it("returns undefined without a template", () => {
    expect(loadFocusTrainingTitle("PLAN", "en")).toBeUndefined();
  });
});

describe("parseFocusTrainings: invalid data", () => {
  it("throws an error naming the data set", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(() => parseFocusTrainings({ WU: {} })).toThrow("Focus trainings");
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("returns a clone of the source", () => {
    const parsed = parseFocusTrainings(FocusTrainingsJson);

    expect(parsed).toEqual(FocusTrainingsJson);
    expect(parsed).not.toBe(FocusTrainingsJson);
  });
});

describe("FocusTrainingsSchema", () => {
  const withBlock = (change: Record<string, unknown>) => {
    const data = structuredClone(FocusTrainingsJson);
    Object.assign(data.WU.blocks[0], change);
    return data;
  };

  it("accepts the real file", () => {
    expect(v.safeParse(FocusTrainingsSchema, FocusTrainingsJson).success).toBe(
      true,
    );
  });

  it("rejects a template without blocks", () => {
    const data = structuredClone(FocusTrainingsJson);
    Object.assign(data.WU, { blocks: [] });

    expect(v.safeParse(FocusTrainingsSchema, data).success).toBe(false);
  });

  it.each<[string, Record<string, unknown>]>([
    ["without skill trees", { skillTrees: [] }],
    ["with an unknown focus area", { focusArea: "STRENGTH" }],
    ["without a German title", { title: { en: "Warm-Up" } }],
  ])("rejects a template %s", (_, change) => {
    const data = structuredClone(FocusTrainingsJson);
    Object.assign(data.WU, change);

    expect(v.safeParse(FocusTrainingsSchema, data).success).toBe(false);
  });

  it("accepts a new template key", () => {
    const data = {
      ...structuredClone(FocusTrainingsJson),
      PREVHIP: FocusTrainingsJson.PREVKNEE,
    };

    expect(v.safeParse(FocusTrainingsSchema, data).success).toBe(true);
  });

  it("rejects an unknown draw mode", () => {
    expect(
      v.safeParse(FocusTrainingsSchema, withBlock({ draw: "random" })).success,
    ).toBe(false);
  });

  it("rejects an unknown superset mode", () => {
    expect(
      v.safeParse(FocusTrainingsSchema, withBlock({ superset: "always" }))
        .success,
    ).toBe(false);
  });

  it("rejects a pick count below one", () => {
    expect(
      v.safeParse(
        FocusTrainingsSchema,
        withBlock({ picks: [{ tags: [], count: 0 }] }),
      ).success,
    ).toBe(false);
  });

  it("rejects a pause without the rest after an exercise", () => {
    expect(
      v.safeParse(
        FocusTrainingsSchema,
        withBlock({ pause: { superset: 10, sets: 10 } }),
      ).success,
    ).toBe(false);
  });

  it("rejects an unknown block field", () => {
    expect(
      v.safeParse(FocusTrainingsSchema, withBlock({ minutes: 15 })).success,
    ).toBe(false);
  });
});
