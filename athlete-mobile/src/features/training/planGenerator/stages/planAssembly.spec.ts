import { minutes } from "@/features/training/models/TimeUnits";
import type { SkillCode } from "@/schemas/generator.schema";
import type { PlacesData } from "@/store/placesStore";
import { deepFreeze } from "@test/factories/deepFreeze";
import { generateFocusedTrainingDay } from "@test/factories/skillBudget";
import { generateSectionEntry } from "@test/factories/sectionTemplates";
import { generateTrainingPlaces } from "@test/factories/weeklySchedule";
import type { FocusedTrainingDay } from "./dayGroupingAndFocus";
import type { SelectedBranch } from "./branchSelection";
import {
  type AssembledSection,
  type AssembledTrainingDay,
  assembleTrainingPlan,
} from "./planAssembly";

interface DaySkill {
  readonly skill: SkillCode;
  readonly minutes: number;
  /** Without branches the skill is an EMPTY_SKILL. */
  readonly branches?: readonly SelectedBranch[];
}

/**
 * Builds an assembled training day from skills in budget order.
 *
 * generateAssembledTrainingDay(generateFocusedTrainingDay(), [{ skill: "MOB", minutes: 5 }])
 * → { budget: { day, skills: [{ skill: "MOB", minutes: 5 }] },
 *     selections: [{ type: "EMPTY_SKILL", skill: "MOB" }] }
 */
const generateAssembledTrainingDay = (
  day: FocusedTrainingDay,
  skills: readonly DaySkill[],
): AssembledTrainingDay => ({
  budget: {
    day,
    skills: skills.map((entry) => ({
      skill: entry.skill,
      minutes: minutes(entry.minutes),
    })),
  },
  selections: skills.map(({ skill, branches }) =>
    branches
      ? { type: "BRANCHES", skill, branches }
      : { type: "EMPTY_SKILL", skill },
  ),
});

/**
 * Builds a selected branch with the exercises e1 and e2 on levels 1 and 2.
 *
 * generateSelectedBranch("7", ["REGION_CORE"])
 * → { branchId: "7", tags: ["REGION_CORE"],
 *     levels: { 1: { exerciseId: "e1" }, 2: { exerciseId: "e2" } } }
 */
const generateSelectedBranch = (
  branchId: string,
  tags: string[],
): SelectedBranch => ({
  branchId,
  tags,
  levels: { 1: { exerciseId: "e1" }, 2: { exerciseId: "e2" } },
});

/**
 * Builds a section of the given weeks with one Monday studio day without skills.
 *
 * generateAssembledSection(2)
 * → { section: { type: "SWR1", numOfWeeks: 2, cardioType: "CARDIO_2" },
 *     days: [{ budget: { day: Monday studio, skills: [] }, selections: [] }] }
 */
const generateAssembledSection = (numOfWeeks: number): AssembledSection => ({
  section: generateSectionEntry({ numOfWeeks }),
  days: [generateAssembledTrainingDay(generateFocusedTrainingDay(), [])],
});

describe("planAssembly: plan start", () => {
  it("keeps the plan start date as the start of the plan", () => {
    const plan = assembleTrainingPlan([generateAssembledSection(1)], {
      planStartDate: "2026-11-04",
      trainingPlaces: generateTrainingPlaces(),
    });

    expect(plan.start).toBe("2026-11-04");
  });
});

describe("planAssembly: section dates", () => {
  it("starts the first section on a Monday plan start", () => {
    const plan = assembleTrainingPlan([generateAssembledSection(1)], {
      planStartDate: "2026-11-02",
      trainingPlaces: generateTrainingPlaces(),
    });

    expect(plan.sections[0].start).toBe("2026-11-02");
  });

  it("starts the first section on the next Monday for a Wednesday plan start", () => {
    const plan = assembleTrainingPlan([generateAssembledSection(1)], {
      planStartDate: "2026-11-04",
      trainingPlaces: generateTrainingPlaces(),
    });

    expect(plan.sections[0].start).toBe("2026-11-09");
  });

  it("starts the first section on the next day for a Sunday plan start", () => {
    const plan = assembleTrainingPlan([generateAssembledSection(1)], {
      planStartDate: "2026-11-08",
      trainingPlaces: generateTrainingPlaces(),
    });

    expect(plan.sections[0].start).toBe("2026-11-09");
  });

  it("starts each later section after the weeks of the sections before", () => {
    const plan = assembleTrainingPlan(
      [
        generateAssembledSection(2),
        generateAssembledSection(3),
        generateAssembledSection(1),
      ],
      { planStartDate: "2026-11-02", trainingPlaces: generateTrainingPlaces() },
    );

    expect(plan.sections.map(({ start }) => start)).toEqual([
      "2026-11-02",
      "2026-11-16",
      "2026-12-07",
    ]);
  });
});

describe("planAssembly: section", () => {
  it("keeps type, number of weeks and cardio type of the section", () => {
    const plan = assembleTrainingPlan(
      [
        {
          section: generateSectionEntry({
            type: "SK",
            numOfWeeks: 4,
            cardioType: "CARDIO_1_SHORT",
          }),
          days: [],
        },
      ],
      { planStartDate: "2026-11-02", trainingPlaces: generateTrainingPlaces() },
    );

    expect(plan.sections[0]).toMatchObject({
      type: "SK",
      numOfWeeks: 4,
      cardioType: "CARDIO_1_SHORT",
    });
  });

  it("holds one training per day of the section in the given order", () => {
    const plan = assembleTrainingPlan(
      [
        {
          section: generateSectionEntry(),
          days: [
            generateAssembledTrainingDay(
              generateFocusedTrainingDay({ weekday: 3 }),
              [],
            ),
            generateAssembledTrainingDay(
              generateFocusedTrainingDay({ weekday: 0 }),
              [],
            ),
          ],
        },
      ],
      { planStartDate: "2026-11-02", trainingPlaces: generateTrainingPlaces() },
    );

    expect(plan.sections[0].trainings.map(({ weekday }) => weekday)).toEqual([
      3, 0,
    ]);
  });
});

