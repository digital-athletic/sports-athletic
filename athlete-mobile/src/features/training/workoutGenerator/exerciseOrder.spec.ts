import type {
  BranchExerciseReference,
  ExercisePair,
} from "@/features/training/models/ExerciseBranch";
import { getTagValue } from "@/utils/tagUtils";
import { generateSequenceRandom } from "../../../../test/factories/sequenceRandom";
import { orderExerciseUnits, readEndingExerciseId } from "./exerciseOrder";

/**
 * Fakes a two sided branch reference with the exercise ID `e<id>`.
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

const REGION_TAGS = {
  F: "FULL_BODY",
  L: "LOWER_BODY",
  U: "UPPER_BODY",
  C: "CORE",
};
type RegionKey = keyof typeof REGION_TAGS;

/**
 * Fakes a unit with one two sided exercise in the given region.
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
 * Builds core units that alternate rectus abdominis and obliques.
 *
 * generateCoreUnits(2) → [generateUnit("core0", "C", "RECTUS_ABDOMINIS"), generateUnit("core1", "C", "OBLIQUES")]
 */
const generateCoreUnits = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    generateUnit(
      `core${index}`,
      "C",
      index % 2 ? "OBLIQUES" : "RECTUS_ABDOMINIS",
    ),
  );

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

/**
 * Orders the units with one draw of the given value per unit.
 *
 * orderWithDraws([legs, core], { lowerBodyFirst: false }, 0) draws 0 twice
 */
const orderWithDraws = (
  units: ExercisePair[],
  order: { lowerBodyFirst: boolean; previousExerciseId?: string },
  draw = 0,
) =>
  orderExerciseUnits(
    units,
    order,
    generateSequenceRandom(units.map(() => draw)),
  );

const generateBigLegUnits = () => [
  generateUnit("legs1", "L", "GLUTES"),
  generateUnit("legs2", "L", "QUADRICEPS"),
  generateUnit("legs3", "L", "HAMSTRINGS"),
];
const generateSmallUpperUnits = () => [
  generateUnit("arms1", "U", "BICEPS"),
  generateUnit("arms2", "U", "TRICEPS"),
  generateUnit("arms3", "U", "SHOULDER_FRONT"),
];
const generateBigUpperUnits = () => [
  generateUnit("push", "U", "CHEST"),
  generateUnit("pull", "U", "LATISSIMUS"),
  generateUnit("back", "U", "UPPER_BACK"),
];
const noPrevious = { lowerBodyFirst: false };

describe("exerciseOrder: random draw", () => {
  it("draws once per unit and picks among the remaining candidates by the draw", () => {
    const random = jest.fn(generateSequenceRandom([0.5, 0]));

    const orderedUnits = orderExerciseUnits(
      [
        generateUnit("push", "U", "CHEST"),
        generateUnit("pull", "U", "LATISSIMUS"),
      ],
      noPrevious,
      random,
    );

    expect(toBranchIds(orderedUnits)).toEqual(["pull", "push"]);
    expect(random).toHaveBeenCalledTimes(2);
  });
});

describe("exerciseOrder: body region rotation", () => {
  it("rotates full body, lower body and upper body", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("full", "F", "GLUTES"),
        generateUnit("lower", "L", "QUADRICEPS"),
        generateUnit("upper1", "U", "CHEST"),
        generateUnit("upper2", "U", "LATISSIMUS"),
      ],
      noPrevious,
    );
    expect(toRegionKeys(orderedUnits)).toBe("F L U U");
  });

  it("changes the body region after each unit when another region is left", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("upper", "U", "CHEST"),
        generateUnit("lower1", "L", "GLUTES"),
        generateUnit("lower2", "L", "QUADRICEPS"),
      ],
      noPrevious,
    );
    expect(toRegionKeys(orderedUnits)).toBe("L U L");
  });

  it("avoids the same primary muscle in the directly following unit", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("lowerChest", "L", "CHEST"),
        generateUnit("upperChest", "U", "CHEST"),
        generateUnit("upperLat", "U", "LATISSIMUS"),
      ],
      noPrevious,
    );
    expect(toBranchIds(orderedUnits)).toEqual([
      "lowerChest",
      "upperLat",
      "upperChest",
    ]);
  });
});

