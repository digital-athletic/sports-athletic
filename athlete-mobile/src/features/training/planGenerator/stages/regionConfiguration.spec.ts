import { generateDerivedProfile } from "@test/factories/derivedProfile";
import {
  generateRegionConfigs,
  generateRegionTagEntry,
} from "@test/factories/regionConfigs";
import { catchThrownValue } from "@test/factories/thrownValue";
import { selectRegionConfiguration } from "./regionConfiguration";

const regionConfigs = generateRegionConfigs();
const adult = generateDerivedProfile();

describe("selectRegionConfiguration", () => {
  it("returns the tag entries of the key that matches the minutes", () => {
    expect(selectRegionConfiguration("SWR1", 30, adult, regionConfigs)).toEqual(
      { tagEntries: [generateRegionTagEntry("REGION_UPPER_BODY", 3)] },
    );
  });

  it.each([
    [24, 2],
    [25, 2],
    [26, 3],
  ])(
    "reads the nearest key for %i minutes, the smaller one on a tie",
    (minutes, count) => {
      expect(
        selectRegionConfiguration("SWR1", minutes, adult, regionConfigs),
      ).toEqual({
        tagEntries: [generateRegionTagEntry("REGION_UPPER_BODY", count)],
      });
    },
  );

  it("reads the smallest key for minutes below it", () => {
    expect(selectRegionConfiguration("SWR1", 10, adult, regionConfigs)).toEqual(
      { tagEntries: [generateRegionTagEntry("REGION_UPPER_BODY", 2)] },
    );
  });

  it("reads the largest key for minutes above it and returns no minutes", () => {
    expect(
      selectRegionConfiguration("CARDIO_3", 45, adult, regionConfigs),
    ).toEqual({ tagEntries: [{ tags: [], count: 1 }] });
  });

  it.each([
    ["the child variant for a child", "CHILD", "ADVANCED", "REGION_CORE"],
    [
      "the professional variant for a professional",
      "ADULT",
      "PROFESSIONAL",
      "REGION_LOWER_BODY",
    ],
    [
      "the default variant for an adolescent",
      "ADOLESCENT",
      "ADVANCED",
      "REGION_UPPER_BODY",
    ],
  ] as const)("reads %s", (_, ageGroup, fitnessLevel, tag) => {
    const profile = generateDerivedProfile({ ageGroup, fitnessLevel });

    const { tagEntries } = selectRegionConfiguration(
      "SWR1",
      20,
      profile,
      regionConfigs,
    );

    expect(tagEntries[0].tags).toEqual([tag]);
  });

  it.each([
    ["CARDIO_1_SHORT", []],
    ["CARDIO_4", []],
    ["MAX_STRENGTH", ["EXERCISE_NAME_SQUAT"]],
  ])("reads the shared configuration for %s", (skill, tags) => {
    const { tagEntries } = selectRegionConfiguration(
      skill,
      10,
      adult,
      regionConfigs,
    );

    expect(tagEntries[0].tags).toEqual(tags);
  });

  it("raises a configuration error for a skill without a region configuration", () => {
    expect(
      catchThrownValue(() =>
        selectRegionConfiguration("SWR2", 30, adult, regionConfigs),
      ),
    ).toEqual({
      type: "OTHER",
      subtype: "OTHER",
      params: ["regionConfiguration", "SWR2"],
    });
  });
});
