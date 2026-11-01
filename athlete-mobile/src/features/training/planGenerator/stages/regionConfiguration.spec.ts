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
      {
        minutes: 30,
        tagEntries: [generateRegionTagEntry("REGION_UPPER_BODY", 3)],
      },
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
        minutes,
        tagEntries: [generateRegionTagEntry("REGION_UPPER_BODY", count)],
      });
    },
  );

  it("keeps the minutes below the smallest key and reads the smallest key", () => {
    expect(selectRegionConfiguration("SWR1", 10, adult, regionConfigs)).toEqual(
      {
        minutes: 10,
        tagEntries: [generateRegionTagEntry("REGION_UPPER_BODY", 2)],
      },
    );
  });

  it("gives a skill no minutes above the largest key", () => {
    expect(selectRegionConfiguration("SWR1", 55, adult, regionConfigs)).toEqual(
      {
        minutes: 40,
        tagEntries: [generateRegionTagEntry("REGION_UPPER_BODY", 4)],
      },
    );
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
