import type { PlaceType } from "@/constants/workoutConstants";
import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { DrawnWorkout } from "@/features/customWorkouts/drawnWorkout";
import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { BranchesBlock } from "@/features/training/workoutGenerator/stages/blockWalk";
import type { WorkoutGenerationRequest } from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";
import {
  type CustomWorkout,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { useDrawnWorkoutsStore } from "@/store/drawnWorkoutsStore";
import { generateAthlete } from "@test/factories/athlete";
import { generateBranchLevel } from "@test/factories/generationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateTrainingSetList } from "./trainingSetList";

/**
 * Builds the training start of the custom workout "custom-a" by an advanced
 * athlete at home. The overrides replace any field.
 *
 * generateRequest({ equipment: ["BARBELL"] })
 * → { type: "custom-a", place: "HOME", equipment: ["BARBELL"], user: <advanced athlete>, ... }
 */
const generateRequest = (
  overrides: Partial<WorkoutGenerationRequest & { place: PlaceType }> = {},
): WorkoutGenerationRequest & { place: PlaceType } => ({
  type: "custom-a",
  user: generateAthlete(),
  place: "HOME",
  exercises: loadExercises(),
  skillTrees: getAllSkillTrees(),
  weekday: 1,
  equipment: ["DUMBBELL", "BARBELL", "RACK", "BENCH"],
  givenSection: undefined,
  daysSinceLastWorkout: 0,
  userExerciseData: { exerciseData: {}, branchData: {} },
  ...overrides,
});

// The last change of the custom workout, as Supabase returns team_workouts.updated_at.
const MODIFIED_AT = "2026-11-01T08:00:00.123456+00:00";

/**
 * Builds the stored custom workout "custom-a" of the template, last changed at
 * MODIFIED_AT. The overrides replace any field.
 *
 * generateWorkoutsById(template, { importedAt: 1000 })
 * → { "custom-a": { id: "custom-a", teamId: null, template, importedAt: 1000, modifiedAt: MODIFIED_AT } }
 */
const generateWorkoutsById = (
  template: Template,
  overrides: Partial<CustomWorkout> = {},
): Record<string, CustomWorkout> => ({
  "custom-a": {
    id: "custom-a",
    teamId: null,
    template,
    importedAt: 0,
    modifiedAt: MODIFIED_AT,
    ...overrides,
  },
});

/**
 * Builds a template of a core block with three picks and a push block with
 * two picks.
 *
 * generateStrengthTemplate()
 * → blocks: [{ kind: "picks", skill: "GKS", picks: [{ tags: [], count: 3 }] },
 *            { kind: "picks", skill: "SWR1", picks: [{ tags: [], count: 2 }] }]
 */
const generateStrengthTemplate = (): Template =>
  generateTemplate([
    generatePicksBlock("GKS", { picks: [{ tags: [], count: 3 }] }),
    generatePicksBlock("SWR1", { picks: [{ tags: [], count: 2 }] }),
  ]);

/**
 * Builds the drawn workout of a template from drawn branches blocks, saved at
 * the given last change of the custom workout.
 *
 * generateDrawnWorkoutOfBlocks(template, [gksBranchesBlock])
 * → { templateModifiedAt: MODIFIED_AT, workout: { ...template, blocks: [gksBranchesBlock] } }
 */
const generateDrawnWorkoutOfBlocks = (
  template: Template,
  blocks: BranchesBlock[],
  templateModifiedAt = MODIFIED_AT,
): DrawnWorkout => ({ templateModifiedAt, workout: { ...template, blocks } });

/**
 * Reads the saved drawn workout of "custom-a" at a place.
 *
 * readSavedDrawnWorkout("HOME") → { templateModifiedAt: MODIFIED_AT, workout: { ... } }
 */
const readSavedDrawnWorkout = (place: PlaceType): DrawnWorkout | undefined =>
  useDrawnWorkoutsStore.getState().drawnWorkouts["custom-a"]?.[place];

/**
 * Lists the distinct branch IDs of a skill in a set list, sorted and without
 * pauses.
 *
 * listBranchIdsOfSkill(setList, "GKS") → ["510", "522", "523"]
 */
const listBranchIdsOfSkill = (
  setList: GeneratedSetListEntry[],
  skill: string,
): string[] =>
  [
    ...new Set(
      setList
        .filter((entry) => entry.skill === skill && entry.branchId !== "-1")
        .map((entry) => entry.branchId),
    ),
  ].sort();

/**
 * Lists the skills of a set list in order of first appearance.
 *
 * listSkills(setList) → ["GKS", "SWR1"]
 */
const listSkills = (setList: GeneratedSetListEntry[]): string[] => [
  ...new Set(setList.map((entry) => entry.skill)),
];

/**
 * Lists the superset pairs of a skill from the entries of its first set, two
 * entries per pair, each pair sorted and the list sorted.
 *
 * listPairsOfSkill(setList, "GKS") → ["510+523", "520+520"]
 */
const listPairsOfSkill = (
  setList: GeneratedSetListEntry[],
  skill: string,
): string[] => {
  const firstSetBranchIds = setList
    .filter(
      (entry) =>
        entry.skill === skill && entry.branchId !== "-1" && entry.set[0] === 1,
    )
    .map((entry) => entry.branchId);
  const pairs: string[] = [];
  for (let index = 0; index < firstSetBranchIds.length; index += 2) {
    pairs.push(
      firstSetBranchIds
        .slice(index, index + 2)
        .sort()
        .join("+"),
    );
  }
  return pairs.sort();
};

beforeEach(() => {
  useCustomWorkoutsStore.setState({ workoutsById: {} });
  useDrawnWorkoutsStore.setState({ drawnWorkouts: {}, _hasHydrated: true });
});

describe("trainingSetList: generateTrainingSetList on the first start", () => {
  it("saves a drawn workout of the template blocks with the branches the set list shows", () => {
    const template = generateStrengthTemplate();
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(template),
    });

    const setList = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest(),
    );

    const saved = readSavedDrawnWorkout("HOME");
    expect(saved?.templateModifiedAt).toBe(MODIFIED_AT);
    expect(
      saved?.workout.blocks.map((block) => [
        block.skill,
        block.kind === "branches" ? block.pickedFrom?.picks : undefined,
        block.kind === "branches" ? [...block.branches].sort() : undefined,
      ]),
    ).toEqual([
      ["GKS", [{ tags: [], count: 3 }], listBranchIdsOfSkill(setList, "GKS")],
      ["SWR1", [{ tags: [], count: 2 }], listBranchIdsOfSkill(setList, "SWR1")],
    ]);
  });

  it("saves the original of a cardio block that the first start swapped", () => {
    // Knee pain blocks branch 585, so the generator runs CARDIO_5 instead.
    const template = generateTemplate([
      generateBranchesBlock("CARDIO_2", ["585"], { duration: 1500 }),
    ]);
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(template),
    });

    const setList = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest({
        place: "HALL",
        equipment: ["AREA_10", "AREA_20", "TRACK_20", "TREADMILL"],
        user: generateAthlete({ pains: ["KNEE_LEFT"] }),
      }),
    );

    expect(listSkills(setList)).toEqual(["CARDIO_5"]);
    expect(readSavedDrawnWorkout("HALL")?.workout.blocks).toStrictEqual([
      {
        kind: "branches",
        skill: "CARDIO_2",
        branches: ["585"],
        duration: 1500,
      },
    ]);
  });

  it("generates and saves nothing before the drawn workouts store hydrates", () => {
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(generateStrengthTemplate()),
    });
    useDrawnWorkoutsStore.setState({ _hasHydrated: false });

    const setList = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest(),
    );

    expect(listSkills(setList)).toEqual(["GKS", "SWR1"]);
    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({});
  });

  it("saves nothing for a bundled type", () => {
    const setList = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest({ type: "MOB" }),
    );

    expect(setList).not.toEqual([]);
    expect(useDrawnWorkoutsStore.getState().drawnWorkouts).toEqual({});
  });
});

