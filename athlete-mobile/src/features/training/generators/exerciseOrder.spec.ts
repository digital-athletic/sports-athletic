import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type {
  BranchExerciseReference,
  ExercisePair,
  SkillBranchList,
} from "@/features/training/models/ExerciseBranch";
import { orderExerciseUnits } from "@/features/training/utils/exerciseOrderUtils";
import type { ExerciseType } from "@/schemas/exercise.schema";
import type { UserType } from "@/schemas/user.schema";
import { getTagValue } from "@/utils/tagUtils";
import ExercisesData from "../../../../assets/data/generator/Exercises.json";
import TrainingGenerator from "./TrainingGenerator";

const template = ExercisesData[0] as ExerciseType;

const user: UserType = {
  userId: "order-user",
  personalData: { gender: "MALE", birthday: "1990-01-01" },
  workoutData: {
    tags: { LEVEL: ["ADVANCED"] },
    maxValues: DEFAULT_MAX_VALUES,
  },
  temporalData: [],
};

const ref = (id: string, tags: string[]): BranchExerciseReference => ({
  branchId: id,
  exerciseId: `e${id}`,
  branchTags: ["SIDE_BOTH", ...tags],
});

const orderedPairs = (
  skill: SkillBranchList["skill"],
  branches: BranchExerciseReference[],
): ExercisePair[] => {
  const generator = new TrainingGenerator();
  const spy = jest
    .spyOn(generator, "getSetListFromExercisePairs")
    .mockReturnValue([]);
  const exercises = branches.map((entry) => ({
    ...template,
    id: entry.exerciseId,
    tags: entry.branchTags,
    otherSideExerciseId: undefined,
  }));
  generator.createSetList(
    [{ skill, branches, length: 30 }],
    exercises,
    {},
    user,
    "STUDIO",
    [],
    null,
  );
  return spy.mock.calls[0][0];
};

const leadIds = (pairs: ExercisePair[]) =>
  pairs.map((pair) => pair.first.branchId);

const leadRegions = (pairs: ExercisePair[]) =>
  pairs.map((pair) => getTagValue(pair.first.branchTags, "REGION"));

const squat = ref("squat", ["REGION_LOWER_BODY", "MUSCLE_QUADRICEPS"]);
const deadlift = ref("deadlift", ["REGION_LOWER_BODY", "MUSCLE_HAMSTRINGS"]);
const bench = ref("bench", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]);
const row = ref("row", ["REGION_UPPER_BODY", "MUSCLE_LATISSIMUS"]);

beforeEach(() => {
  jest.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createSetList: max strength order", () => {
  it("puts the lower body main lifts before the upper body main lifts", () => {
    const pairs = orderedPairs("MAX_STRENGTH", [squat, deadlift, bench, row]);
    expect(leadIds(pairs).slice(0, 2).sort()).toEqual(["deadlift", "squat"]);
  });
});

