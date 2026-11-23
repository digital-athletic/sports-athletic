import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPauseExercise } from "@/features/training/models/IdTypes";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import { lookUpStoredBranchInCatalog } from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import { generateSetListFromWorkout } from "@/features/training/workoutGenerator/workoutGeneration";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { describeSetListEntries } from "@test/factories/setListDescription";
import { validateCustomWorkoutValue } from "./validateCustomWorkout";

const SEEDS = Array.from({ length: 30 }, (_, index) => index + 1);
const VARIANTS = [
  { name: "without equipment", equipment: [] },
  { name: "with a dumbbell", equipment: ["DUMBBELL"] },
];

// A template as the trainer-web builder saves it, with or without countBy.
// builderTemplate("PREV", "entries") → { aiwl: 1, ..., blocks: [{ kind: "picks", skill: "PREV", countBy: "entries", ... }] }
const builderTemplate = (skill: string, countBy?: "entries") => ({
  aiwl: 1,
  id: "3f2b8c1e-7a4d-4e59-9b6a-1c2d3e4f5a6b",
  name: { en: "Team session" },
  blocks: [
    {
      kind: "picks",
      skill,
      ...(countBy ? { countBy } : {}),
      picks: [{ tags: ["PREVENTION_SHOULDER"], count: 4 }],
    },
  ],
});

// rowIds([{ exerciseId: "21" }, { exerciseId: "21" }, { exerciseId: "pause" }]) → Set { "21" }
const rowIds = (setList: GeneratedSetListEntry[]): Set<string> =>
  new Set(
    setList
      .filter(({ exerciseId }) => !isPauseExercise(exerciseId))
      .map(({ exerciseId }) => exerciseId),
  );

// hasOtherSidePair(new Set(["21", "22"])) → true when catalog exercise 21 names 22 as its other side
const hasOtherSidePair = (ids: Set<string>): boolean =>
  loadExercises().some(
    ({ id, otherSideExerciseId }) =>
      ids.has(id) && !!otherSideExerciseId && ids.has(otherSideExerciseId),
  );

describe("builder template count: validation", () => {
  it.each(["PREV", "SWR1"])(
    "accepts a builder shaped %s template with countBy entries",
    (skill) => {
      const result = validateCustomWorkoutValue(
        builderTemplate(skill, "entries"),
        getAllSkillTrees(),
      );

      expect(result.success).toBe(true);
    },
  );
});

// Row ids of one generated workout per seed, drawn from the validated template.
const runIds = (
  skill: string,
  equipment: string[],
  countBy?: "entries",
): Set<string>[] =>
  SEEDS.map((seed) => {
    const parsed = validateCustomWorkoutValue(
      builderTemplate(skill, countBy),
      getAllSkillTrees(),
    );
    if (!parsed.success) throw new Error("builder template is invalid");
    return rowIds(
      generateSetListFromWorkout(
        parsed.template,
        lookUpStoredBranchInCatalog,
        generateRuleFamilyInput({
          exerciseCatalog: loadExercises(),
          equipment,
          random: generateSeededRandom(seed),
        }),
        { skillTrees: getAllSkillTrees() },
      ).setList,
    );
  });

describe.each(VARIANTS)("builder template count: $name", ({ equipment }) => {
  it("draws exactly 4 PREV rows in every run for count 4 with countBy entries", () => {
    const rows = runIds("PREV", equipment, "entries").map((ids) => ids.size);

    expect(rows).toEqual(SEEDS.map(() => 4));
  });

  it("draws more than 4 PREV rows without countBy because pairs double the count", () => {
    const rows = runIds("PREV", equipment).map((ids) => ids.size);

    expect(Math.max(...rows)).toBeGreaterThan(4);
  });

  it("draws at most 4 SWR1 rows for count 4 with countBy entries", () => {
    const rows = runIds("SWR1", equipment, "entries").map((ids) => ids.size);

    expect(Math.max(...rows)).toBeLessThanOrEqual(4);
  });
});

// With a dumbbell the SWR1 draw never paired two sides in 30 seeds, so only
// the no equipment pool pins the pairing.
describe("builder template count: SWR1 pairing without equipment", () => {
  it("fills two of the 4 with a one sided exercise and its other side", () => {
    const runs = runIds("SWR1", [], "entries");

    expect(runs.some(hasOtherSidePair)).toBe(true);
  });
});

// Locks the set list of a template as the trainer web builder writes it, for a
// fixed seed: the same template must keep generating the same rows.
describe("builder template: generated set list lock", () => {
  const describeBuilderSetList = (blocks: unknown[]) => {
    const parsed = validateCustomWorkoutValue(
      { ...builderTemplate("PREV"), blocks },
      getAllSkillTrees(),
    );
    if (!parsed.success) throw new Error("builder template is invalid");
    return describeSetListEntries(
      generateSetListFromWorkout(
        parsed.template,
        lookUpStoredBranchInCatalog,
        generateRuleFamilyInput({
          exerciseCatalog: loadExercises(),
          equipment: [],
          random: generateSeededRandom(7),
        }),
        { skillTrees: getAllSkillTrees() },
      ).setList,
    );
  };

  it("keeps the set list of a picks block with countBy entries", () => {
    expect(
      describeBuilderSetList([
        {
          kind: "picks",
          skill: "PREV",
          countBy: "entries",
          picks: [{ tags: ["PREVENTION_SHOULDER"], count: 4 }],
        },
      ]),
    ).toEqual([
      "126 1/2",
      "pause 30",
      "825 1/2",
      "pause 30",
      "126 2/2",
      "pause 30",
      "825 2/2",
      "pause 60",
      "247 1/2",
      "pause 30",
      "866 1/2",
      "pause 30",
      "247 2/2",
      "pause 30",
      "866 2/2",
    ]);
  });

  it("keeps the set list of a picks block without countBy", () => {
    expect(
      describeBuilderSetList([
        {
          kind: "picks",
          skill: "PREV",
          picks: [{ tags: ["PREVENTION_SHOULDER"], count: 4 }],
        },
      ]),
    ).toEqual([
      "126 1/2",
      "pause 30",
      "825 1/2",
      "pause 30",
      "126 2/2",
      "pause 30",
      "825 2/2",
      "pause 60",
      "1188 1/2",
      "pause 60",
      "1188 2/2",
      "pause 60",
      "1061 1/2",
      "pause 60",
      "1061 2/2",
      "pause 60",
      "541 1/2",
      "pause 30",
      "946 1/2",
      "pause 30",
      "541 2/2",
      "pause 30",
      "946 2/2",
      "pause 60",
      "247 1/2",
      "pause 30",
      "866 1/2",
      "pause 30",
      "247 2/2",
      "pause 30",
      "866 2/2",
    ]);
  });

  it("keeps the set list of a cardio duration block", () => {
    expect(
      describeBuilderSetList([
        { kind: "duration", skill: "CARDIO_2", duration: 1200 },
      ]),
    ).toEqual([
      "38 1/1",
      "42 1/4",
      "39 1/4",
      "42 2/4",
      "39 2/4",
      "42 3/4",
      "39 3/4",
      "42 4/4",
      "39 4/4",
      "38 1/1",
    ]);
  });
});
