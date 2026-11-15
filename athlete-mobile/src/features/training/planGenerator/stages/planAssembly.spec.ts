import { minutes } from "@/features/training/models/TimeUnits";
import { requireAiwlTraining } from "@/features/training/utils/testFixtures";
import { TemplateSchema } from "@/schemas/aiwl.schema";
import type { SkillCode } from "@/schemas/generator.schema";
import type { PlacesData } from "@/store/placesStore";
import { deepFreeze } from "@test/factories/deepFreeze";
import { generateFocusedTrainingDay } from "@test/factories/skillBudget";
import { generateSectionEntry } from "@test/factories/sectionTemplates";
import { catchThrownValue } from "@test/factories/thrownValue";
import { generateTrainingPlaces } from "@test/factories/weeklySchedule";
import * as v from "valibot";
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
 * Builds an assembled training day of one warm-up skill with branch 4.
 *
 * generateWarmUpTrainingDay(generateFocusedTrainingDay({ weekday: 3 }))
 * → { budget: { day, skills: [{ skill: "WU", minutes: 5 }] },
 *     selections: [{ type: "BRANCHES", skill: "WU", branches: [branch 4] }] }
 */
const generateWarmUpTrainingDay = (
  day: FocusedTrainingDay = generateFocusedTrainingDay(),
): AssembledTrainingDay =>
  generateAssembledTrainingDay(day, [
    { skill: "WU", minutes: 5, branches: [generateSelectedBranch("4", [])] },
  ]);

/**
 * Builds a section of the given weeks with one Monday studio warm-up day.
 *
 * generateAssembledSection(2)
 * → { section: { type: "SWR1", numOfWeeks: 2, cardioType: "CARDIO_2" },
 *     days: [{ budget: { day: Monday studio, skills: [WU 5] }, selections: [...] }] }
 */
const generateAssembledSection = (numOfWeeks: number): AssembledSection => ({
  section: generateSectionEntry({ numOfWeeks }),
  days: [generateWarmUpTrainingDay()],
});

/**
 * Assembles a plan of one section with one training day and returns that day.
 *
 * assembleSingleTrainingDay([{ skill: "WU", minutes: 5, branches: [branch 4] }])
 * → { weekday: 1, focus: "PHASE", equipment: [...], workout: { aiwl: 1, blocks: [...] } }
 */
const assembleSingleTrainingDay = (skills: readonly DaySkill[]) =>
  requireAiwlTraining(
    assembleTrainingPlan(
      [
        {
          section: generateSectionEntry(),
          days: [
            generateAssembledTrainingDay(generateFocusedTrainingDay(), skills),
          ],
        },
      ],
      { planStartDate: "2026-11-02", trainingPlaces: generateTrainingPlaces() },
    ).sections[0].trainings[0],
  );

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
            generateWarmUpTrainingDay(
              generateFocusedTrainingDay({ weekday: 3 }),
            ),
            generateWarmUpTrainingDay(
              generateFocusedTrainingDay({ weekday: 0 }),
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
            generateWarmUpTrainingDay(
              generateFocusedTrainingDay({ weekday: 3, focus: "CARDIO" }),
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

  it("writes a workout that passes the AIWL schema", () => {
    const training = assembleSingleTrainingDay([
      {
        skill: "SWR1",
        minutes: 25,
        branches: [generateSelectedBranch("7", ["REGION_CORE"])],
      },
    ]);

    expect(v.safeParse(TemplateSchema, training.workout).success).toBe(true);
  });

  it("stores weekday, focus, equipment and workout and no field of a legacy training", () => {
    const training = assembleSingleTrainingDay([
      { skill: "WU", minutes: 5, branches: [generateSelectedBranch("4", [])] },
    ]);

    expect(Object.keys(training).sort()).toEqual([
      "equipment",
      "focus",
      "weekday",
      "workout",
    ]);
  });

  it("writes one branches block per skill in section order with its branch IDs", () => {
    const training = assembleSingleTrainingDay([
      { skill: "WU", minutes: 5, branches: [generateSelectedBranch("4", [])] },
      {
        skill: "SWR1",
        minutes: 25,
        branches: [
          generateSelectedBranch("7", ["REGION_CORE"]),
          generateSelectedBranch("9", ["REGION_UPPER_BODY"]),
        ],
      },
      { skill: "MOB", minutes: 5, branches: [generateSelectedBranch("2", [])] },
    ]);

    expect(training.workout.blocks).toEqual([
      { kind: "branches", skill: "WU", branches: ["4"], duration: 300 },
      { kind: "branches", skill: "SWR1", branches: ["7", "9"], duration: 1500 },
      { kind: "branches", skill: "MOB", branches: ["2"], duration: 300 },
    ]);
  });

  it("writes a cardio skill as a branches block", () => {
    const training = assembleSingleTrainingDay([
      {
        skill: "CARDIO_3",
        minutes: 20,
        branches: [generateSelectedBranch("576", [])],
      },
    ]);

    expect(training.workout.blocks).toEqual([
      {
        kind: "branches",
        skill: "CARDIO_3",
        branches: ["576"],
        duration: 1200,
      },
    ]);
  });

  it.each([
    [12.5, 750],
    [7.333, 440],
    [7.341, 440],
  ])("rounds %p minutes to %p whole seconds", (skillMinutes, duration) => {
    const training = assembleSingleTrainingDay([
      {
        skill: "SWR1",
        minutes: skillMinutes,
        branches: [generateSelectedBranch("7", [])],
      },
    ]);

    expect(training.workout.blocks[0]).toMatchObject({ duration });
  });

  it("writes no duration for a skill whose minutes round to 0 seconds", () => {
    const training = assembleSingleTrainingDay([
      {
        skill: "SWR1",
        minutes: 0.001,
        branches: [generateSelectedBranch("7", [])],
      },
    ]);

    expect(training.workout.blocks[0]).not.toHaveProperty("duration");
  });

  it("writes no block for a skill whose selection holds no branch", () => {
    const training = assembleSingleTrainingDay([
      { skill: "MOB", minutes: 5, branches: [] },
      { skill: "WU", minutes: 5, branches: [generateSelectedBranch("4", [])] },
    ]);

    expect(training.workout.blocks.map((block) => block.skill)).toEqual(["WU"]);
  });

  it("writes no block for an empty skill", () => {
    const training = assembleSingleTrainingDay([
      { skill: "MOB", minutes: 5 },
      { skill: "WU", minutes: 5, branches: [generateSelectedBranch("4", [])] },
    ]);

    expect(training.workout.blocks.map((block) => block.skill)).toEqual(["WU"]);
  });

  it("throws NO_EXERCISES/SKILL_TREE for the first skill of a day whose skills all stay empty", () => {
    expect(
      catchThrownValue(() =>
        assembleSingleTrainingDay([
          { skill: "MOB", minutes: 5 },
          { skill: "WU", minutes: 5 },
        ]),
      ),
    ).toEqual({ type: "NO_EXERCISES", subtype: "SKILL_TREE", params: ["MOB"] });
  });

  it("throws NO_EXERCISES/SKILL_TREE without params for a day without skills", () => {
    expect(catchThrownValue(() => assembleSingleTrainingDay([]))).toEqual({
      type: "NO_EXERCISES",
      subtype: "SKILL_TREE",
      params: [],
    });
  });
});

describe("planAssembly: plan format", () => {
  it("marks the plan as an AIWL plan", () => {
    const plan = assembleTrainingPlan([generateAssembledSection(1)], {
      planStartDate: "2026-11-02",
      trainingPlaces: generateTrainingPlaces(),
    });

    expect(plan.format).toBe("aiwl");
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
