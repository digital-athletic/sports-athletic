import { loadExercises } from "@/data/loadExercises";
import { loadTemplates } from "@/data/loadTemplates";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import type { UserExerciseDataType } from "@/features/training/models/UserExerciseData";
import {
  lookUpStoredBranchInCatalog,
  type StoredBranch,
} from "@/features/training/workoutGenerator/blockHandlers/branches/storedBranchLookup";
import type { GenerationInput } from "@/features/training/workoutGenerator/generationInput/generationInput";
import {
  generateTrainingDaySetList,
  type TrainingDay,
} from "@/features/training/workoutGenerator/trainingDayWorkout";
import { generateSetList } from "@/features/training/workoutGenerator/workoutGeneration";
import { SHORT_WORKOUT_FILTERS } from "@/features/training/workoutGeneratorRouter";
import type { Template } from "@/schemas/aiwl.schema";
import {
  toUserExerciseData,
  toUserExerciseDataList,
} from "@/schemas/generator.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import { deepFreeze } from "@test/factories/deepFreeze";
import {
  generateGenerationInput,
  type GenerationInputFactoryOptions,
} from "@test/factories/generationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { generateTreeCatalogEntry } from "@test/factories/skillCatalog";
import { generateSkillBranch } from "@test/factories/skillTree";
import { generateStoredDayEntry } from "@test/factories/storedBranch";
import { generateStoredTrainingDay } from "@test/factories/storedTrainingDay";
import {
  generateBranchesBlock,
  generatePicksBlock,
  generateShortTemplate,
  generateTemplate,
} from "@test/factories/templateBlock";
import { generateTaggedExercise } from "@test/factories/valueExercise";
import {
  getBranchReplacement,
  restoreBranchEntries,
  swapBranchFromWorkout,
  type SwapWorkout,
} from "./swapWorkout";

/**
 * Lists the distinct real branch IDs of entries in order, without pauses,
 * e.g. entries of branches "98001", "-1", "98101" → ["98001", "98101"].
 */
const listTrainedBranchIds = (
  entries: readonly { branchId?: string }[],
): string[] => [
  ...new Set(
    entries.flatMap(({ branchId }) =>
      branchId && !isPlaceholderBranch(branchId) ? [branchId] : [],
    ),
  ),
];

/**
 * Lists the exercise IDs of the entries of one branch in order,
 * e.g. the entries of branch "98003" → ["161", "161"].
 */
const listExerciseIdsOf = (
  entries: readonly UserExerciseDataType[],
  branchId: string,
): string[] =>
  entries
    .filter((entry) => entry.branchId === branchId)
    .map(({ exerciseId }) => exerciseId);

/**
 * Lists the set positions of the entries of one branch in order,
 * e.g. the entries of branch "98001" → [[1, 2], [2, 2]].
 */
const listSetsOf = (
  entries: readonly UserExerciseDataType[],
  branchId: string,
): UserExerciseDataType["set"][] =>
  entries.filter((entry) => entry.branchId === branchId).map(({ set }) => set);

/**
 * Builds a skill tree branch that trains one catalog exercise on every level,
 * e.g. generateSyntheticBranch("114")
 * → { tags: ["SIDE_BOTH"], levels: { 1: { exerciseId: "114" }, 2: ..., 3: ... } }.
 */
const generateSyntheticBranch = (
  exerciseId: string,
  tags: string[] = ["SIDE_BOTH"],
) =>
  generateSkillBranch(tags, {
    1: { exerciseId },
    2: { exerciseId },
    3: { exerciseId },
  });

/**
 * Builds a branch the swap offers as replacement, e.g.
 * generateReplacement("98003", "161")
 * → { branchId: "98003", branch: { tags: ["SIDE_BOTH"], levels: { 1: { exerciseId: "161" }, ... } } }.
 */
const generateReplacement = (
  branchId: string,
  exerciseId: string,
  tags?: string[],
): StoredBranch => ({
  branchId,
  branch: generateSyntheticBranch(exerciseId, tags),
});

/**
 * Builds the bundled exercises plus synthetic ones: a one sided exercise
 * "eLeft" with the other side "eRight", and the cardio exercises "eCardioA"
 * and "eCardioB", e.g. generateSyntheticExerciseCatalog().at(-1)
 * → { id: "eCardioB", tags: ["SIDE_BOTH"], ... }.
 */