describe("trainingSetList: generateTrainingSetList on a reuse", () => {
  it("replays the saved branches in block order with another seed and keeps the saved draw", () => {
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(generateStrengthTemplate()),
    });
    const first = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest(),
    );
    const saved = readSavedDrawnWorkout("HOME");

    const second = generateTrainingSetList(
      generateSeededRandom(2),
      generateRequest(),
    );

    expect(listBranchIdsOfSkill(first, "GKS")).not.toEqual([]);
    expect(listBranchIdsOfSkill(second, "GKS")).toEqual(
      listBranchIdsOfSkill(first, "GKS"),
    );
    expect(listBranchIdsOfSkill(second, "SWR1")).toEqual(
      listBranchIdsOfSkill(first, "SWR1"),
    );
    expect(listSkills(second)).toEqual(["GKS", "SWR1"]);
    expect(readSavedDrawnWorkout("HOME")).toBe(saved);
  });

  it.each(["drawOrder", "drawOrderWithLeftovers"] as const)(
    "replays the pairs of a %s block with another seed",
    (superset) => {
      useCustomWorkoutsStore.setState({
        workoutsById: generateWorkoutsById(
          generateTemplate([
            generatePicksBlock("GKS", {
              picks: [{ tags: [], count: 4 }],
              superset,
              sets: 3,
            }),
            generatePicksBlock("MOB", { picks: [{ tags: [], count: 2 }] }),
          ]),
        ),
      });
      const first = generateTrainingSetList(
        generateSeededRandom(1),
        generateRequest(),
      );

      const second = generateTrainingSetList(
        generateSeededRandom(2),
        generateRequest(),
      );

      expect(listPairsOfSkill(first, "GKS")).not.toEqual([]);
      expect(listPairsOfSkill(second, "GKS")).toEqual(
        listPairsOfSkill(first, "GKS"),
      );
    },
  );

  it("saves and replays two blocks of one skill with their own branches", () => {
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(
        generateTemplate([
          generatePicksBlock("MOB"),
          generatePicksBlock("PREVKNEE", {
            picks: [{ tags: ["PREVENTION_KNEE_HIP"], count: 1 }],
          }),
          generatePicksBlock("PREVKNEE", {
            picks: [{ tags: ["PREVENTION_ANKLE"], count: 1 }],
          }),
        ]),
      ),
    });
    generateTrainingSetList(generateSeededRandom(1), generateRequest());

    const second = generateTrainingSetList(
      generateSeededRandom(9),
      generateRequest(),
    );

    const preventionBlocks = (
      readSavedDrawnWorkout("HOME")?.workout.blocks ?? []
    ).filter(
      (block): block is BranchesBlock =>
        block.kind === "branches" && block.skill === "PREVKNEE",
    );
    const preventionBranchIds = preventionBlocks.flatMap(
      (block) => block.branches,
    );
    expect(preventionBlocks.map((block) => block.pickedFrom?.picks)).toEqual([
      [{ tags: ["PREVENTION_KNEE_HIP"], count: 1 }],
      [{ tags: ["PREVENTION_ANKLE"], count: 1 }],
    ]);
    expect(new Set(preventionBranchIds).size).toBe(preventionBranchIds.length);
    expect(listBranchIdsOfSkill(second, "PREVKNEE")).toEqual(
      preventionBranchIds.sort(),
    );
  });
});

