import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { UserType } from "@/schemas/user.schema";
import { nextWeek, today } from "../../../../test/factories/planWorkout";
import TrainingGenerator from "./TrainingGenerator";

const beginner: UserType = {
  userId: "short-workout-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["BEGINNER"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const branch = (tags: string[], exerciseId: string): SkillTreeType[string] => ({
  tags,
  levels: { 1: { exerciseId } },
});

const emptyValue = {
  startValue: { default: {}, m: {}, w: {}, k: {} },
  targetValue: { default: {}, m: {}, w: {}, k: {} },
};

const exerciseWithTags = (id: string, tags: string[]): ExerciseType => ({
  id,
  level: { m: 1, w: 1 },
  name: `Exercise ${id}`,
  displayName: `Exercise ${id}`,
  description: "",
  picture: "",
  video: "",
  tags,
  values: {
    duration: emptyValue,
    repetition: emptyValue,
    height: emptyValue,
    weight: emptyValue,
  },
  isAdvanceByReps: false,
  isAdvanceByDuration: false,
  isJump: false,
});

const selectedBranches = (
  type: string,
  skillTrees: { [skillName: string]: SkillTreeType },
  options: {
    user?: UserType;
    equipment?: string[];
    exercises?: ExerciseType[];
  } = {},
) => {
  const generator = new TrainingGenerator();
  const spy = jest.spyOn(generator, "getExercisePairs").mockReturnValue([]);
  generator.generateShortWorkout(
    type,
    options.user ?? beginner,
    "HOME",
    options.exercises ?? [],
    skillTrees,
    options.equipment ?? [],
    { exerciseData: {}, branchData: {} },
  );
  const [, branches] = spy.mock.calls[0];
  return branches;
};

const slotCount = (branches: { branchTags: string[] }[]): number =>
  branches.reduce(
    (slots, { branchTags }) =>
      slots + (branchTags.includes("SIDE_ONE") ? 2 : 1),
    0,
  );

describe("generateShortWorkout: selection", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("never draws the same exercise twice", () => {
    const tags = ["SKILL_MOB", "REGION_CORE", "SIDE_BOTH"];
    const branches = selectedBranches("MOB", {
      MOB: { "500": branch(tags, "501"), "600": branch(tags, "501") },
    });
    expect(branches.map((b) => b.exerciseId)).toEqual(["501"]);
  });

  it("fills at most 10 slots in a warm up when a one sided branch comes last", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const bothSided = ["SKILL_WU", "REGION_CORE", "SIDE_BOTH"];
    const tree: SkillTreeType = {};
    for (let id = 10; id < 19; id++) {
      tree[`${id}`] = branch(bothSided, `${id}0`);
    }
    tree["99"] = branch(["SKILL_WU", "REGION_CORE", "SIDE_ONE"], "990");

    const branches = selectedBranches("WU", { WU: tree });
    expect(slotCount(branches)).toBeLessThanOrEqual(10);
  });

  it("draws 4 exercises from any region for full body stability with weights", () => {
    const tree: SkillTreeType = {};
    for (let id = 10; id < 16; id++) {
      tree[`${id}`] = branch(
        ["SKILL_GKS", "REGION_UPPER_BODY", "SIDE_BOTH"],
        `${id}0`,
      );
      tree[`${id + 10}`] = branch(
        ["SKILL_GKS", "REGION_LOWER_BODY", "SIDE_BOTH"],
        `${id + 10}0`,
      );
    }

    const branches = selectedBranches(
      "GKS",
      { GKS: tree },
      { equipment: ["DUMBBELL"] },
    );
    expect(branches).toHaveLength(4);
  });

  it("ignores muscle soreness", () => {
    const sore: UserType = {
      ...beginner,
      temporalData: [
        { date: today, expiration: nextWeek, tag: "QUADRICEPS" },
        { date: today, expiration: nextWeek, tag: "CHEST" },
      ],
    };
    const branches = selectedBranches(
      "MOB",
      {
        MOB: {
          "500": branch(["SKILL_MOB", "REGION_LOWER_BODY", "SIDE_BOTH"], "501"),
        },
      },
      { user: sore },
    );
    expect(branches.map((b) => b.exerciseId)).toEqual(["501"]);
  });

  it("keeps a both sided prevention exercise without a partner instead of swapping it for a one sided one", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);
    const prevention = ["SKILL_PREVENTION", "PREVENTION_KNEE_HIP"];
    const branches = selectedBranches(
      "PREVKNEE",
      {
        PREVKG: {
          "10": branch([...prevention, "REGION_LOWER_BODY", "SIDE_BOTH"], "11"),
          "20": branch([...prevention, "REGION_LOWER_BODY", "SIDE_ONE"], "21"),
        },
        WUSPEZIAL: {
          "90": branch(
            ["SKILL_WARM_UP_SPECIAL", "PREVENTION_KNEE_HIP", "SIDE_BOTH"],
            "91",
          ),
        },
      },
      {
        exercises: [
          exerciseWithTags("11", ["SIDE_BOTH"]),
          exerciseWithTags("21", ["SIDE_ONE"]),
        ],
      },
    );
    expect(branches.map((b) => b.branchId)).toContain("10");
  });
});
