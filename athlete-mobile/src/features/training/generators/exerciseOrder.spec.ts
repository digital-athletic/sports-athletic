import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type {
  BranchExerciseReference,
  ExercisePair,
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

/**
 * Fakes the branch reference a plan hands to the training generator: a two sided
 * exercise with the id `e<id>` and the given tags.
 *
 * generateBranchReference("squat", ["REGION_LOWER_BODY"])
 * → { branchId: "squat", exerciseId: "esquat", branchTags: ["SIDE_BOTH", "REGION_LOWER_BODY"] }
 */
const generateBranchReference = (
  id: string,
  tags: string[],
): BranchExerciseReference => ({
  branchId: id,
  exerciseId: `e${id}`,
  branchTags: ["SIDE_BOTH", ...tags],
});

/**
 * Fakes a catalog exercise. A one sided exercise names its other side.
 *
 * generateCatalogExercise("lungeLeft", ["SIDE_ONE"], "lungeRight")
 * → { ...template, id: "lungeLeft", tags: ["SIDE_ONE"], otherSideExerciseId: "lungeRight" }
 */
const generateCatalogExercise = (
  id: string,
  tags: string[],
  otherSideExerciseId?: string,
): ExerciseType => ({ ...template, id, tags, otherSideExerciseId });

const REGION_TAGS = {
  F: "FULL_BODY",
  L: "LOWER_BODY",
  U: "UPPER_BODY",
  C: "CORE",
};
type RegionKey = keyof typeof REGION_TAGS;

/**
 * Fakes a unit with a single two sided exercise in the given region.
 *
 * generateUnit("legs", "L", "GLUTES")
 * → { first: { branchId: "legs", exerciseId: "elegs", branchTags: ["SIDE_BOTH", "REGION_LOWER_BODY", "MUSCLE_GLUTES"] } }
 */
const generateUnit = (
  id: string,
  region: RegionKey | null,
  ...muscles: string[]
): ExercisePair => ({
  first: generateBranchReference(id, [
    ...(region ? [`REGION_${REGION_TAGS[region]}`] : []),
    ...muscles.map((muscle) => `MUSCLE_${muscle}`),
  ]),
});

/**
 * Lists the region of each unit, "X" for a unit without a region.
 *
 * toRegionKeys([generateUnit("legs", "L", "GLUTES"), generateUnit("core", "C", "OBLIQUES")])
 * → "L C"
 */
const toRegionKeys = (units: ExercisePair[]) =>
  units
    .map((unit) => getTagValue(unit.first.branchTags, "REGION"))
    .map(
      (region) =>
        (Object.keys(REGION_TAGS) as RegionKey[]).find(
          (key) => REGION_TAGS[key] === region,
        ) ?? "X",
    )
    .join(" ");

const toBranchIds = (units: ExercisePair[]) =>
  units.map((unit) => unit.first.branchId);

const bigLegs = [
  generateUnit("legs1", "L", "GLUTES"),
  generateUnit("legs2", "L", "QUADRICEPS"),
  generateUnit("legs3", "L", "HAMSTRINGS"),
];
const smallUpper = [
  generateUnit("arms1", "U", "BICEPS"),
  generateUnit("arms2", "U", "TRICEPS"),
  generateUnit("arms3", "U", "SHOULDER_FRONT"),
];
const bigUpper = [
  generateUnit("push", "U", "CHEST"),
  generateUnit("pull", "U", "LATISSIMUS"),
  generateUnit("back", "U", "UPPER_BACK"),
];
const generateCoreUnits = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    generateUnit(
      `core${index}`,
      "C",
      index % 2 ? "OBLIQUES" : "RECTUS_ABDOMINIS",
    ),
  );