describe("planAssembly: training day", () => {
  it("keeps the weekday and the focus of the day", () => {
    const plan = assembleTrainingPlan(
      [
        {
          section: generateSectionEntry(),
          days: [
            generateAssembledTrainingDay(
              generateFocusedTrainingDay({ weekday: 3, focus: "CARDIO" }),
              [],
            ),
          ],
        },
      ],
      { planStartDate: "2026-11-02", trainingPlaces: generateTrainingPlaces() },
    );

    expect(plan.sections[0].trainings[0]).toMatchObject({
      weekday: 3,
      focus: "CARDIO",
    });
  });

  it("copies the equipment of the place of the day", () => {
    const trainingPlaces = generateTrainingPlaces(["STUDIO"]);

    const plan = assembleTrainingPlan([generateAssembledSection(1)], {
      planStartDate: "2026-11-02",
      trainingPlaces,
    });

    const { equipment } = plan.sections[0].trainings[0];
    expect(equipment).toEqual(["DUMBBELL", "TREADMILL"]);
    expect(equipment).not.toBe(trainingPlaces.STUDIO.equipment);
  });

  it("gives a day at a place missing from the training places no equipment", () => {
    const { HOME, HALL, OUTSIDE } = generateTrainingPlaces();
    // Stored places can lack a place the schedule names; the type requires all four.
    const placesWithoutStudio = { HOME, HALL, OUTSIDE } as PlacesData;

    const plan = assembleTrainingPlan([generateAssembledSection(1)], {
      planStartDate: "2026-11-02",
      trainingPlaces: placesWithoutStudio,
    });

    expect(plan.sections[0].trainings[0].equipment).toEqual([]);
  });

  it("keeps the minutes of every skill, an empty skill included", () => {
    const plan = assembleTrainingPlan(
      [
        {
          section: generateSectionEntry(),
          days: [
            generateAssembledTrainingDay(generateFocusedTrainingDay(), [
              {
                skill: "SWR1",
                minutes: 25,
                branches: [generateSelectedBranch("7", ["REGION_CORE"])],
              },
              { skill: "MOB", minutes: 5 },
            ]),
          ],
        },
      ],
      { planStartDate: "2026-11-02", trainingPlaces: generateTrainingPlaces() },
    );

    expect(plan.sections[0].trainings[0].lengths).toEqual({
      SWR1: 25,
      MOB: 5,
    });
  });

  it("stores the picked branches as branch copies with the exercise per level", () => {
    const plan = assembleTrainingPlan(
      [
        {
          section: generateSectionEntry(),
          days: [
            generateAssembledTrainingDay(generateFocusedTrainingDay(), [
              {
                skill: "SWR1",
                minutes: 25,
                branches: [
                  generateSelectedBranch("7", ["REGION_CORE"]),
                  generateSelectedBranch("9", ["REGION_UPPER_BODY"]),
                ],
              },
            ]),
          ],
        },
      ],
      { planStartDate: "2026-11-02", trainingPlaces: generateTrainingPlaces() },
    );

    expect(plan.sections[0].trainings[0].skills).toEqual({
      SWR1: [
        {
          branchId: "7",
          tags: ["REGION_CORE"],
          exercises: { 1: { exerciseId: "e1" }, 2: { exerciseId: "e2" } },
        },
        {
          branchId: "9",
          tags: ["REGION_UPPER_BODY"],
          exercises: { 1: { exerciseId: "e1" }, 2: { exerciseId: "e2" } },
        },
      ],
    });
  });

  it("leaves an empty skill out of the stored skills", () => {
    const plan = assembleTrainingPlan(
      [
        {
          section: generateSectionEntry(),
          days: [
            generateAssembledTrainingDay(generateFocusedTrainingDay(), [
              { skill: "MOB", minutes: 5 },
              {
                skill: "WU",
                minutes: 5,
                branches: [generateSelectedBranch("4", [])],
              },
            ]),
          ],
        },
      ],
      { planStartDate: "2026-11-02", trainingPlaces: generateTrainingPlaces() },
    );

    expect(Object.keys(plan.sections[0].trainings[0].skills)).toEqual(["WU"]);
  });
});

describe("planAssembly: inputs", () => {
  it("changes none of its inputs", () => {
    const sections = deepFreeze([
      {
        section: generateSectionEntry({ numOfWeeks: 2 }),
        days: [
          generateAssembledTrainingDay(generateFocusedTrainingDay(), [
            {
              skill: "SWR1",
              minutes: 25,
              branches: [generateSelectedBranch("7", ["REGION_CORE"])],
            },
            { skill: "MOB", minutes: 5 },
          ]),
        ],
      },
    ]);
    const trainingPlaces = deepFreeze(generateTrainingPlaces(["STUDIO"]));
    const sectionsBefore = structuredClone(sections);
    const trainingPlacesBefore = structuredClone(trainingPlaces);

    assembleTrainingPlan(sections, {
      planStartDate: "2026-11-04",
      trainingPlaces,
    });

    expect(sections).toEqual(sectionsBefore);
    expect(trainingPlaces).toEqual(trainingPlacesBefore);
  });
});
