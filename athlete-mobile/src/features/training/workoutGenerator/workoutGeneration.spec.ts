import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { generateExercisesBlock } from "@test/factories/exercisesBlock";
import { generateRegionWarmUpTree } from "@test/factories/strengthTestWarmUp";
import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateSeededRandom } from "@test/factories/seededRandom";
import { listTrainedExercises } from "@test/factories/setListDescription";
import { generateLowerBodyBranch } from "@test/factories/skillTree";
import { generateStrengthTestInput } from "@test/factories/strengthTestInput";
import { generateStrengthTestTemplate } from "@test/factories/strengthTestTemplate";
import {
  generateShortTemplate,
  generateUntimedBranchesBlock,
} from "@test/factories/templateBlock";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateLowerBodyExercises } from "@test/factories/valueExercise";
import { lookUpStoredBranchInCatalog } from "./blockHandlers/branches/storedBranchLookup";
import { generateSetListFromWorkout } from "./workoutGeneration";

describe("workoutGeneration: generateSetListFromWorkout of a workout with test sets", () => {
  // Muscle soreness counts on the day the factory dates it.
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("throws TOO_MUCH_SORENESS TEST_WORKOUT for an athlete with muscle soreness before any draw", () => {
    const random = jest.fn(() => 0);
    const input = generateStrengthTestInput({
      soreMuscles: ["CHEST"],
      random,
    });

    const thrown = catchThrownValue(
      () =>
        generateSetListFromWorkout(
          generateStrengthTestTemplate(),
          lookUpStoredBranchInCatalog,
          input,
        ).setList,
    );

    expect(thrown).toEqual({
      type: "TOO_MUCH_SORENESS",
      subtype: "TEST_WORKOUT",
      params: [],
    });
    expect(random).not.toHaveBeenCalled();
  });

  it("throws NO_ANAMNESIS MISSING_WORKOUT_DATA for an athlete without workout data before any draw", () => {
    const random = jest.fn(() => 0);
    const input = generateStrengthTestInput({
      withoutWorkoutData: true,
      random,
    });

    const thrown = catchThrownValue(
      () =>
        generateSetListFromWorkout(
          generateStrengthTestTemplate(),
          lookUpStoredBranchInCatalog,
          input,
        ).setList,
    );

    expect(thrown).toEqual({
      type: "NO_ANAMNESIS",
      subtype: "MISSING_WORKOUT_DATA",
      params: [],
    });
    expect(random).not.toHaveBeenCalled();
  });

  it("throws NO_EXERCISES SKILL_TREE when the warm up draws no exercise", () => {
    const input = generateStrengthTestInput({
      random: generateSeededRandom(7),
    });

    const thrown = catchThrownValue(
      () =>
        generateSetListFromWorkout(
          generateStrengthTestTemplate(),
          lookUpStoredBranchInCatalog,
          input,
          { skillTrees: {} },
        ).setList,
    );

    expect(thrown).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: ["WU"],
    });
  });

  it("throws NO_EXERCISES EQUIPMENT for a lift the place cannot equip when every filter applies", () => {
    const input = generateStrengthTestInput({
      equipment: [],
      random: generateSeededRandom(7),
    });

    const thrown = catchThrownValue(
      () =>
        generateSetListFromWorkout(
          generateStrengthTestTemplate({ exercises: ["25"] }),
          lookUpStoredBranchInCatalog,
          input,
          { skillTrees: getAllSkillTrees() },
        ).setList,
    );

    expect(thrown).toMatchObject({
      type: "NO_EXERCISES",
      subtype: "EQUIPMENT",
    });
  });

  it("trains a lift the place cannot equip when the equipment filter is off", () => {
    const input = generateStrengthTestInput({
      equipment: [],
      random: generateSeededRandom(7),
    });

    const setList = generateSetListFromWorkout(
      generateStrengthTestTemplate({ exercises: ["25"] }),
      lookUpStoredBranchInCatalog,
      input,
      { skillTrees: getAllSkillTrees(), filters: { equipment: false } },
    ).setList;

    expect(listTrainedExercises(setList)).toContain("25");
  });

  it("throws NO_EXERCISES PAIN when knee pain blocks every warm up branch and every filter applies", () => {
    const input = generateStrengthTestInput({
      pains: ["KNEE_LEFT"],
      random: generateSeededRandom(7),
    });

    const thrown = catchThrownValue(
      () =>
        generateSetListFromWorkout(
          generateStrengthTestTemplate(),
          lookUpStoredBranchInCatalog,
          input,
          { skillTrees: { WU: generateRegionWarmUpTree(["BLOCK_KNEE"]) } },
        ).setList,
    );

    expect(thrown).toMatchObject({ type: "NO_EXERCISES", subtype: "PAIN" });
  });

  it("fills the warm up when knee pain blocks every warm up branch and the pain filter is off", () => {
    const input = generateStrengthTestInput({
      pains: ["KNEE_LEFT"],
      random: generateSeededRandom(7),
    });

    const setList = generateSetListFromWorkout(
      generateStrengthTestTemplate(),
      lookUpStoredBranchInCatalog,
      input,
      {
        skillTrees: { WU: generateRegionWarmUpTree(["BLOCK_KNEE"]) },
        filters: { pain: false },
      },
    ).setList;

    expect(
      setList.filter(
        (entry) => entry.skill === "WU" && entry.branchId !== "-1",
      ),
    ).not.toHaveLength(0);
  });
});