beforeEach(() => {
  jest.spyOn(Math, "random").mockReturnValue(0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createSetList: max strength order", () => {
  it("puts the lower body main lifts before the upper body main lifts", () => {
    const branches = [
      generateBranchReference("squat", [
        "REGION_LOWER_BODY",
        "MUSCLE_QUADRICEPS",
      ]),
      generateBranchReference("deadlift", [
        "REGION_LOWER_BODY",
        "MUSCLE_HAMSTRINGS",
      ]),
      generateBranchReference("bench", ["REGION_UPPER_BODY", "MUSCLE_CHEST"]),
      generateBranchReference("row", [
        "REGION_UPPER_BODY",
        "MUSCLE_LATISSIMUS",
      ]),
    ];
    const catalog = branches.map((branch) =>
      generateCatalogExercise(branch.exerciseId, branch.branchTags),
    );
    const generator = new TrainingGenerator();
    // Captures the ordered units and skips building the sets.
    const getSetListFromExercisePairs = jest
      .spyOn(generator, "getSetListFromExercisePairs")
      .mockReturnValue([]);

    generator.createSetList(
      [{ skill: "MAX_STRENGTH", branches, length: 30 }],
      catalog,
      {},
      user,
      "STUDIO",
      [],
      null,
    );

    const orderedUnits = getSetListFromExercisePairs.mock.calls[0][0];
    expect(toBranchIds(orderedUnits).slice(0, 2).sort()).toEqual([
      "deadlift",
      "squat",
    ]);
  });
});

describe("getExercisePairs and orderExerciseUnits: one sided exercises", () => {
  it.each([0, 0.5, 0.99])(
    "keeps the left and right side in one unit with random %s",
    (random) => {
      jest.mocked(Math.random).mockReturnValue(random);
      const lungeTags = ["SIDE_ONE", "REGION_LOWER_BODY", "MUSCLE_QUADRICEPS"];
      const pressTags = ["SIDE_ONE", "REGION_UPPER_BODY", "MUSCLE_CHEST"];
      const squat = generateBranchReference("squat", [
        "REGION_LOWER_BODY",
        "MUSCLE_QUADRICEPS",
      ]);
      const bench = generateBranchReference("bench", [
        "REGION_UPPER_BODY",
        "MUSCLE_CHEST",
      ]);
      // A plan hands over only the left side of a one sided exercise.
      const branches: BranchExerciseReference[] = [
        { branchId: "lunge", exerciseId: "lungeLeft", branchTags: lungeTags },
        { branchId: "press", exerciseId: "pressLeft", branchTags: pressTags },
        squat,
        bench,
      ];
      const catalog = [
        generateCatalogExercise("lungeLeft", lungeTags, "lungeRight"),
        generateCatalogExercise("lungeRight", lungeTags, "lungeLeft"),
        generateCatalogExercise("pressLeft", pressTags, "pressRight"),
        generateCatalogExercise("pressRight", pressTags, "pressLeft"),
        generateCatalogExercise(squat.exerciseId, squat.branchTags),
        generateCatalogExercise(bench.exerciseId, bench.branchTags),
      ];

      const units = new TrainingGenerator().getExercisePairs(
        "GKS",
        branches,
        catalog,
      );
      const orderedUnits = orderExerciseUnits(units, false);

      const unitIds = orderedUnits.map((unit) => [
        unit.first.exerciseId,
        unit.second?.exerciseId,
      ]);
      expect(unitIds).toContainEqual(["lungeLeft", "lungeRight"]);
      expect(unitIds).toContainEqual(["pressLeft", "pressRight"]);
    },
  );
});

describe("orderExerciseUnits: body region rotation", () => {
  it("rotates full body, lower body and upper body", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("full", "F", "GLUTES"),
        generateUnit("lower", "L", "QUADRICEPS"),
        generateUnit("upper1", "U", "CHEST"),
        generateUnit("upper2", "U", "LATISSIMUS"),
      ],
      false,
    );
    expect(toRegionKeys(orderedUnits)).toBe("F L U U");
  });

  it("changes the body region after each unit when another region is left", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("upper", "U", "CHEST"),
        generateUnit("lower1", "L", "GLUTES"),
        generateUnit("lower2", "L", "QUADRICEPS"),
      ],
      false,
    );
    expect(toRegionKeys(orderedUnits)).toBe("L U L");
  });

  it("avoids the same primary muscle in the directly following unit", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("lowerChest", "L", "CHEST"),
        generateUnit("upperChest", "U", "CHEST"),
        generateUnit("upperLat", "U", "LATISSIMUS"),
      ],
      false,
    );
    expect(toBranchIds(orderedUnits)).toEqual([
      "lowerChest",
      "upperLat",
      "upperChest",
    ]);
  });
});

