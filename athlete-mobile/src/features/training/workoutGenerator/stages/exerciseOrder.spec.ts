import type { ExercisePair } from "@/features/training/models/ExerciseBranch";
import { getTagValue } from "@/utils/tagUtils";
import { generateBranchReference } from "@test/factories/branchReference";
import {
  generateBigLegUnits,
  generateBigUpperUnits,
  generateCoreUnits,
  generateExerciseUnit,
  generateSmallUpperUnits,
  REGION_TAGS,
  type RegionKey,
} from "@test/factories/exercisePair";
import { generateSequenceRandom } from "@test/factories/sequenceRandom";
import { orderExerciseUnits, readEndingExerciseId } from "./exerciseOrder";

/**
 * Lists the region of each unit, "X" for a unit without a region.
 *
 * listUnitRegionKeys([generateExerciseUnit("legs", "L", "GLUTES"), generateExerciseUnit("core", "C", "OBLIQUES")])
 * → "L C"
 */
const listUnitRegionKeys = (units: ExercisePair[]) =>
  units
    .map((unit) => getTagValue(unit.first.branchTags, "REGION"))
    .map(
      (region) =>
        (Object.keys(REGION_TAGS) as RegionKey[]).find(
          (key) => REGION_TAGS[key] === region,
        ) ?? "X",
    )
    .join(" ");

/**
 * Lists the branch ID of the first exercise of each unit.
 *
 * listUnitBranchIds([generateExerciseUnit("legs", "L"), generateExerciseUnit("core", "C")]) → ["legs", "core"]
 */
const listUnitBranchIds = (units: ExercisePair[]) =>
  units.map((unit) => unit.first.branchId);

/**
 * Orders the units with one draw of the given value per unit, without lower
 * body first and without a previous exercise unless given.
 *
 * orderExerciseUnitsWithDraws([legs, core], { draw: 0.99 }) draws 0.99 twice
 */
const orderExerciseUnitsWithDraws = (
  units: ExercisePair[],
  {
    lowerBodyFirst = false,
    previousExerciseId,
    draw = 0,
  }: {
    lowerBodyFirst?: boolean;
    previousExerciseId?: string;
    draw?: number;
  } = {},
) =>
  orderExerciseUnits(
    units,
    { lowerBodyFirst, previousExerciseId },
    generateSequenceRandom(units.map(() => draw)),
  );

describe("exerciseOrder: random draw", () => {
  it("draws once per unit and picks among the remaining candidates by the draw", () => {
    const random = jest.fn(generateSequenceRandom([0.5, 0]));

    const orderedUnits = orderExerciseUnits(
      [
        generateExerciseUnit("push", "U", "CHEST"),
        generateExerciseUnit("pull", "U", "LATISSIMUS"),
      ],
      { lowerBodyFirst: false },
      random,
    );

    expect(listUnitBranchIds(orderedUnits)).toEqual(["pull", "push"]);
    expect(random).toHaveBeenCalledTimes(2);
  });
});

describe("exerciseOrder: body region rotation", () => {
  it("rotates full body, lower body and upper body", () => {
    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("full", "F", "GLUTES"),
      generateExerciseUnit("lower", "L", "QUADRICEPS"),
      generateExerciseUnit("upper1", "U", "CHEST"),
      generateExerciseUnit("upper2", "U", "LATISSIMUS"),
    ]);
    expect(listUnitRegionKeys(orderedUnits)).toBe("F L U U");
  });

  it("changes the body region after each unit when another region is left", () => {
    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("upper", "U", "CHEST"),
      generateExerciseUnit("lower1", "L", "GLUTES"),
      generateExerciseUnit("lower2", "L", "QUADRICEPS"),
    ]);
    expect(listUnitRegionKeys(orderedUnits)).toBe("L U L");
  });

  it("avoids the same primary muscle in the directly following unit", () => {
    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("lowerChest", "L", "CHEST"),
      generateExerciseUnit("upperChest", "U", "CHEST"),
      generateExerciseUnit("upperLat", "U", "LATISSIMUS"),
    ]);
    expect(listUnitBranchIds(orderedUnits)).toEqual([
      "lowerChest",
      "upperLat",
      "upperChest",
    ]);
  });
});

