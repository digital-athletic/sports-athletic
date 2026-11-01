import { WorkoutConstants } from "@/constants/workoutConstants";
import { loadMaxMinutes } from "@/data/loadMaxMinutes";
import {
  planTrainingDay,
  readMaxMinutes,
  UNCAPPED_MINUTES,
} from "./planTrainingDay";

const { BEGINNER, ADVANCED, PROFESSIONAL } = WorkoutConstants.LEVELS;

describe("planTrainingDay: maxMinutes", () => {
  it.each([
    { skill: "PREVKNEE", group: "PREV" },
    { skill: "SWR2KG", group: "SWR" },
    { skill: "SAKG", group: "SA" },
    { skill: "WUSPEZIAL", group: "WUSPEZIAL" },
    { skill: "MOB", group: "DEFAULT" },
  ] as const)(
    "caps $skill at the maxMinutes value of group $group",
    ({ skill, group }) => {
      expect(readMaxMinutes(skill, ADVANCED)).toBe(
        loadMaxMinutes()[group][ADVANCED],
      );
    },
  );

  it("treats a cap of 0 as no cap", () => {
    expect(loadMaxMinutes().MAX.BEGINNER).toBe(0);

    expect(readMaxMinutes("MAX", BEGINNER)).toBe(UNCAPPED_MINUTES);
  });
});

describe("planTrainingDay: exercise count", () => {
  it("gives a skill one exercise when that exercise takes longer than its minimum minutes", () => {
    // One professional max strength exercise takes 1161.6 s, more than 15 min.
    expect(
      planTrainingDay({
        skills: [{ skill: "MAX", minMinutes: 15 }],
        durationMinutes: 1,
        level: PROFESSIONAL,
      }),
    ).toEqual([
      { skill: "MAX", exerciseCount: 1, seconds: expect.closeTo(1161.6) },
    ]);
  });

  it("takes the exercise count whose estimate lies nearest to the share of a skill", () => {
    // A 40 min share (2400 s) lies nearest to 2 exercises (2323.2 s), not 3 (3484.8 s).
    expect(
      planTrainingDay({
        skills: [{ skill: "MAX", minMinutes: 15 }],
        durationMinutes: 40,
        level: PROFESSIONAL,
      }),
    ).toEqual([
      { skill: "MAX", exerciseCount: 2, seconds: expect.closeTo(2323.2) },
    ]);
  });

  it("plans a skill listed twice once", () => {
    const twice = planTrainingDay({
      skills: [
        { skill: "MAX", minMinutes: 15 },
        { skill: "PREVKNEE", minMinutes: 5 },
        { skill: "MAX", minMinutes: 15 },
      ],
      durationMinutes: 75,
      level: PROFESSIONAL,
    });

    expect(twice.map(({ skill }) => skill)).toEqual(["MAX", "PREVKNEE"]);
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
      expect(
        planTrainingDay({
          skills: [{ skill: "CARDIO_2", minMinutes: 10 }],
          durationMinutes,
          level: ADVANCED,
        }),
      ).toEqual([{ skill: "CARDIO_2", seconds: minutes * 60 }]);
    },
  );

  it("rounds the cardio share down to whole minutes", () => {
    // MOB keeps one exercise of 66 s, so cardio takes 1734 s, 28.9 min.
    const [cardio] = planTrainingDay({
      skills: [
        { skill: "CARDIO_2", minMinutes: 10 },
        { skill: "MOB", minMinutes: 0 },
      ],
      durationMinutes: 30,
      level: ADVANCED,
    });

    expect(cardio).toEqual({ skill: "CARDIO_2", seconds: 28 * 60 });
  });
});