const generateSyntheticExerciseCatalog = () => [
  ...loadExercises(),
  generateTaggedExercise("eLeft", ["SIDE_ONE"], {
    otherSideExerciseId: "eRight",
  }),
  generateTaggedExercise("eRight", ["SIDE_ONE"]),
  generateTaggedExercise("eCardioA", ["SIDE_BOTH"]),
  generateTaggedExercise("eCardioB", ["SIDE_BOTH"]),
];

/**
 * Builds the skill trees of the specs: the bundled trees plus T_A with the
 * branches 98001 to 98003 (exercises 114, 115, 161) and T_B with 98101 (164),
 * all with the given tags, e.g. generateSyntheticSkillTrees().T_B
 * → { "98101": { tags: ["SIDE_BOTH"], levels: { 1: { exerciseId: "164" }, ... } } }.
 */
const generateSyntheticSkillTrees = (
  tags: string[] = ["SIDE_BOTH"],
): Record<string, SkillTreeType> => ({
  ...getAllSkillTrees(),
  T_A: {
    "98001": generateSyntheticBranch("114", tags),
    "98002": generateSyntheticBranch("115", tags),
    "98003": generateSyntheticBranch("161", tags),
  },
  T_B: {
    "98101": generateSyntheticBranch("164", tags),
    "98201": generateSyntheticBranch("164", tags),
  },
});

/**
 * Builds a skill catalog of the skill SYN that reads the tree T_A, the skill
 * SYN2 that reads the tree T_B and the mobility skill MOB, e.g.
 * generateSyntheticSkillCatalog().SYN2
 * → { skillTree: { withWeights: ["T_B"], ... }, countBy: "entries", sets: 2, ... }.
 */
const generateSyntheticSkillCatalog = () => ({
  SYN: generateTreeCatalogEntry(),
  SYN2: generateTreeCatalogEntry({
    skillTree: { withWeights: ["T_B"], withoutWeights: ["T_B"] },
  }),
  MOB: generateTreeCatalogEntry({
    skillTree: { withWeights: ["T_B"], withoutWeights: ["T_B"] },
  }),
});

/**
 * Builds a generation input over the synthetic exercises, trees and skill
 * catalog that draws the first option, e.g. generateSyntheticInput({ pains: ["KNEE_LEFT"] })
 * → { athlete: { ... PAIN: ["KNEE_LEFT"] }, skillCatalog: { SYN, SYN2, MOB }, ... }.
 */
const generateSyntheticInput = (
  options: GenerationInputFactoryOptions = {},
): GenerationInput => ({
  ...generateGenerationInput({
    exerciseCatalog: generateSyntheticExerciseCatalog(),
    random: () => 0,
    skillTrees: generateSyntheticSkillTrees(),
    ...options,
  }),
  skillCatalog: generateSyntheticSkillCatalog(),
});

/**
 * Builds the AIWL plan day the ADR example swaps in: SYN trains the branches
 * 98001 and 98002, SYN2 trains 98101, e.g. generatePlanDay().blocks[0].branches
 * → ["98001", "98002"].
 */
const generatePlanDay = (): Template =>
  generateTemplate([
    generateBranchesBlock("SYN", ["98001", "98002"], { duration: undefined }),
    generateBranchesBlock("SYN2", ["98101"], { duration: undefined }),
  ]);

/**
 * Builds the swap workout of a plan day: the session the day generates, the day
 * as source, the input and the trees, e.g. generatePlanWorkout(day, input, trees)
 * → { session: [{ branchId: "98001", ... }, ...], source: { kind: "plan", day }, input, skillTrees }.
 */
const generatePlanWorkout = (
  day: TrainingDay,
  input: GenerationInput,
  skillTrees: Record<string, SkillTreeType>,
): SwapWorkout => ({
  session: generateTrainingDaySetList(day, input, skillTrees).map(
    toUserExerciseData,
  ),
  source: { kind: "plan", day },
  input,
  skillTrees,
});

/**
 * Builds the swap workout of a short workout: the session the template draws
 * with the short workout filters, the template as source, the input and the
 * trees, e.g. generateShortWorkout(template, input, trees)
 * → { session: [{ branchId: "98001", ... }, ...], source: { kind: "short", template }, input, skillTrees }.
 */
