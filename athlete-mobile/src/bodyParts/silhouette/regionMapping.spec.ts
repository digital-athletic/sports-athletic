import { type Side } from "@/bodyParts/types";
import {
  BACK_REGION_IDS,
  FRONT_REGION_IDS,
  regionsForTag,
  toMuscleTag,
} from "./regionMapping";
import { type SilhouetteRegionId } from "./types";
import { getAreasFor } from "@/features/training/utils/exerciseUtils";
import de from "@/i18n/locales/de.json";
import en from "@/i18n/locales/en.json";

const SIDES: [Side, readonly SilhouetteRegionId[]][] = [
  ["FRONT", FRONT_REGION_IDS],
  ["BACK", BACK_REGION_IDS],
];

// Every tag the silhouette can emit, derived from the rendered regions.
const EMITTED_TAGS = [
  ...new Set(
    SIDES.flatMap(([side, ids]) => ids.map((id) => toMuscleTag(id, side))),
  ),
];

// Region ids whose tag highlights both views (shoulders are excluded: each
// view emits its own front/rear value).
const CROSS_SIDE_IDS: SilhouetteRegionId[] = [
  "NECK",
  "ADDUCTORS_LEFT",
  "ADDUCTORS_RIGHT",
];

describe("regionMapping: mappings that are not the identity", () => {
  it("renames the SHIN_MUSCLES regions to the SHIN tags", () => {
    expect(toMuscleTag("SHIN_MUSCLES_LEFT", "FRONT")).toBe("SHIN_LEFT");
    expect(toMuscleTag("SHIN_MUSCLES_RIGHT", "FRONT")).toBe("SHIN_RIGHT");
  });

  it("emits orientation precise shoulder tags per view", () => {
    expect(toMuscleTag("SHOULDER_LEFT", "FRONT")).toBe("SHOULDER_FRONT_LEFT");
    expect(toMuscleTag("SHOULDER_RIGHT", "FRONT")).toBe("SHOULDER_FRONT_RIGHT");
    expect(toMuscleTag("SHOULDER_LEFT", "BACK")).toBe("SHOULDER_REAR_LEFT");
    expect(toMuscleTag("SHOULDER_RIGHT", "BACK")).toBe("SHOULDER_REAR_RIGHT");
  });

  it("preserves the LEFT or RIGHT suffix of every lateral region", () => {
    for (const [side, ids] of SIDES) {
      for (const id of ids) {
        const lateral = id.match(/_(LEFT|RIGHT)$/);
        if (lateral) {
          expect(toMuscleTag(id, side)).toMatch(new RegExp(`_${lateral[1]}$`));
        }
      }
    }
  });
});

describe("regionMapping: getAreasFor compatibility", () => {
  it.each(EMITTED_TAGS)(
    "is recognized by getAreasFor as belonging to a body area: %s",
    (tag) => {
      expect(getAreasFor([tag]).length).toBeGreaterThan(0);
    },
  );
});

describe("regionMapping: totality for unknown tags", () => {
  it.each(["SPINE", "TOTALLY_UNKNOWN", "GLUTES", "QUADRICEPS", "BICEPS"])(
    "returns an empty array for an unmapped or legacy generic tag: %s",
    (tag) => {
      expect(regionsForTag(tag, "FRONT")).toEqual([]);
      expect(regionsForTag(tag, "BACK")).toEqual([]);
    },
  );
});

describe("regionMapping: round trip", () => {
  it.each(SIDES)(
    "regionsForTag inverts toMuscleTag for every %s region",
    (side, ids) => {
      for (const id of ids) {
        expect(regionsForTag(toMuscleTag(id, side), side)).toContain(id);
      }
    },
  );

  it.each<Side>(["FRONT", "BACK"])(
    "every region returned for a tag maps back to that tag on %s",
    (side) => {
      for (const tag of EMITTED_TAGS) {
        for (const region of regionsForTag(tag, side)) {
          expect(toMuscleTag(region, side)).toBe(tag);
        }
      }
    },
  );

  it("highlights cross side regions on both views and side exclusive ones on one", () => {
    for (const id of CROSS_SIDE_IDS) {
      expect(regionsForTag(toMuscleTag(id, "FRONT"), "FRONT")).toEqual([id]);
      expect(regionsForTag(toMuscleTag(id, "BACK"), "BACK")).toEqual([id]);
    }
    expect(regionsForTag("BICEPS_LEFT", "BACK")).toEqual([]);
    expect(regionsForTag("GLUTES_LEFT", "FRONT")).toEqual([]);
    expect(regionsForTag("SHOULDER_FRONT_LEFT", "BACK")).toEqual([]);
    expect(regionsForTag("SHOULDER_REAR_LEFT", "FRONT")).toEqual([]);
  });
});

type Locale = { muscles: Record<string, string> };

describe("regionMapping: accessible name uniqueness", () => {
  it.each<[string, Locale]>([
    ["en", en],
    ["de", de],
  ])("every emitted tag has a distinct %s label per side", (_lang, locale) => {
    for (const [side, ids] of SIDES) {
      const labels = ids.map((id) => locale.muscles[toMuscleTag(id, side)]);
      expect(labels.every((label) => typeof label === "string")).toBe(true);
      expect(new Set(labels).size).toBe(18);
    }
  });
});
