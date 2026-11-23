import { loadExercises } from "@/data/loadExercises";
import { generateGenerationInput } from "@test/factories/generationInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { describeSetListEntries } from "@test/factories/setListDescription";
import { generateStoredDayEntry } from "@test/factories/storedBranch";
import { generateStoredTrainingDay } from "@test/factories/storedTrainingDay";
import {
  generateBranchesBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { isPlaceholderBranch } from "@/features/training/models/IdTypes";
import { toExerciseBranch } from "@/features/training/utils/plannedBranches";
import { lookUpStoredBranchInCatalog } from "./blockHandlers/branches/storedBranchLookup";
import type { GenerationInput } from "./generationInput/generationInput";
import { readTrainingDayWorkout } from "./trainingDayWorkout";
import { generateSetListFromWorkout } from "./workoutGeneration";

const exerciseCatalog = loadExercises();

describe("trainingDayWorkout: set list of an AIWL training", () => {
  // the place holds weights, so GKS replaces from its own tree
  const generateInput = (): GenerationInput =>
    generateGenerationInput({
      exerciseCatalog,
      equipment: ["DUMBBELL", "BARBELL", "TREADMILL"],
      random: () => 0,
    });

  // Copies catalog branches into the entries a legacy training stores.
  const copyCatalogBranches = (input: GenerationInput, branchIds: string[]) =>
    branchIds.map((branchId) => {
      const indexed = input.branchLookupIndex.get(branchId);
      if (!indexed) throw new Error(`No catalog branch ${branchId}`);
      return toExerciseBranch({ branchId, branch: indexed.branch });
    });

  // no skill tree holds the branch ID 900001
  const workout = generateTemplate([
    generateBranchesBlock("GKS", ["510", "900001"], { duration: 600 }),
    generateBranchesBlock("CARDIO_5", ["576"], { duration: 1500 }),
  ]);

  it("generates its blocks with their durations and replaces a removed branch ID from the same skill", () => {
    const input = generateInput();
    const day = readTrainingDayWorkout(workout);

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      input,
    ).setList;

    expect([...new Set(setList.map(({ skill }) => skill))]).toEqual([
      "GKS",
      "CARDIO_5",
    ]);
    const strengthBranchIds = [
      ...new Set(
        setList
          .filter(
            ({ skill, branchId }) =>
              skill === "GKS" && !isPlaceholderBranch(branchId),
          )
          .map(({ branchId }) => branchId),
      ),
    ];
    // the set list builder orders the exercises and adds support exercises
    // under the placeholder branch
    expect(strengthBranchIds).toHaveLength(2);
    expect(strengthBranchIds).toContain("510");
    const replacement = strengthBranchIds.find((id) => id !== "510");
    expect(replacement).not.toBe("900001");
    expect(input.branchLookupIndex.get(replacement ?? "")?.skillTreeName).toBe(
      "GKS",
    );
    expect(
      setList
        .filter(({ skill }) => skill === "CARDIO_5")
        .map(({ branchId, duration }) => [branchId, duration]),
    ).toEqual([["576", 1500]]);
    // a legacy training of the same branches and minutes times the GKS block alike
    const legacyDay = readTrainingDayWorkout({
      skills: {
        GKS: copyCatalogBranches(input, ["510", replacement ?? ""]),
        CARDIO_5: copyCatalogBranches(input, ["576"]),
      },
      lengths: { GKS: 10, CARDIO_5: 25 },
    });
    expect(setList).toEqual(
      generateSetListFromWorkout(
        legacyDay.workout,
        legacyDay.lookUpBranch,
        generateInput(),
      ).setList,
    );
  });

  it("reads its branches from the catalog, not from a stored copy", () => {
    // the catalog trains exercise 39 on branch 576
    const day = readTrainingDayWorkout(
      generateTemplate([
        generateBranchesBlock("CARDIO_5", ["576"], { duration: 1500 }),
      ]),
    );

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      generateInput(),
    ).setList;

    expect(setList).toEqual([
      {
        branchId: "576",
        exerciseId: "39",
        set: [1, 1],
        skill: "CARDIO_5",
        duration: 1500,
      },
    ]);
  });
});

describe("trainingDayWorkout: readTrainingDayWorkout of an AIWL day", () => {
  // Blocks in the skill priority order the plan generator writes: SWR1, MOB, WU.
  // generateUnsortedAiwlDay() → { aiwl: 1, id: "day", blocks: [SWR1 block, MOB block, WU block], ... }
  const generateUnsortedAiwlDay = () =>
    generateTemplate([
      generateBranchesBlock("SWR1", ["1"]),
      generateBranchesBlock("MOB", ["2"]),
      generateBranchesBlock("WU", ["3"]),
    ]);

  it("returns the blocks of the day sorted by section order", () => {
    const { workout } = readTrainingDayWorkout(generateUnsortedAiwlDay());

    expect(workout.blocks.map(({ skill }) => skill)).toEqual([
      "MOB",
      "WU",
      "SWR1",
    ]);
  });

  it("returns the catalog lookup for the branches of the day", () => {
    const { lookUpBranch } = readTrainingDayWorkout(generateUnsortedAiwlDay());

    expect(lookUpBranch).toBe(lookUpStoredBranchInCatalog);
  });
});

