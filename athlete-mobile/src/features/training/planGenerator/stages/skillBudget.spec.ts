import { generateDerivedProfile } from "@test/factories/derivedProfile";
import {
  generateBodyweightTrainingPlaces,
  generateFocusedTrainingDay,
  generateMaximumMinutesTable,
  generateMaximumMinutesTableWithoutGroup,
  generateSkillBudgetContext,
  generateSkillPrioritiesWithAdultPainPhase,
} from "@test/factories/skillBudget";
import { catchThrownValue } from "@test/factories/thrownValue";
import { loadPlanAuthoredData } from "@/data/loadPlanAuthoredData";
import {
  budgetSectionDays,
  budgetTrainingDay,
  type TrainingDayBudget,
} from "./skillBudget";

const skillsOf = (budget: TrainingDayBudget): string[] =>
  budget.skills.map(({ skill }) => skill);

const kneeAndShoulderPain = generateDerivedProfile({
  hasPain: true,
  preventionSkills: ["PREVKNEE", "PREVSHOULDER"],
});

describe("budgetSectionDays", () => {
  describe("skill priority structure", () => {
    it("picks the adult structure without pain for a PHASE day", () => {
      const [budget] = budgetSectionDays(generateSkillBudgetContext(), [
        generateFocusedTrainingDay({ duration: 60 }),
      ]);

      expect(skillsOf(budget)).toEqual(["SWR1", "MOB", "WU", "CD"]);
    });

    it("picks the adult structure without pain for a STABILITY day", () => {
      const [budget] = budgetSectionDays(generateSkillBudgetContext(), [
        generateFocusedTrainingDay({ duration: 30, focus: "STABILITY" }),
      ]);

      expect(skillsOf(budget)).toEqual(["GKS", "BAS", "MOB"]);
    });

    it("picks the pain structure with the prevention skill and the special warm-up", () => {
      const context = generateSkillBudgetContext({
        profile: kneeAndShoulderPain,
      });

      const [budget] = budgetSectionDays(context, [
        generateFocusedTrainingDay({ duration: 45 }),
      ]);

      expect(skillsOf(budget)).toEqual([
        "SWR1",
        "PREVKNEE",
        "WUSPEZIAL",
        "MOB",
        "WU",
      ]);
    });

    it("gives children with pain the prevention skill and the special warm-up", () => {
      const context = generateSkillBudgetContext({
        profile: generateDerivedProfile({
          ageGroup: "CHILD",
          hasPain: true,
          preventionSkills: ["PREVKNEE"],
        }),
      });

      const [budget] = budgetSectionDays(context, [
        generateFocusedTrainingDay({ duration: 30 }),
      ]);

      expect(skillsOf(budget)).toEqual(["SWR1", "PREVKNEE", "WUSPEZIAL", "WU"]);
    });

    it("raises a configuration error when no structure exists for the focus", () => {
      const context = generateSkillBudgetContext({
        profile: generateDerivedProfile({ ageGroup: "CHILD" }),
      });

      expect(
        catchThrownValue(() =>
          budgetSectionDays(context, [
            generateFocusedTrainingDay({ focus: "CARDIO" }),
          ]),
        ),
      ).toEqual({
        type: "OTHER",
        subtype: "OTHER",
        params: ["skillPriorities", "CHILD", "noPain", "cardio"],
      });
    });
  });

  describe("placeholders", () => {
    it("resolves the cardio slot to the section's cardio type", () => {
      const [budget] = budgetSectionDays(generateSkillBudgetContext(), [
        generateFocusedTrainingDay({ duration: 45, focus: "CARDIO" }),
      ]);

      expect(skillsOf(budget)).toEqual(["CARDIO_3", "MOB", "BR"]);
    });

    it("resolves the PHASE slot to the bodyweight variant without weights at the day's place", () => {
      const context = generateSkillBudgetContext({
        section: { type: "SK", numOfWeeks: 2, cardioType: "CARDIO_1_SHORT" },
        trainingPlaces: generateBodyweightTrainingPlaces(),
      });

      const [budget] = budgetSectionDays(context, [
        generateFocusedTrainingDay({ duration: 30 }),
      ]);

      expect(skillsOf(budget)).toEqual(["SKKG", "MOB"]);
    });

    it("resolves max strength without weights to hypertrophy stage 2 bodyweight", () => {
      const context = generateSkillBudgetContext({
        section: { type: "MAX", numOfWeeks: 2, cardioType: "CARDIO_2" },
        trainingPlaces: generateBodyweightTrainingPlaces(),
      });

      const [budget] = budgetSectionDays(context, [
        generateFocusedTrainingDay({ duration: 30 }),
      ]);

      expect(skillsOf(budget)).toEqual(["SWR2KG", "MOB"]);
    });

    it("resolves the warm-up to the speed warm-up in an explosive power section", () => {
      const context = generateSkillBudgetContext({
        section: { type: "SK", numOfWeeks: 2, cardioType: "CARDIO_1_SHORT" },
      });

      const [budget] = budgetSectionDays(context, [
        generateFocusedTrainingDay({ duration: 45 }),
      ]);

      expect(skillsOf(budget)).toEqual(["SK", "MOB", "WUSKSA"]);
    });
  });

  describe("prevention rotation", () => {
    it("rotates round-robin through the athlete's prevention skills", () => {
      const context = generateSkillBudgetContext({
        profile: kneeAndShoulderPain,
      });
      const days = [0, 2, 4].map((weekday) =>
        generateFocusedTrainingDay({ weekday, duration: 30 }),
      );

      const budgets = budgetSectionDays(context, days);

      expect(budgets.map((budget) => skillsOf(budget)[1])).toEqual([
        "PREVKNEE",
        "PREVSHOULDER",
        "PREVKNEE",
      ]);
    });

    it("places at most one prevention skill per day", () => {
      const context = generateSkillBudgetContext({
        profile: kneeAndShoulderPain,
        authoredData: {
          ...loadPlanAuthoredData(),
          skillPriorities: generateSkillPrioritiesWithAdultPainPhase({
            "0": ["PHASE", "PREV1", "PREV2", "WUSPEZIAL"],
          }),
        },
      });
      const days = [0, 2].map((weekday) =>
        generateFocusedTrainingDay({ weekday, duration: 30 }),
      );

      const budgets = budgetSectionDays(context, days);

      expect(budgets.map(skillsOf)).toEqual([
        ["SWR1", "PREVKNEE", "WUSPEZIAL"],
        ["SWR1", "PREVSHOULDER", "WUSPEZIAL"],
      ]);
    });

    it("keeps the special warm-up only on days with a prevention skill", () => {
      const context = generateSkillBudgetContext({
        profile: kneeAndShoulderPain,
        authoredData: {
          ...loadPlanAuthoredData(),
          skillPriorities: generateSkillPrioritiesWithAdultPainPhase({
            "0": ["PHASE", "WUSPEZIAL"],
            "45": ["PREV1"],
          }),
        },
      });
      const days = [
        generateFocusedTrainingDay({ weekday: 0, duration: 30 }),
        generateFocusedTrainingDay({ weekday: 2, duration: 60 }),
      ];

      const budgets = budgetSectionDays(context, days);

      expect(budgets.map(skillsOf)).toEqual([
        ["SWR1"],
        ["SWR1", "WUSPEZIAL", "PREVKNEE"],
      ]);
    });
  });

  describe("minutes", () => {
    it("gives each skill its minimum even when the session overshoots its duration", () => {
      const [budget] = budgetSectionDays(generateSkillBudgetContext(), [
        generateFocusedTrainingDay({ duration: 20 }),
      ]);

      expect(budget.skills).toEqual([
        { skill: "SWR1", minutes: 20 },
        { skill: "MOB", minutes: 5 },
      ]);
    });

    // The old generator fills the priority 2 skill first above 45 minutes.
    it.each([
      [
        45,
        [
          { skill: "SWR1", minutes: 35 },
          { skill: "MOB", minutes: 5 },
          { skill: "WU", minutes: 5 },
        ],
      ],
      [
        46,
        [
          { skill: "SWR1", minutes: 31 },
          { skill: "MOB", minutes: 5 },
          { skill: "WU", minutes: 5 },
          { skill: "CD", minutes: 5 },
        ],
      ],
    ])(
      "fills the leftover minutes of a %i minute session by priority",
      (duration, skills) => {
        const [budget] = budgetSectionDays(generateSkillBudgetContext(), [
          generateFocusedTrainingDay({ duration }),
        ]);

        expect(budget.skills).toEqual(skills);
      },
    );

    it("caps each skill at its maximum minutes and passes the rest on by priority", () => {
      const context = generateSkillBudgetContext({
        profile: generateDerivedProfile({ fitnessLevel: "BEGINNER" }),
      });

      const [budget] = budgetSectionDays(context, [
        generateFocusedTrainingDay({ duration: 90 }),
      ]);

      expect(budget.skills).toEqual([
        { skill: "SWR1", minutes: 35 },
        { skill: "MOB", minutes: 10 },
        { skill: "WU", minutes: 10 },
        { skill: "CD", minutes: 10 },
        { skill: "BR", minutes: 10 },
      ]);
    });

    it("gives a skill with 0 maximum minutes no leftover minutes", () => {
      const context = generateSkillBudgetContext({
        authoredData: {
          ...loadPlanAuthoredData(),
          maxMinutes: generateMaximumMinutesTable("SWR", { ADVANCED: 0 }),
        },
      });

      const [budget] = budgetSectionDays(context, [
        generateFocusedTrainingDay({ duration: 45 }),
      ]);

      expect(budget.skills).toEqual([
        { skill: "SWR1", minutes: 20 },
        { skill: "MOB", minutes: 10 },
        { skill: "WU", minutes: 10 },
      ]);
    });

    it("raises a configuration error for a missing maximum minutes entry", () => {
      const context = generateSkillBudgetContext({
        authoredData: {
          ...loadPlanAuthoredData(),
          maxMinutes: generateMaximumMinutesTableWithoutGroup("SWR"),
        },
      });

      expect(
        catchThrownValue(() =>
          budgetSectionDays(context, [
            generateFocusedTrainingDay({ duration: 45 }),
          ]),
        ),
      ).toEqual({
        type: "OTHER",
        subtype: "OTHER",
        params: ["maxMinutes", "SWR", "ADVANCED"],
      });
    });
  });
});

describe("budgetTrainingDay", () => {
  it("returns the same budget from any rotation cursor as the fold gives at that cursor", () => {
    const context = generateSkillBudgetContext({
      profile: kneeAndShoulderPain,
    });
    const day = generateFocusedTrainingDay({ duration: 30 });

    const fromCursorOne = budgetTrainingDay(context, day, 1);

    expect(budgetTrainingDay(context, day, 1)).toEqual(fromCursorOne);
    expect(budgetSectionDays(context, [day, day])[1]).toEqual(
      fromCursorOne.budget,
    );
    expect(fromCursorOne.nextRotationCursor).toBe(0);
  });
});