describe("trainingSetList: generateTrainingSetList after a change of the athlete", () => {
  it("replays the branches with new weights after a level change", () => {
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(generateStrengthTemplate()),
    });
    const first = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest({ user: generateAthlete({ level: "BEGINNER" }) }),
    );

    const second = generateTrainingSetList(
      generateSeededRandom(2),
      generateRequest({ user: generateAthlete({ level: "PROFESSIONAL" }) }),
    );

    expect(listBranchIdsOfSkill(second, "GKS")).toEqual(
      listBranchIdsOfSkill(first, "GKS"),
    );
    expect(listBranchIdsOfSkill(second, "SWR1")).toEqual(
      listBranchIdsOfSkill(first, "SWR1"),
    );
    expect(second.map(({ weight }) => weight)).not.toEqual(
      first.map(({ weight }) => weight),
    );
  });

  it("replays the branches with new exercises after a branch level change", () => {
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(generateStrengthTemplate()),
    });
    const first = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest(),
    );
    const branchData = Object.fromEntries(
      (readSavedDrawnWorkout("HOME")?.workout.blocks ?? [])
        .flatMap((block) => (block.kind === "branches" ? block.branches : []))
        .map((branchId) => [branchId, generateBranchLevel(branchId, 1)]),
    );

    const second = generateTrainingSetList(
      generateSeededRandom(2),
      generateRequest({ userExerciseData: { exerciseData: {}, branchData } }),
    );

    expect(listBranchIdsOfSkill(second, "GKS")).toEqual(
      listBranchIdsOfSkill(first, "GKS"),
    );
    expect(second.map(({ exerciseId }) => exerciseId)).not.toEqual(
      first.map(({ exerciseId }) => exerciseId),
    );
  });

  it("replaces a blocked saved branch for that start only", () => {
    // Knee pain blocks branch 523, which trains the knee.
    const gksBlock = generatePicksBlock("GKS", {
      picks: [{ tags: ["EXERCISE_DIRECTION_KNEE"], count: 1 }],
      fallbackToWholeTree: false,
    });
    const mobBlock = generatePicksBlock("MOB");
    const template = generateTemplate([gksBlock, mobBlock]);
    const drawnWorkout = generateDrawnWorkoutOfBlocks(template, [
      {
        ...generateBranchesBlock("GKS", ["523"], { duration: undefined }),
        pickedFrom: { picks: gksBlock.picks, fallbackToWholeTree: false },
      },
      {
        ...generateBranchesBlock("MOB", ["952"], { duration: undefined }),
        pickedFrom: { picks: mobBlock.picks },
      },
    ]);
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(template),
    });
    useDrawnWorkoutsStore.setState({
      drawnWorkouts: { "custom-a": { HOME: drawnWorkout } },
    });
    const before = structuredClone(drawnWorkout);

    const blocked = generateTrainingSetList(
      generateSeededRandom(3),
      generateRequest({
        equipment: ["DUMBBELL", "BARBELL"],
        user: generateAthlete({ pains: ["KNEE_LEFT"] }),
      }),
    );
    const cleared = generateTrainingSetList(
      generateSeededRandom(3),
      generateRequest({ equipment: ["DUMBBELL", "BARBELL"] }),
    );

    expect(listBranchIdsOfSkill(blocked, "GKS")).toHaveLength(1);
    expect(listBranchIdsOfSkill(blocked, "GKS")).not.toContain("523");
    expect(listBranchIdsOfSkill(blocked, "MOB")).toEqual(["952"]);
    expect(readSavedDrawnWorkout("HOME")).toEqual(before);
    expect(listBranchIdsOfSkill(cleared, "GKS")).toEqual(["523"]);
  });
});