describe("trainingDayWorkout: readTrainingDayWorkout of a legacy day", () => {
  // A stored day in the key order CD, WU, MAX.
  // generateUnsortedLegacyDay() → { skills: { CD: [entry 498], WU: [entry 410], MAX: [entry 520] }, lengths: { CD: 5, WU: 5, MAX: 10 } }
  const generateUnsortedLegacyDay = () =>
    generateStoredTrainingDay(
      { CD: ["498"], WU: ["410"], MAX: ["520"] },
      { CD: 5, WU: 5, MAX: 10 },
    );

  it("returns the stored day workout with its blocks sorted by section order", () => {
    const { workout } = readTrainingDayWorkout(generateUnsortedLegacyDay());

    expect(workout.blocks.map(({ kind, skill }) => [kind, skill])).toEqual([
      ["branches", "WU"],
      ["branches", "MAX"],
      ["branches", "CD"],
    ]);
  });

  it("returns a lookup that reads the saved copy of the day", () => {
    const day = generateUnsortedLegacyDay();

    const { lookUpBranch } = readTrainingDayWorkout(day);

    expect(
      lookUpBranch("WU", "410", generateGenerationInput({ exerciseCatalog })),
    ).toEqual(day.skills.WU?.[0]);
  });

  it("returns a lookup that reads no branch of the catalog the day did not save", () => {
    const { lookUpBranch } = readTrainingDayWorkout(
      generateUnsortedLegacyDay(),
    );

    expect(
      lookUpBranch("GKS", "510", generateGenerationInput({ exerciseCatalog })),
    ).toBeUndefined();
  });
});