const generateShortWorkout = (
  template: Template,
  input: GenerationInput,
  skillTrees: Record<string, SkillTreeType>,
): SwapWorkout => ({
  session: toUserExerciseDataList(
    generateSetList(template, lookUpStoredBranchInCatalog, input, {
      skillTrees,
      filters: SHORT_WORKOUT_FILTERS,
    }),
  ),
  source: { kind: "short", template },
  input,
  skillTrees,
});

/**
 * Builds a session entry, e.g. { branchId: "10", exerciseId: "e10", skill: "SK", set: [1, 2], repetition: 8 }.
 */
const generateSessionEntry = (
  branchId: string,
  exerciseId: string,
  set: [number, number],
): UserExerciseDataType => ({
  branchId,
  exerciseId,
  skill: "SK",
  set,
  repetition: 8,
});

describe("swapBranchFromWorkout: the ADR example on a plan day", () => {
  it("writes the entries of the replacement at the set positions of the target", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanWorkout(
      generatePlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98003", "161"),
      ) ?? [];

    expect(listSetsOf(swapped, "98003")).toEqual(
      listSetsOf(workout.session, "98001"),
    );
    expect(listExerciseIdsOf(swapped, "98003")).toEqual(["161", "161"]);
    expect(swapped.map(({ branchId }) => branchId)).toEqual(
      workout.session.map(({ branchId }) =>
        branchId === "98001" ? "98003" : branchId,
      ),
    );
  });

  it("leaves every entry of another branch unchanged", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanWorkout(
      generatePlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98003", "161"),
      ) ?? [];

    expect(swapped.filter(({ branchId }) => branchId !== "98003")).toEqual(
      workout.session.filter(({ branchId }) => branchId !== "98001"),
    );
  });

  it("does not mutate the session of the workout", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const day = deepFreeze(generatePlanDay());
    const workout = generatePlanWorkout(
      day,
      generateSyntheticInput(),
      skillTrees,
    );
    const sessionBefore = workout.session.map((entry) => ({ ...entry }));
    deepFreeze(workout.session);

    const swapped = swapBranchFromWorkout(
      workout,
      "98001",
      generateReplacement("98003", "161"),
    );

    expect(swapped).not.toBeNull();
    expect(workout.session).toEqual(sessionBefore);
  });
});

describe("swapBranchFromWorkout: the ADR example on a short workout", () => {
  it("writes the entries of the replacement in place of the drawn branch of a picks block", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const template = generateShortTemplate([
      generatePicksBlock("SYN"),
      generatePicksBlock("SYN2"),
    ]);
    const workout = generateShortWorkout(
      template,
      generateSyntheticInput(),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98003", "161"),
      ) ?? [];

    expect(listTrainedBranchIds(swapped)).toEqual(["98003", "98101"]);
  });

  it("gives each exercise of a picks block three sets when the block asks for sets 3", () => {
    const skillTrees = {
      ...generateSyntheticSkillTrees(),
      T_A: { "98001": generateSyntheticBranch("114") },
    };
    const template = generateShortTemplate([
      generatePicksBlock("SYN", { sets: 3 }),
    ]);
    const workout = generateShortWorkout(
      template,
      generateSyntheticInput({ skillTrees }),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98003", "161"),
      ) ?? [];

    expect(listSetsOf(swapped, "98003")).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });
});

describe("swapBranchFromWorkout: bundled knee prevention training", () => {
  // Pins the bundled PREVKNEE template, skill trees and exercises, so a data
  // change fails this case even when the logic is unchanged.
  it("moves every exercise of the knee prevention training to its first replacement", () => {
    const skillTrees = getAllSkillTrees();
    const input = generateGenerationInput({
      exerciseCatalog: loadExercises(),
      equipment: ["DUMBBELL", "BARBELL", "BENCH", "FOAM_ROLLER", "TOWEL"],
      random: generateSeededRandom(1),
    });
    const workout = generateShortWorkout(
      loadTemplates().PREVKNEE,
      input,
      skillTrees,
    );
    const trainedBranchIds = listTrainedBranchIds(workout.session);
    const offered = trainedBranchIds.flatMap((target) => {
      const [first] = getBranchReplacement(workout, target);
      return first ? [{ target, first }] : [];
    });

    const moves = offered.map(({ target, first }) => {
      const swapped = swapBranchFromWorkout(workout, target, first);
      const branchIds = listTrainedBranchIds(swapped ?? []);
      return {
        target,
        isSession: swapped !== null,
        holdsReplacement: branchIds.includes(first.branchId),
        holdsOriginal: branchIds.includes(target),
      };
    });

    expect(offered.map(({ target }) => target).sort()).toEqual(
      [...trainedBranchIds].sort(),
    );
    expect(moves).toEqual(
      moves.map(({ target }) => ({
        target,
        isSession: true,
        holdsReplacement: true,
        holdsOriginal: false,
      })),
    );
  });
});