describe("exerciseOrder: region alternation before muscle size", () => {
  it("alternates legs and core under upper body soreness for any draw", () => {
    const units = [
      ...generateBigLegUnits(),
      generateUnit("legs4", "L", "GLUTES"),
      generateUnit("legs5", "L", "QUADRICEPS"),
      generateUnit("legs6", "L", "HAMSTRINGS"),
      ...generateCoreUnits(6),
    ];
    expect(toRegionKeys(orderWithDraws(units, noPrevious, 0.99))).toBe(
      "L C L C L C L C L C L C",
    );
  });

  it("alternates upper body and core under lower body soreness for any draw", () => {
    const orderedUnits = orderWithDraws(
      [
        ...generateSmallUpperUnits(),
        ...generateBigUpperUnits(),
        ...generateCoreUnits(6),
      ],
      noPrevious,
      0.99,
    );
    expect(toRegionKeys(orderedUnits)).toBe("U C U C U C U C U C U C");
    const upperIds = toBranchIds(
      orderedUnits.filter((_, index) => index % 2 === 0),
    );
    expect(upperIds.slice(0, 3).sort()).toEqual(["back", "pull", "push"]);
  });

  it("alternates regions even when one region holds only small muscle groups", () => {
    const orderedUnits = orderWithDraws(
      [...generateBigLegUnits(), ...generateSmallUpperUnits()],
      noPrevious,
    );
    expect(toRegionKeys(orderedUnits)).toBe("L U L U L U");
  });

  it("orders big muscle groups before small ones inside each region", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("smallLegs1", "L", "CALVES"),
        generateUnit("smallLegs2", "L", "ADDUCTORS"),
        ...generateSmallUpperUnits().slice(0, 2),
        ...generateBigLegUnits().slice(0, 2),
        ...generateBigUpperUnits().slice(0, 2),
      ],
      noPrevious,
    );
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
    const orderedUnits = orderWithDraws(
      [
        generateUnit("chest1", "U", "CHEST"),
        generateUnit("chest2", "U", "CHEST", "TRICEPS"),
        generateUnit("biceps", "U", "BICEPS"),
      ],
      noPrevious,
    );
    expect(toBranchIds(orderedUnits)).toEqual(["chest1", "chest2", "biceps"]);
  });

  it("opens the skill with a big muscle group", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("calves", "L", "CALVES"),
        generateUnit("adductors", "L", "ADDUCTORS"),
        ...generateBigUpperUnits().slice(0, 2),
      ],
      noPrevious,
    );
    expect(toRegionKeys(orderedUnits)).toBe("U L U L");
  });

  it("keeps big muscle groups before small ones across regions", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("core", "C", "RECTUS_ABDOMINIS"),
        generateUnit("upper", "U", "CHEST"),
      ],
      noPrevious,
    );
    expect(toBranchIds(orderedUnits)).toEqual(["upper", "core"]);
  });

  it("puts units without a body region last", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("untagged", null, "GLUTES"),
        ...generateBigLegUnits().slice(0, 2),
        generateSmallUpperUnits()[0],
      ],
      noPrevious,
    );
    expect(toRegionKeys(orderedUnits)).toBe("L U L X");
  });

  it("puts lower body units first in max strength", () => {
    const orderedUnits = orderWithDraws(
      [
        generateBigUpperUnits()[0],
        generateUnit("calves", "L", "CALVES"),
        ...generateBigLegUnits().slice(0, 2),
      ],
      { lowerBodyFirst: true },
    );
    expect(toBranchIds(orderedUnits)).toEqual([
      "legs1",
      "legs2",
      "calves",
      "push",
    ]);
  });
});

describe("exerciseOrder: skill boundary", () => {
  it("opens with another big unit when the first one ended the previous skill", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("calves", "L", "CALVES"),
        generateUnit("adductors", "L", "ADDUCTORS"),
        ...generateBigUpperUnits().slice(0, 2),
      ],
      { lowerBodyFirst: false, previousExerciseId: "epush" },
    );
    expect(toBranchIds(orderedUnits)).toEqual([
      "pull",
      "calves",
      "push",
      "adductors",
    ]);
  });

  it("opens with a small unit when the only big unit ended the previous skill", () => {
    const orderedUnits = orderWithDraws(
      [
        generateUnit("calves", "L", "CALVES"),
        generateUnit("adductors", "L", "ADDUCTORS"),
        generateBigUpperUnits()[0],
      ],
      { lowerBodyFirst: false, previousExerciseId: "epush" },
    );
    expect(orderedUnits[0].first.branchId).toBe("calves");
  });
});

describe("exerciseOrder: both exercises of a superset pair count", () => {
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

    const orderedUnits = orderWithDraws(
      [pushPullPair, generateUnit("back", "U", "UPPER_BACK")],
      { lowerBodyFirst: false, previousExerciseId: "epull" },
    );

    expect(toBranchIds(orderedUnits)).toEqual(["back", "push"]);
  });

  it("avoids a pair whose second exercise trains the body region just trained", () => {
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

    const orderedUnits = orderWithDraws(
      [
        generateUnit("legs", "L", "QUADRICEPS"),
        chestGlutesPair,
        generateUnit("pull", "U", "LATISSIMUS"),
      ],
      noPrevious,
    );

    expect(toBranchIds(orderedUnits)).toEqual(["legs", "pull", "push"]);
  });
});

describe("exerciseOrder: readEndingExerciseId", () => {
  const pair: ExercisePair = {
    first: generateBranchReference("push", []),
    second: generateBranchReference("pull", []),
  };

  it.each<[string, ExercisePair[], string]>([
    ["the second exercise of the last pair", [pair], "epull"],
    [
      "the single exercise of the last unit",
      [pair, generateUnit("back", "U")],
      "eback",
    ],
    ["the fallback without units", [], "eprevious"],
  ])("reads %s", (_, units, expected) => {
    expect(readEndingExerciseId(units, "eprevious")).toBe(expected);
  });
});
