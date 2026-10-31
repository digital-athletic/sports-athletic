import { WorkoutConstants } from "@/constants/workoutConstants";
import { loadMaxMinutes } from "@/data/loadMaxMinutes";
import { loadRegionConfig } from "@/data/loadRegionConfig";
import {
  planTrainingDay,
  readEntriesAt,
  readMaxMinutes,
  UNCAPPED_MINUTES,
} from "./planTrainingDay";

const { BEGINNER, ADVANCED, PROFESSIONAL } = WorkoutConstants.LEVELS;
const { CHILD, ADULT } = WorkoutConstants.AGE_GROUPS;

describe("planTrainingDay: region tables", () => {
  it.each([
    {
      rule: "the planner applies the child table to a child's training day",
      skill: "SWR1KG",
      ageGroup: CHILD,
      level: ADVANCED,
      table: loadRegionConfig("SWR1KG").child,
    },
    {
      rule: "the planner applies the professional table to a professional's training day",
      skill: "MAX",
      ageGroup: ADULT,
      level: PROFESSIONAL,
      table: loadRegionConfig("MAX").professional,
    },
    {
      rule: "the planner applies the default table when the skill has no professional table",
      skill: "GKS",
      ageGroup: ADULT,
      level: PROFESSIONAL,
      table: loadRegionConfig("GKS").default,
    },
    {
      rule: "the planner applies the default table to an advanced adult's training day",
      skill: "MAX",
      ageGroup: ADULT,
      level: ADVANCED,
      table: loadRegionConfig("MAX").default,
    },
    {
      rule: "the planner applies the SWR2KG table to SWR2KG",
      skill: "SWR2KG",
      ageGroup: ADULT,
      level: ADVANCED,
      table: loadRegionConfig("SWR2KG").default,
    },
    {
      rule: "the planner applies the SWR1 table to SWR2",
      skill: "SWR2",
      ageGroup: ADULT,
      level: ADVANCED,
      table: loadRegionConfig("SWR1").default,
    },
  ])("$rule", ({ skill, ageGroup, level, table }) => {
    // A one minute day leaves every skill at the smallest key of its table.
    const smallestKey = Math.min(...Object.keys(table ?? {}).map(Number));

    const { tagsPerSkill, timePerSkill } = planTrainingDay({
      skills: [skill],
      durationMinutes: 1,
      level,
      ageGroup,
    });

    expect(tagsPerSkill[skill]).toEqual(table?.[String(smallestKey)]);
    expect(timePerSkill[skill]).toBe(smallestKey);
  });

  it.each([
    { minutes: 37, key: "35" },
    { minutes: 35, key: "35" },
    { minutes: 3, key: "5" },
  ])(
    "picks the entries of key $key for $minutes minutes",
    ({ minutes, key }) => {
      // GKS keys run from 5 to 40 in steps of 5; fewer minutes than the
      // smallest key pick the smallest key.
      const table = loadRegionConfig("GKS").default;

      expect(readEntriesAt(table, minutes)).toEqual(table[key]);
    },
  );
});

describe("planTrainingDay: maxMinutes", () => {
  it.each([
    { skill: "PREVKNEE", level: ADVANCED, group: "PREV" },
    { skill: "SWR2", level: PROFESSIONAL, group: "SWR" },
    { skill: "CARDIO_2", level: BEGINNER, group: "CARDIO" },
    { skill: "MOB", level: ADVANCED, group: "DEFAULT" },
  ] as const)(
    "caps $skill at the maxMinutes value of group $group",
    ({ skill, level, group }) => {
      expect(readMaxMinutes(skill, level)).toBe(loadMaxMinutes()[group][level]);
    },
  );

  it("treats a cap of 0 as no cap", () => {
    expect(loadMaxMinutes().MAX.BEGINNER).toBe(0);

    expect(readMaxMinutes("MAX", BEGINNER)).toBe(UNCAPPED_MINUTES);
  });
});

describe("planTrainingDay: cardio", () => {
  it.each([
    { durationMinutes: 1, minutes: 10 },
    { durationMinutes: 37, minutes: 37 },
    { durationMinutes: 200, minutes: loadMaxMinutes().CARDIO.ADVANCED },
  ])(
    "gives cardio $minutes minutes in a $durationMinutes minute day",
    ({ durationMinutes, minutes }) => {
      // The cardio table has only the key 10, so every step uses its entries.
      const { tagsPerSkill, timePerSkill } = planTrainingDay({
        skills: ["CARDIO_2"],
        durationMinutes,
        level: ADVANCED,
        ageGroup: ADULT,
      });

      expect(timePerSkill.CARDIO_2).toBe(minutes);
      expect(tagsPerSkill.CARDIO_2).toEqual(
        loadRegionConfig("CARDIO").default["10"],
      );
    },
  );
});

describe("planTrainingDay: training length", () => {
  const kneePainMaxStrengthDay = {
    skills: ["MAX", "PREVKNEE", "MOB", "WUSPEZIAL", "WU", "CD"],
    level: PROFESSIONAL,
    ageGroup: ADULT,
    fillFirst: "PREVKNEE",
  };

  it("gives prevention its full 15 minute cap on a 75 minute max strength day", () => {
    const { timePerSkill } = planTrainingDay({
      ...kneePainMaxStrengthDay,
      durationMinutes: 75,
    });

    expect(timePerSkill.PREVKNEE).toBe(15);
  });

  it("gives max strength the minutes left after prevention on a 75 minute max strength day", () => {
    // About 35 estimated minutes lie nearest to the 30 minute step of 2 lifts.
    const { timePerSkill } = planTrainingDay({
      ...kneePainMaxStrengthDay,
      durationMinutes: 75,
    });

    expect(timePerSkill.MAX).toBe(30);
  });

  it("gives a 120 minute day more max strength than a 75 minute day", () => {
    const short = planTrainingDay({
      ...kneePainMaxStrengthDay,
      durationMinutes: 75,
    });
    const long = planTrainingDay({
      ...kneePainMaxStrengthDay,
      durationMinutes: 120,
    });

    expect(long.timePerSkill.MAX).toBeGreaterThan(short.timePerSkill.MAX);
  });
});

describe("planTrainingDay: input", () => {
  it("plans a skill listed twice once", () => {
    const twice = planTrainingDay({
      skills: ["MAX", "PREVKNEE", "MAX"],
      durationMinutes: 75,
      level: PROFESSIONAL,
      ageGroup: ADULT,
    });

    expect(twice).toEqual(
      planTrainingDay({
        skills: ["MAX", "PREVKNEE"],
        durationMinutes: 75,
        level: PROFESSIONAL,
        ageGroup: ADULT,
      }),
    );
  });

  it("grows the fillFirst skill before the other skills in priority order", () => {
    const day = {
      skills: ["SWR1", "GKS"],
      durationMinutes: 50,
      level: ADVANCED,
      ageGroup: ADULT,
    };

    const unfilled = planTrainingDay(day);
    const filled = planTrainingDay({ ...day, fillFirst: "GKS" });

    expect(filled.timePerSkill.GKS).toBeGreaterThan(unfilled.timePerSkill.GKS);
  });
});