describe("swapBranchFromWorkout: returns null", () => {
  it("when the target is not in the session", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanWorkout(
      generatePlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(
        workout,
        "99999",
        generateReplacement("98003", "161"),
      ),
    ).toBeNull();
  });

  it("when the target is the placeholder branch", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanWorkout(
      generatePlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(workout, "-1", generateReplacement("98003", "161")),
    ).toBeNull();
  });

  it("when the replacement branch is already in the session", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanWorkout(
      generatePlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98002", "115"),
      ),
    ).toBeNull();
  });

  it("when an exercise of the replacement appears under another branch", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanWorkout(
      generatePlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    // exercise 164 is the exercise of branch 98101 in the SYN2 block
    expect(
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98003", "164"),
      ),
    ).toBeNull();
  });

  it("when the replacement has another number of entries than the target", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanWorkout(
      generatePlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );

    // a one sided exercise trains both sides, so two sets give four entries
    const oneSided = generateReplacement("98003", "eLeft", ["SIDE_ONE"]);

    expect(swapBranchFromWorkout(workout, "98001", oneSided)).toBeNull();
  });

  it("when the pain of the athlete removes the replacement", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const input = generateSyntheticInput({ pains: ["KNEE_LEFT"] });
    const workout = generatePlanWorkout(generatePlanDay(), input, skillTrees);

    const kneeBlocked = generateReplacement("98003", "161", [
      "SIDE_BOTH",
      "BLOCK_KNEE",
    ]);

    expect(swapBranchFromWorkout(workout, "98001", kneeBlocked)).toBeNull();
  });

  it("when the generator throws for the block of the skill", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const workout = generatePlanWorkout(
      generatePlanDay(),
      generateSyntheticInput(),
      skillTrees,
    );
    // the athlete reports soreness in two regions after the session is drawn
    const soreInput = generateSyntheticInput({
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    expect(
      swapBranchFromWorkout(
        { ...workout, input: soreInput },
        "98001",
        generateReplacement("98003", "161"),
      ),
    ).toBeNull();
  });

  it("when the setup of the short workout template throws", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const template = generateShortTemplate([
      generatePicksBlock("SYN"),
      generatePicksBlock("SYN2"),
    ]);
    const workout = generateShortWorkout(
      template,
      generateSyntheticInput(),
      skillTrees,
    );
    // knee pain empties the picks pool when every branch blocks the knee
    const blockedTrees = generateSyntheticSkillTrees([
      "SIDE_BOTH",
      "BLOCK_KNEE",
    ]);
    const painInput = generateSyntheticInput({
      pains: ["KNEE_LEFT"],
      skillTrees: blockedTrees,
    });

    expect(
      swapBranchFromWorkout(
        { ...workout, input: painInput, skillTrees: blockedTrees },
        "98001",
        generateReplacement("98003", "161"),
      ),
    ).toBeNull();
  });

  it("when a short workout template contains the skill in two blocks", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const template = generateShortTemplate([
      generateBranchesBlock("SYN", ["98001"], { duration: undefined }),
      generateBranchesBlock("SYN", ["98002"], { duration: undefined }),
    ]);
    const workout = generateShortWorkout(
      template,
      generateSyntheticInput(),
      skillTrees,
    );

    expect(
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98003", "161"),
      ),
    ).toBeNull();
  });
});