describe("trainingDayWorkout: set list of a legacy training", () => {
  it("generates from the branch snapshot the stored day holds, not from the catalog", () => {
    // the catalog trains exercise 39 on branch 576; the stored day trains 721
    const day = readTrainingDayWorkout(
      generateStoredTrainingDay({ CARDIO_5: ["576"] }, { CARDIO_5: 25 }, "721"),
    );

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      generateGenerationInput({ exerciseCatalog, random: () => 0 }),
    ).setList;

    expect(setList).toEqual([
      {
        branchId: "576",
        exerciseId: "721",
        set: [1, 1],
        skill: "CARDIO_5",
        duration: 1500,
      },
    ]);
  });

  it("generates a branch the catalog removed from the stored day entry", () => {
    // no skill tree holds the branch ID 900001
    const day = readTrainingDayWorkout(
      generateStoredTrainingDay(
        { CARDIO_5: ["900001"] },
        { CARDIO_5: 25 },
        "721",
      ),
    );

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      generateGenerationInput({ exerciseCatalog, random: () => 0 }),
    ).setList;

    expect(setList).toEqual([
      {
        branchId: "900001",
        exerciseId: "721",
        set: [1, 1],
        skill: "CARDIO_5",
        duration: 1500,
      },
    ]);
  });

  it("runs fractional stored minutes as the same number of seconds", () => {
    const day = readTrainingDayWorkout(
      generateStoredTrainingDay(
        { CARDIO_5: ["576"] },
        { CARDIO_5: 12.5 },
        "721",
      ),
    );

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      generateGenerationInput({ exerciseCatalog, random: () => 0 }),
    ).setList;

    expect(setList.map(({ duration }) => duration)).toEqual([750]);
  });

  // the old generator runs stored minutes times 60 without rounding
  it("runs 0.01 stored minutes as 0.6 seconds like the old generator", () => {
    const day = readTrainingDayWorkout(
      generateStoredTrainingDay(
        { CARDIO_5: ["576"] },
        { CARDIO_5: 0.01 },
        "721",
      ),
    );

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      generateGenerationInput({ exerciseCatalog, random: () => 0 }),
    ).setList;

    expect(setList.map(({ duration }) => duration)).toEqual([0.6]);
  });

  it("drops a skill without branches when another skill fills the day", () => {
    const day = readTrainingDayWorkout(
      generateStoredTrainingDay(
        { WU: [], CARDIO_5: ["576"] },
        { WU: 5, CARDIO_5: 25 },
        "721",
      ),
    );

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      generateGenerationInput({ exerciseCatalog, random: () => 0 }),
    ).setList;

    expect(setList).toEqual([
      {
        branchId: "576",
        exerciseId: "721",
        set: [1, 1],
        skill: "CARDIO_5",
        duration: 1500,
      },
    ]);
  });

  it("swaps a cardio skill that lower body soreness blocks for CARDIO_5 of at most 20 minutes", () => {
    const day = readTrainingDayWorkout(
      generateStoredTrainingDay({ CARDIO_3: ["580"] }, { CARDIO_3: 30 }, "721"),
    );

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      generateGenerationInput({
        exerciseCatalog,
        soreMuscles: ["QUADRICEPS"],
        random: () => 0,
      }),
    ).setList;

    expect(setList).toEqual([
      {
        branchId: "576",
        exerciseId: "39",
        set: [1, 1],
        skill: "CARDIO_5",
        duration: 1200,
      },
    ]);
  });

  it("returns an empty set list for a day without skills", () => {
    const day = readTrainingDayWorkout(
      generateStoredTrainingDay({}, { BR: 5 }),
    );

    expect(
      generateSetListFromWorkout(
        day.workout,
        day.lookUpBranch,
        generateGenerationInput({ exerciseCatalog }),
      ).setList,
    ).toEqual([]);
  });

  it("throws the equipment error when the only skill holds no branch", () => {
    const day = readTrainingDayWorkout(
      generateStoredTrainingDay({ WU: [] }, { WU: 5 }),
    );

    const thrown = catchThrownValue(
      () =>
        generateSetListFromWorkout(
          day.workout,
          day.lookUpBranch,
          generateGenerationInput({ exerciseCatalog }),
        ).setList,
    );

    expect(thrown).toEqual({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
      params: [],
    });
  });

  // Pins the bundled exercises and skill catalog: a data change fails this
  // case without a logic regression.
  it("keeps the exercises, sets and rests of a mixed training day", () => {
    const day = readTrainingDayWorkout({
      skills: {
        WU: [
          generateStoredDayEntry("w1", [], "4"),
          generateStoredDayEntry("w2", [], "21"),
        ],
        BAS: [
          generateStoredDayEntry("b1", [], "1"),
          generateStoredDayEntry("b2", [], "23"),
        ],
        GKS: [
          generateStoredDayEntry("g1", [], "25"),
          generateStoredDayEntry("g2", [], "9"),
        ],
        PLYO: [
          generateStoredDayEntry("p1", [], "44"),
          generateStoredDayEntry("p2", [], "45"),
        ],
        MAX: [
          generateStoredDayEntry("m1", [], "8"),
          generateStoredDayEntry("m2", [], "27"),
        ],
        CARDIO_2: [
          generateStoredDayEntry("c1", [], "38"),
          generateStoredDayEntry("c2", [], "39"),
        ],
        CD: [generateStoredDayEntry("d1", [], "58")],
      },
      lengths: { CARDIO_2: 20 },
    });

    const setList = generateSetListFromWorkout(
      day.workout,
      day.lookUpBranch,
      generateGenerationInput({
        exerciseCatalog,
        random: generateSeededRandom(7),
      }),
    ).setList;

    expect(describeSetListEntries(setList)).toEqual([
      "45 1/2",
      "pause 180",
      "45 2/2",
      "pause 180",
      "44 1/2",
      "pause 180",
      "44 2/2",
      "pause 60",
      "21 1/1",
      "pause 10",
      "789 1/1",
      "pause 30",
      "4 1/1",
      "pause 30",
      "1 1/2",
      "pause 60",
      "1 2/2",
      "pause 60",
      "23 1/2",
      "pause 30",
      "790 1/2",
      "pause 30",
      "23 2/2",
      "pause 30",
      "790 2/2",
      "pause 60",
      "25 1/2",
      "pause 90",
      "25 2/2",
      "pause 60",
      "9 1/2",
      "pause 90",
      "9 2/2",
      "pause 60",
      "27 1/5",
      "pause 60",
      "27 2/5",
      "pause 60",
      "27 3/5",
      "pause 30",
      "215 3/5",
      "pause 60",
      "215 3/5",
      "pause 30",
      "27 4/5",
      "pause 30",
      "175 4/5",
      "pause 60",
      "175 4/5",
      "pause 30",
      "27 5/5",
      "pause 120",
      "8 1/5",
      "pause 60",
      "8 2/5",
      "pause 60",
      "8 3/5",
      "pause 30",
      "1090 3/5",
      "pause 60",
      "1091 3/5",
      "pause 30",
      "8 4/5",
      "pause 30",
      "392 4/5",
      "pause 60",
      "392 4/5",
      "pause 30",
      "8 5/5",
      "pause 120",
      "38 1/1",
      "38 1/3",
      "39 1/3",
      "38 2/3",
      "39 2/3",
      "38 3/3",
      "39 3/3",
      "38 1/1",
      "58 1/1",
    ]);
  });
});