describe("workoutGeneration: generateSetListFromWorkout with the soreness filter off", () => {
  // Muscle soreness counts on the day the factory dates it.
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("trains the listed branch of a sore region", () => {
    // both BAS branches train the lower body, which sore quadriceps block
    const skillTrees = {
      BAS: {
        "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }),
        "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const workout = generateShortTemplate([
      generateUntimedBranchesBlock("BAS", { branches: ["1"] }),
    ]);

    const setList = generateSetListFromWorkout(
      workout,
      lookUpStoredBranchInCatalog,
      generateRuleFamilyInput({
        exerciseCatalog: generateLowerBodyExercises(["e1", "e2"]),
        skillTrees,
        soreMuscles: ["QUADRICEPS"],
        random: () => 0,
      }),
      { skillTrees, filters: { soreness: false } },
    ).setList;

    expect([...new Set(listTrainedExercises(setList))]).toEqual(["e1"]);
  });
});

describe("workoutGeneration: generateSetListFromWorkout of a short workout", () => {
  it("trains a replacement branch of the same skill when pain blocks every listed branch", () => {
    // MOB branch 1 is blocked for knee pain, branch 2 is free
    const skillTrees = {
      MOB: {
        "1": generateLowerBodyBranch({ 1: { exerciseId: "e1" } }, [
          "BLOCK_KNEE",
        ]),
        "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }),
      },
    };
    const workout = generateShortTemplate([
      generateUntimedBranchesBlock("MOB", { branches: ["1"] }),
    ]);

    const setList = generateSetListFromWorkout(
      workout,
      lookUpStoredBranchInCatalog,
      generateRuleFamilyInput({
        exerciseCatalog: generateLowerBodyExercises(["e1", "e2"]),
        skillTrees,
        pains: ["KNEE_LEFT"],
        random: () => 0,
      }),
      { skillTrees },
    ).setList;

    expect(listTrainedExercises(setList)).toEqual(["e2"]);
  });

  it("trains a replacement branch of the same skill for a branch ID the catalog lacks", () => {
    // no skill tree holds the branch ID 900001
    const skillTrees = {
      MOB: { "2": generateLowerBodyBranch({ 1: { exerciseId: "e2" } }) },
    };
    const workout = generateShortTemplate([
      generateUntimedBranchesBlock("MOB", { branches: ["900001"] }),
    ]);

    const setList = generateSetListFromWorkout(
      workout,
      lookUpStoredBranchInCatalog,
      generateRuleFamilyInput({
        exerciseCatalog: generateLowerBodyExercises(["e2"]),
        skillTrees,
        random: () => 0,
      }),
      { skillTrees },
    ).setList;

    expect(listTrainedExercises(setList)).toEqual(["e2"]);
  });

  it("throws OTHER BLOCK_KIND for an exercises block without test sets", () => {
    const workout = generateShortTemplate([generateExercisesBlock(["25"])]);

    const thrown = catchThrownValue(
      () =>
        generateSetListFromWorkout(
          workout,
          lookUpStoredBranchInCatalog,
          generateRuleFamilyInput(),
        ).setList,
    );

    expect(thrown).toStrictEqual({
      type: "OTHER",
      subtype: "BLOCK_KIND",
      params: ["short.blocks[0]", "exercises"],
    });
  });
});