describe("orderExerciseUnits: region alternation before muscle size", () => {
  it.each([0, 0.5, 0.99])(
    "alternates legs and core under upper body soreness with random %s",
    (random) => {
      jest.mocked(Math.random).mockReturnValue(random);
      const units = [
        ...bigLegs,
        generateUnit("legs4", "L", "GLUTES"),
        generateUnit("legs5", "L", "QUADRICEPS"),
        generateUnit("legs6", "L", "HAMSTRINGS"),
        ...generateCoreUnits(6),
      ];
      expect(toRegionKeys(orderExerciseUnits(units, false))).toBe(
        "L C L C L C L C L C L C",
      );
    },
  );

  it.each([0, 0.5, 0.99])(
    "alternates upper body and core under lower body soreness with random %s",
    (random) => {
      jest.mocked(Math.random).mockReturnValue(random);
      const orderedUnits = orderExerciseUnits(
        [...smallUpper, ...bigUpper, ...generateCoreUnits(6)],
        false,
      );
      expect(toRegionKeys(orderedUnits)).toBe("U C U C U C U C U C U C");
      const upperIds = toBranchIds(
        orderedUnits.filter((_, index) => index % 2 === 0),
      );
      expect(upperIds.slice(0, 3).sort()).toEqual(["back", "pull", "push"]);
    },
  );

  it("alternates regions even when one region holds only small muscle groups", () => {
    expect(
      toRegionKeys(orderExerciseUnits([...bigLegs, ...smallUpper], false)),
    ).toBe("L U L U L U");
  });

  it("orders big muscle groups before small ones inside each region", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("smallLegs1", "L", "CALVES"),
        generateUnit("smallLegs2", "L", "ADDUCTORS"),
        ...smallUpper.slice(0, 2),
        ...bigLegs.slice(0, 2),
        ...bigUpper.slice(0, 2),
      ],
      false,
    );
    expect(toRegionKeys(orderedUnits)).toBe("L U L U L U L U");
    expect(toBranchIds(orderedUnits)).toEqual([
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
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("chest1", "U", "CHEST"),
        generateUnit("chest2", "U", "CHEST", "TRICEPS"),
        generateUnit("biceps", "U", "BICEPS"),
      ],
      false,
    );
    expect(toBranchIds(orderedUnits)).toEqual(["chest1", "chest2", "biceps"]);
  });

  it("opens the skill with a big muscle group", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("calves", "L", "CALVES"),
        generateUnit("adductors", "L", "ADDUCTORS"),
        ...bigUpper.slice(0, 2),
      ],
      false,
    );
    expect(toRegionKeys(orderedUnits)).toBe("U L U L");
  });

  it("keeps big muscle groups before small ones across regions", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("core", "C", "RECTUS_ABDOMINIS"),
        generateUnit("upper", "U", "CHEST"),
      ],
      false,
    );
    expect(toBranchIds(orderedUnits)).toEqual(["upper", "core"]);
  });

  it("puts units without a body region last", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("untagged", null, "GLUTES"),
        ...bigLegs.slice(0, 2),
        smallUpper[0],
      ],
      false,
    );
    expect(toRegionKeys(orderedUnits)).toBe("L U L X");
  });

  it("puts lower body units first in max strength", () => {
    const orderedUnits = orderExerciseUnits(
      [
        bigUpper[0],
        generateUnit("calves", "L", "CALVES"),
        ...bigLegs.slice(0, 2),
      ],
      true,
    );
    expect(toBranchIds(orderedUnits)).toEqual([
      "legs1",
      "legs2",
      "calves",
      "push",
    ]);
  });

  it("opens with another big unit when the first one ended the previous skill", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("calves", "L", "CALVES"),
        generateUnit("adductors", "L", "ADDUCTORS"),
        ...bigUpper.slice(0, 2),
      ],
      false,
      "epush",
    );
    expect(toBranchIds(orderedUnits)).toEqual([
      "pull",
      "calves",
      "push",
      "adductors",
    ]);
  });

  it("opens with a small unit when the only big unit ended the previous skill", () => {
    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("calves", "L", "CALVES"),
        generateUnit("adductors", "L", "ADDUCTORS"),
        bigUpper[0],
      ],
      false,
      "epush",
    );
    expect(orderedUnits[0].first.branchId).toBe("calves");
  });
});

describe("orderExerciseUnits: both exercises of a superset pair count", () => {
  it("opens with another unit when the second exercise of a pair ended the previous skill", () => {
    const pushPullPair: ExercisePair = {
      first: generateBranchReference("push", [
        "REGION_UPPER_BODY",
        "MUSCLE_CHEST",
      ]),
      second: generateBranchReference("pull", [
        "REGION_UPPER_BODY",
        "MUSCLE_LATISSIMUS",
      ]),
    };
    const backUnit = generateUnit("back", "U", "UPPER_BACK");

    const orderedUnits = orderExerciseUnits(
      [pushPullPair, backUnit],
      false,
      "epull",
    );

    expect(toBranchIds(orderedUnits)).toEqual(["back", "push"]);
  });

  it("avoids a pair whose second exercise trains the body region just trained", () => {
    const legsUnit = generateUnit("legs", "L", "QUADRICEPS");
    const chestGlutesPair: ExercisePair = {
      first: generateBranchReference("push", [
        "REGION_UPPER_BODY",
        "MUSCLE_CHEST",
      ]),
      second: generateBranchReference("bridge", [
        "REGION_LOWER_BODY",
        "MUSCLE_GLUTES",
      ]),
    };
    const pullUnit = generateUnit("pull", "U", "LATISSIMUS");

    const orderedUnits = orderExerciseUnits(
      [legsUnit, chestGlutesPair, pullUnit],
      false,
    );

    expect(toBranchIds(orderedUnits)).toEqual(["legs", "pull", "push"]);
  });
});
