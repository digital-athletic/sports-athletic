import { loadExercises } from "@/data/loadExercises";
import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { TrainingType } from "@/features/training/models/Training";
import {
  generatePlanWorkoutForWeekday,
  generateWarmUpOnlyPlanUser,
} from "@test/factories/planWorkout";
import {
  listTrainedExercises,
  listTrainedSkills,
} from "@test/factories/setListDescription";
import { generateWorkout } from "./workoutGeneratorRouter";

const BUNDLED_LIFT_IDS = ["25", "50", "342", "297", "54"];

/**
 * Generates a workout of the type through the router, with no module mocked,
 * for the warm up only plan user at home with no equipment.
 *
 * generateWorkoutOf("MOB")
 * → [{ branchId: "2", exerciseId: "21", skill: "MOB", ... }, ...]
 */
const generateWorkoutOf = (type: TrainingType) =>
  generateWorkout({
    type,
    user: generateWarmUpOnlyPlanUser(),
    place: "HOME",
    exercises: loadExercises(),
    skillTrees: getAllSkillTrees(),
    weekday: 1,
    equipment: [],
    givenSection: undefined,
    daysSinceLastWorkout: 0,
    userExerciseData: { exerciseData: {}, branchData: {} },
  });

describe("generateWorkout: end to end", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(jest.restoreAllMocks);

  it("generates a short workout of MOB exercises", () => {
    const skills = listTrainedSkills(generateWorkoutOf("MOB"));

    expect(skills.length).toBeGreaterThan(0);
    expect(new Set(skills)).toEqual(new Set(["MOB"]));
  });

  it("generates the training day the plan stores for the weekday", () => {
    const setList = generatePlanWorkoutForWeekday(generateWarmUpOnlyPlanUser());

    expect(new Set(listTrainedSkills(setList))).toEqual(new Set(["WU"]));
    expect(setList[0]?.branchId).toBe("410");
  });

  it("generates the strength test with every bundled lift", () => {
    const trained = listTrainedExercises(generateWorkoutOf("TEST_WORKOUT"));

    expect(trained).toEqual(expect.arrayContaining(BUNDLED_LIFT_IDS));
  });
});