describe("trainingSetList: generateTrainingSetList after a change of the custom workout", () => {
  it("generates fresh and saves a drawn workout with the new last change", () => {
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(
        generateTemplate([generatePicksBlock("MOB")]),
        { modifiedAt: "2026-11-02T09:30:00.654321+00:00" },
      ),
    });
    useDrawnWorkoutsStore.setState({
      drawnWorkouts: {
        "custom-a": {
          HOME: generateDrawnWorkoutOfBlocks(generateStrengthTemplate(), [
            generateBranchesBlock("GKS", ["510"], { duration: undefined }),
          ]),
        },
      },
    });

    const setList = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest(),
    );

    const saved = readSavedDrawnWorkout("HOME");
    expect(saved?.templateModifiedAt).toBe("2026-11-02T09:30:00.654321+00:00");
    expect(saved?.workout.blocks.map((block) => block.skill)).toEqual(["MOB"]);
    expect(listSkills(setList)).toEqual(["MOB"]);
  });

  it("replays the drawn workout while the last change is equal, even after the template blocks changed", () => {
    const drawnWorkout = generateDrawnWorkoutOfBlocks(
      generateStrengthTemplate(),
      [generateBranchesBlock("GKS", ["510"], { duration: undefined })],
    );
    useCustomWorkoutsStore.setState({
      workoutsById: generateWorkoutsById(
        generateTemplate([generatePicksBlock("MOB")]),
      ),
    });
    useDrawnWorkoutsStore.setState({
      drawnWorkouts: { "custom-a": { HOME: drawnWorkout } },
    });

    const setList = generateTrainingSetList(
      generateSeededRandom(1),
      generateRequest(),
    );

    expect(listBranchIdsOfSkill(setList, "GKS")).toEqual(["510"]);
    expect(readSavedDrawnWorkout("HOME")).toBe(drawnWorkout);
  });

  it.each([
    ["replays the draw", 1000, "1970-01-01T00:00:01.000Z", ["GKS"]],
    ["draws fresh", 2000, "1970-01-01T00:00:02.000Z", ["GKS", "SWR1"]],
  ])(
    "%s of an entry without a last change saved at import time 1000 when its import time is %i",
    (_name, importedAt, savedModifiedAt, skills) => {
      useCustomWorkoutsStore.setState({
        workoutsById: generateWorkoutsById(generateStrengthTemplate(), {
          importedAt,
          modifiedAt: undefined,
        }),
      });
      useDrawnWorkoutsStore.setState({
        drawnWorkouts: {
          "custom-a": {
            HOME: generateDrawnWorkoutOfBlocks(
              generateStrengthTemplate(),
              [generateBranchesBlock("GKS", ["510"], { duration: undefined })],
              "1970-01-01T00:00:01.000Z",
            ),
          },
        },
      });

      const setList = generateTrainingSetList(
        generateSeededRandom(1),
        generateRequest(),
      );

      expect(listSkills(setList)).toEqual(skills);
      expect(readSavedDrawnWorkout("HOME")?.templateModifiedAt).toBe(
        savedModifiedAt,
      );
    },
  );
});