describe("exerciseOrder: region alternation before muscle size", () => {
  it.each([0, 0.99])(
    "alternates legs and core under upper body soreness with draw %s",
    (draw) => {
      const units = [
        ...generateBigLegUnits(),
        generateExerciseUnit("legs4", "L", "GLUTES"),
        generateExerciseUnit("legs5", "L", "QUADRICEPS"),
        generateExerciseUnit("legs6", "L", "HAMSTRINGS"),
        ...generateCoreUnits(6),
      ];
      expect(
        listUnitRegionKeys(orderExerciseUnitsWithDraws(units, { draw })),
      ).toBe("L C L C L C L C L C L C");
    },
  );

  it.each([0, 0.99])(
    "alternates upper body and core under lower body soreness with draw %s",
    (draw) => {
      const orderedUnits = orderExerciseUnitsWithDraws(
        [
          ...generateSmallUpperUnits(),
          ...generateBigUpperUnits(),
          ...generateCoreUnits(6),
        ],
        { draw },
      );
      expect(listUnitRegionKeys(orderedUnits)).toBe("U C U C U C U C U C U C");
      const upperIds = listUnitBranchIds(
        orderedUnits.filter((_, index) => index % 2 === 0),
      );
      expect(upperIds.slice(0, 3).sort()).toEqual(["back", "pull", "push"]);
    },
  );

  it("alternates regions even when one region holds only small muscle groups", () => {
    const orderedUnits = orderExerciseUnitsWithDraws([
      ...generateBigLegUnits(),
      ...generateSmallUpperUnits(),
    ]);
    expect(listUnitRegionKeys(orderedUnits)).toBe("L U L U L U");
  });

  it("orders big muscle groups before small ones inside each region", () => {
    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("smallLegs1", "L", "CALVES"),
      generateExerciseUnit("smallLegs2", "L", "ADDUCTORS"),
      ...generateSmallUpperUnits().slice(0, 2),
      ...generateBigLegUnits().slice(0, 2),
      ...generateBigUpperUnits().slice(0, 2),
    ]);
    expect(listUnitBranchIds(orderedUnits)).toEqual([
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
    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("chest1", "U", "CHEST"),
      generateExerciseUnit("chest2", "U", "CHEST", "TRICEPS"),
      generateExerciseUnit("biceps", "U", "BICEPS"),
    ]);
    expect(listUnitBranchIds(orderedUnits)).toEqual([
      "chest1",
      "chest2",
      "biceps",
    ]);
  });

  it("opens the skill with a big muscle group", () => {
    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("calves", "L", "CALVES"),
      generateExerciseUnit("adductors", "L", "ADDUCTORS"),
      ...generateBigUpperUnits().slice(0, 2),
    ]);
    expect(listUnitRegionKeys(orderedUnits)).toBe("U L U L");
  });

  it("keeps big muscle groups before small ones across regions", () => {
    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("core", "C", "RECTUS_ABDOMINIS"),
      generateExerciseUnit("upper", "U", "CHEST"),
    ]);
    expect(listUnitBranchIds(orderedUnits)).toEqual(["upper", "core"]);
  });

  it("puts units without a body region last", () => {
    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("untagged", null, "GLUTES"),
      ...generateBigLegUnits().slice(0, 2),
      generateSmallUpperUnits()[0],
    ]);
    expect(listUnitRegionKeys(orderedUnits)).toBe("L U L X");
  });

  it("puts lower body units first in max strength", () => {
    const orderedUnits = orderExerciseUnitsWithDraws(
      [
        generateBigUpperUnits()[0],
        generateExerciseUnit("calves", "L", "CALVES"),
        ...generateBigLegUnits().slice(0, 2),
      ],
      { lowerBodyFirst: true },
    );
    expect(listUnitBranchIds(orderedUnits)).toEqual([
      "legs1",
      "legs2",
      "calves",
      "push",
    ]);
  });
});

describe("exerciseOrder: skill boundary", () => {
  it("opens with another big unit when the first one ended the previous skill", () => {
    const orderedUnits = orderExerciseUnitsWithDraws(
      [
        generateExerciseUnit("calves", "L", "CALVES"),
        generateExerciseUnit("adductors", "L", "ADDUCTORS"),
        ...generateBigUpperUnits().slice(0, 2),
      ],
      { previousExerciseId: "epush" },
    );
    expect(listUnitBranchIds(orderedUnits)).toEqual([
      "pull",
      "calves",
      "push",
      "adductors",
    ]);
  });

  it("opens with a small unit when the only big unit ended the previous skill", () => {
    const orderedUnits = orderExerciseUnitsWithDraws(
      [
        generateExerciseUnit("calves", "L", "CALVES"),
        generateExerciseUnit("adductors", "L", "ADDUCTORS"),
        generateBigUpperUnits()[0],
      ],
      { previousExerciseId: "epush" },
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

    const orderedUnits = orderExerciseUnitsWithDraws(
      [pushPullPair, generateExerciseUnit("back", "U", "UPPER_BACK")],
      { previousExerciseId: "epull" },
    );

    expect(listUnitBranchIds(orderedUnits)).toEqual(["back", "push"]);
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

    const orderedUnits = orderExerciseUnitsWithDraws([
      generateExerciseUnit("legs", "L", "QUADRICEPS"),
      chestGlutesPair,
      generateExerciseUnit("pull", "U", "LATISSIMUS"),
    ]);

    expect(listUnitBranchIds(orderedUnits)).toEqual(["legs", "pull", "push"]);
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
      [pair, generateExerciseUnit("back", "U")],
      "eback",
    ],
    ["the fallback without units", [], "eprevious"],
  ])("reads %s", (_, units, expected) => {
    expect(readEndingExerciseId(units, "eprevious")).toBe(expected);
  });
});