describe("swapBranchFromWorkout: blocks of the plan day", () => {
  it("takes the timing of the first block when a plan day contains two blocks of the skill", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const day = generateTemplate([
      generateBranchesBlock("SYN", ["98001"], { duration: undefined, sets: 3 }),
      generateBranchesBlock("SYN", ["98002"], { duration: undefined, sets: 2 }),
    ]);
    const workout = generatePlanWorkout(
      day,
      generateSyntheticInput(),
      skillTrees,
    );

    const swapped =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98003", "161"),
      ) ?? [];

    expect(listSetsOf(swapped, "98003")).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it("still returns a session when another block of the workout throws on muscle soreness", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const day = generateTemplate([
      generateBranchesBlock("MOB", ["98201"], { duration: undefined }),
      generateBranchesBlock("SYN", ["98001"], { duration: undefined }),
    ]);
    const workout = generatePlanWorkout(
      day,
      generateSyntheticInput(),
      skillTrees,
    );
    // the mobility skill ignores soreness; the SYN block throws for two sore regions
    const soreInput = generateSyntheticInput({
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    const swapped = swapBranchFromWorkout(
      { ...workout, input: soreInput },
      "98201",
      generateReplacement("98202", "161"),
    );

    expect(listExerciseIdsOf(swapped ?? [], "98202")).toEqual(["161", "161"]);
  });
});

describe("swapBranchFromWorkout: legacy stored day", () => {
  it("builds the intervals of a cardio replacement from the minutes of the day", () => {
    const skillTrees = getAllSkillTrees();
    const input = generateGenerationInput({
      exerciseCatalog: generateSyntheticExerciseCatalog(),
      random: () => 0,
    });
    // 6 minutes make two intervals of 2 minutes, separated by a pause of 1 minute
    const day = generateStoredTrainingDay(
      { CARDIO_3: ["580"] },
      { CARDIO_3: 6 },
      "eCardioA",
    );
    const workout = generatePlanWorkout(day, input, skillTrees);

    const swapped =
      swapBranchFromWorkout(
        workout,
        "580",
        generateReplacement("581", "eCardioB"),
      ) ?? [];

    expect(listSetsOf(swapped, "581")).toEqual([
      [1, 2],
      [2, 2],
    ]);
    expect(listSetsOf(swapped, "581")).toEqual(
      listSetsOf(workout.session, "580"),
    );
  });

  it("leaves the first replacement of the skill unchanged in a second swap", () => {
    const skillTrees = generateSyntheticSkillTrees();
    const input = generateSyntheticInput();
    const day = {
      skills: {
        SYN: [
          generateStoredDayEntry("98001", ["SIDE_BOTH"], "114"),
          generateStoredDayEntry("98002", ["SIDE_BOTH"], "115"),
        ],
      },
      lengths: {},
    };
    const workout = generatePlanWorkout(day, input, skillTrees);
    const first =
      swapBranchFromWorkout(
        workout,
        "98001",
        generateReplacement("98003", "161"),
      ) ?? [];

    const second =
      swapBranchFromWorkout(
        { ...workout, session: first },
        "98002",
        generateReplacement("98004", "164"),
      ) ?? [];

    // the saved day stores 98001 and 98002 only, so 98003 comes from the catalog
    expect(listTrainedBranchIds(second).sort()).toEqual(["98003", "98004"]);
    expect(second.filter(({ branchId }) => branchId === "98003")).toEqual(
      first.filter(({ branchId }) => branchId === "98003"),
    );
  });
});

describe("restoreBranchEntries", () => {
  const originalEntries = [
    generateSessionEntry("10", "e10", [1, 3]),
    generateSessionEntry("10", "e10", [2, 3]),
  ];
  const other = generateSessionEntry("5", "e5", [1, 1]);
  const swapped = [
    generateSessionEntry("20", "e20", [1, 2]),
    other,
    generateSessionEntry("20", "e20", [2, 2]),
  ];

  it("puts the original entries back at the set positions of the shown branch", () => {
    const restored = restoreBranchEntries(swapped, "20", originalEntries);

    expect(restored).toEqual([
      { ...originalEntries[0], set: [1, 2] },
      other,
      { ...originalEntries[1], set: [2, 2] },
    ]);
  });

  it("returns null when the original has another number of entries", () => {
    expect(
      restoreBranchEntries(swapped, "20", [originalEntries[0]]),
    ).toBeNull();
  });

  it("returns null when the shown branch is not in the session", () => {
    expect(restoreBranchEntries(swapped, "30", originalEntries)).toBeNull();
  });
});
