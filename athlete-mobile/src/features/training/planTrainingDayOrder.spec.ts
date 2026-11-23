import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import {
  createAiwlPlan,
  createAiwlTraining,
} from "@/features/training/utils/testFixtures";
import { generateStoredDayEntry } from "@test/factories/storedBranch";
import {
  buildPlanUser,
  generateWarmUpOnlyPlanUser,
  realExercises,
} from "@test/factories/planWorkout";
import { listTrainedSkills } from "@test/factories/setListDescription";
import {
  generateBranchesBlock,
  generateTemplate,
} from "@test/factories/templateBlock";
import type { UserType } from "@/schemas/user.schema";
import {
  generateSetList,
  selectWorkout,
  type WorkoutGenerationRequest,
} from "./workoutGeneratorRouter";

// The plan generator writes an AIWL day in skill priority order, GKS before
// MOB and WU. A hand written day in section order would prove nothing.
// generateAiwlPlanUserOutOfOrder() → user whose Monday AIWL day holds the blocks GKS 510, MOB 2, WU 410
const generateAiwlPlanUserOutOfOrder = (): UserType => ({
  ...generateWarmUpOnlyPlanUser(),
  trainingPlan: createAiwlPlan([
    createAiwlTraining({
      workout: generateTemplate(
        [
          generateBranchesBlock("GKS", ["510"], { duration: 600 }),
          generateBranchesBlock("MOB", ["2"], { duration: 300 }),
          generateBranchesBlock("WU", ["410"], { duration: 300 }),
        ],
        { id: "TRAINING_DAY_1", name: { en: "Monday" } },
      ),
    }),
  ]),
});

// An old plan keeps its skills as a map, here in the key order WU, GKS, MOB.
// generateLegacyPlanUserOutOfOrder() → user whose Monday day stores WU 410, GKS g1, MOB m1
const generateLegacyPlanUserOutOfOrder = (): UserType =>
  buildPlanUser({
    weekday: 1,
    skills: {
      GKS: [generateStoredDayEntry("g1", [], "25")],
      MOB: [generateStoredDayEntry("m1", [], "21")],
    },
    lengths: { GKS: 10, MOB: 5 },
  });

describe("generateSetList: plan training day order", () => {
  afterEach(jest.restoreAllMocks);

  it("lists the skills of an AIWL plan day in section order", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);

    const request: WorkoutGenerationRequest = {
      type: "PLAN",
      user: generateAiwlPlanUserOutOfOrder(),
      place: "STUDIO",
      exercises: realExercises,
      skillTrees: getAllSkillTrees(),
      weekday: 1,
      equipment: ["DUMBBELL", "BARBELL"],
      givenSection: undefined,
      daysSinceLastWorkout: 0,
      userExerciseData: { exerciseData: {}, branchData: {} },
    };
    const setList = generateSetList(selectWorkout(request), request, {
      random: () => Math.random(),
    }).setList;

    expect([...new Set(listTrainedSkills(setList))]).toEqual([
      "MOB",
      "WU",
      "GKS",
    ]);
  });

  it("lists the skills of an old plan day in section order", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);

    const request: WorkoutGenerationRequest = {
      type: "PLAN",
      user: generateLegacyPlanUserOutOfOrder(),
      place: "STUDIO",
      exercises: realExercises,
      skillTrees: getAllSkillTrees(),
      weekday: 1,
      equipment: ["DUMBBELL", "BARBELL"],
      givenSection: undefined,
      daysSinceLastWorkout: 0,
      userExerciseData: { exerciseData: {}, branchData: {} },
    };
    const setList = generateSetList(selectWorkout(request), request, {
      random: () => Math.random(),
    }).setList;

    expect([...new Set(listTrainedSkills(setList))]).toEqual([
      "MOB",
      "WU",
      "GKS",
    ]);
  });
});
