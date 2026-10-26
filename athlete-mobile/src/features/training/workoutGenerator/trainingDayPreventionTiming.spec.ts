import type { GeneratedSetListEntry } from "@/features/training/models/SetListEntry";
import type { UserType } from "@/schemas/user.schema";
import { setUpAiwlGeneratorFlag } from "@test/factories/aiwlGeneratorFlag";
import {
  buildPlanUser,
  generateKneePreventionBranches,
  generatePlanWorkoutForWeekday,
  importTrees,
  PAUSE_ID,
} from "@test/factories/planWorkout";

const WUSPEZIAL_CLOSING_PAUSE = 30;

const pausesOf = (entries: GeneratedSetListEntry[], skill: string) =>
  entries
    .filter((entry) => entry.skill === skill && entry.exerciseId === PAUSE_ID)
    .map((entry) => entry.duration);

describe("training day prevention timing: special warm up before prevention", () => {
  setUpAiwlGeneratorFlag(true);

  beforeEach(() => {
    jest.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("closes the special warm up with 30 seconds before the prevention block", () => {
    const planUser = buildPlanUser({
      weekday: 1,
      skills: {
        PREVKNEE: generateKneePreventionBranches("PREV", 2),
        WUSPEZIAL: generateKneePreventionBranches("WUSPEZIAL", 3),
      },
      lengths: { PREVKNEE: 10, WUSPEZIAL: 5 },
    });
    const user: UserType = {
      ...planUser,
      workoutData: {
        tags: { LEVEL: ["ADVANCED"], PAIN: ["KNEE_LEFT"] },
      },
    };

    const result = generatePlanWorkoutForWeekday(user, {
      skillTrees: importTrees("WU", "WUSPEZIAL", "PREV", "PREVKG"),
    });
    const skills = result.map((entry) => entry.skill);
    const pauses = pausesOf(result, "WUSPEZIAL");

    expect(skills.lastIndexOf("WUSPEZIAL")).toBeLessThan(
      skills.indexOf("PREVKNEE"),
    );
    expect(pauses[pauses.length - 1]).toBe(WUSPEZIAL_CLOSING_PAUSE);
  });
});