describe("createSetList: body region rotation", () => {
  it("rotates full body, lower body and upper body", () => {
    const pairs = orderedPairs("GKS", [
      ref("full", ["REGION_FULL_BODY", "MUSCLE_GLUTES"]),
      ref("lower", ["REGION_LOWER_BODY", "MUSCLE_QUADRICEPS"]),
      ref("upper1", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
      ref("upper2", ["REGION_UPPER_BODY", "MUSCLE_LATISSIMUS"]),
    ]);
    expect(leadRegions(pairs)).toEqual([
      "FULL_BODY",
      "LOWER_BODY",
      "UPPER_BODY",
      "UPPER_BODY",
    ]);
  });

  it("changes the body region after each unit when another region is left", () => {
    const pairs = orderedPairs("GKS", [
      ref("upper", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
      ref("lower1", ["REGION_LOWER_BODY", "MUSCLE_GLUTES"]),
      ref("lower2", ["REGION_LOWER_BODY", "MUSCLE_QUADRICEPS"]),
    ]);
    expect(leadRegions(pairs)).toEqual([
      "LOWER_BODY",
      "UPPER_BODY",
      "LOWER_BODY",
    ]);
  });

  it("avoids the same primary muscle in the directly following unit", () => {
    const pairs = orderedPairs("GKS", [
      ref("lowerChest", ["REGION_LOWER_BODY", "MUSCLE_CHEST"]),
      ref("upperChest", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
      ref("upperLat", ["REGION_UPPER_BODY", "MUSCLE_LATISSIMUS"]),
    ]);
    expect(leadIds(pairs)).toEqual(["lowerChest", "upperLat", "upperChest"]);
  });

  it("keeps big muscle groups before small ones", () => {
    const pairs = orderedPairs("GKS", [
      ref("core", ["REGION_CORE", "MUSCLE_RECTUS_ABDOMINIS"]),
      ref("upper", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
    ]);
    expect(leadIds(pairs)).toEqual(["upper", "core"]);
  });
});

const REGION_TAGS = { L: "LOWER_BODY", U: "UPPER_BODY", C: "CORE" };
type RegionKey = keyof typeof REGION_TAGS;

const unit = (
  id: string,
  region: RegionKey | null,
  ...muscles: string[]
): ExercisePair => ({
  first: ref(id, [
    ...(region ? [`REGION_${REGION_TAGS[region]}`] : []),
    ...muscles.map((muscle) => `MUSCLE_${muscle}`),
  ]),
});

const regionKeys = (units: ExercisePair[]) =>
  units
    .map((entry) => getTagValue(entry.first.branchTags, "REGION"))
    .map(
      (region) =>
        (Object.keys(REGION_TAGS) as RegionKey[]).find(
          (key) => REGION_TAGS[key] === region,
        ) ?? "X",
    )
    .join(" ");

const bigLegs = [
  unit("legs1", "L", "GLUTES"),
  unit("legs2", "L", "QUADRICEPS"),
  unit("legs3", "L", "HAMSTRINGS"),
];
const smallUpper = [
  unit("arms1", "U", "BICEPS"),
  unit("arms2", "U", "TRICEPS"),
  unit("arms3", "U", "SHOULDER_FRONT"),
];
const bigUpper = [
  unit("push", "U", "CHEST"),
  unit("pull", "U", "LATISSIMUS"),
  unit("back", "U", "UPPER_BACK"),
];
const core = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    unit(`core${index}`, "C", index % 2 ? "OBLIQUES" : "RECTUS_ABDOMINIS"),
  );

describe("orderExerciseUnits: region alternation before muscle size", () => {
  it.each([0, 0.5, 0.99])(
    "alternates legs and core under upper body soreness with random %s",
    (random) => {
      jest.mocked(Math.random).mockReturnValue(random);
      const units = [
        ...bigLegs,
        unit("legs4", "L", "GLUTES"),
        unit("legs5", "L", "QUADRICEPS"),
        unit("legs6", "L", "HAMSTRINGS"),
        ...core(6),
      ];
      expect(regionKeys(orderExerciseUnits(units, false))).toBe(
        "L C L C L C L C L C L C",
      );
    },
  );

  it.each([0, 0.5, 0.99])(
    "alternates upper body and core under lower body soreness with random %s",
    (random) => {
      jest.mocked(Math.random).mockReturnValue(random);
      const ordered = orderExerciseUnits(
        [...smallUpper, ...bigUpper, ...core(6)],
        false,
      );
      expect(regionKeys(ordered)).toBe("U C U C U C U C U C U C");
      const upperIds = ordered
        .filter((_, index) => index % 2 === 0)
        .map((entry) => entry.first.branchId);
      expect(upperIds.slice(0, 3).sort()).toEqual(["back", "pull", "push"]);
    },
  );

  it("alternates regions even when one region holds only small muscle groups", () => {
    expect(
      regionKeys(orderExerciseUnits([...bigLegs, ...smallUpper], false)),
    ).toBe("L U L U L U");
  });

  it("orders big muscle groups before small ones inside each region", () => {
    const ordered = orderExerciseUnits(
      [
        unit("smallLegs1", "L", "CALVES"),
        unit("smallLegs2", "L", "ADDUCTORS"),
        ...smallUpper.slice(0, 2),
        ...bigLegs.slice(0, 2),
        ...bigUpper.slice(0, 2),
      ],
      false,
    );
    expect(regionKeys(ordered)).toBe("L U L U L U L U");
    expect(ordered.map((entry) => entry.first.branchId)).toEqual([
      "legs1",
      "push",
      "legs2",
      "pull",
      "smallLegs1",
      "arms1",
      "smallLegs2",
      "arms2",
    ]);
  });

  it("prefers a big muscle group over a fresh small one inside a region", () => {
    const ordered = orderExerciseUnits(
      [
        unit("chest1", "U", "CHEST"),
        unit("chest2", "U", "CHEST", "TRICEPS"),
        unit("biceps", "U", "BICEPS"),
      ],
      false,
    );
    expect(ordered.map((entry) => entry.first.branchId)).toEqual([
      "chest1",
      "chest2",
      "biceps",
    ]);
  });

  it("opens the skill with a big muscle group", () => {
    const ordered = orderExerciseUnits(
      [
        unit("calves", "L", "CALVES"),
        unit("adductors", "L", "ADDUCTORS"),
        ...bigUpper.slice(0, 2),
      ],
      false,
    );
    expect(regionKeys(ordered)).toBe("U L U L");
  });

  it("puts units without a body region last", () => {
    const ordered = orderExerciseUnits(
      [unit("untagged", null, "GLUTES"), ...bigLegs.slice(0, 2), smallUpper[0]],
      false,
    );
    expect(regionKeys(ordered)).toBe("L U L X");
  });

  it("puts lower body units first in max strength", () => {
    const ordered = orderExerciseUnits(
      [bigUpper[0], unit("calves", "L", "CALVES"), ...bigLegs.slice(0, 2)],
      true,
    );
    expect(ordered.map((entry) => entry.first.branchId)).toEqual([
      "legs1",
      "legs2",
      "calves",
      "push",
    ]);
  });

  it("opens with another big unit when the first one ended the previous skill", () => {
    const ordered = orderExerciseUnits(
      [
        unit("calves", "L", "CALVES"),
        unit("adductors", "L", "ADDUCTORS"),
        ...bigUpper.slice(0, 2),
      ],
      false,
      "epush",
    );
    expect(ordered.map((entry) => entry.first.branchId)).toEqual([
      "pull",
      "calves",
      "push",
      "adductors",
    ]);
  });

  it("opens with a small unit when the only big unit ended the previous skill", () => {
    const ordered = orderExerciseUnits(
      [
        unit("calves", "L", "CALVES"),
        unit("adductors", "L", "ADDUCTORS"),
        bigUpper[0],
      ],
      false,
      "epush",
    );
    expect(ordered[0].first.branchId).toBe("calves");
  });
});
