import { generateDerivedProfile } from "@test/factories/derivedProfile";
import { generateScheduledPlanGenerationInput } from "@test/factories/weeklySchedule";
import {
  assignTrainingDayFocus,
  type Focus,
  type TrainingDayGroup,
} from "./dayGroupingAndFocus";

const [MON, TUE, WED, THU, FRI, SAT, SUN] = [0, 1, 2, 3, 4, 5, 6];
const adult = generateDerivedProfile({ ageGroup: "ADULT" });

const focusPerWeekday = (
  groups: readonly TrainingDayGroup[],
): Record<number, Focus> =>
  Object.fromEntries(groups.flat().map((day) => [day.weekday, day.focus]));

const weekdaysPerGroup = (groups: readonly TrainingDayGroup[]): number[][] =>
  groups.map((group) => group.map((day) => day.weekday));

describe("assignTrainingDayFocus", () => {
  describe("day grouping", () => {
    it("starts the groups after the first rest day and wraps through the week", () => {
      const input = generateScheduledPlanGenerationInput([
        { weekday: MON, place: "HOME", duration: 30 },
        { weekday: TUE, place: "HOME", duration: 30 },
        { weekday: FRI, place: "HOME", duration: 30 },
      ]);

      const groups = assignTrainingDayFocus(input, adult);

      expect(weekdaysPerGroup(groups)).toEqual([[FRI], [MON, TUE]]);
    });

    it("wraps a group from Sunday into Monday", () => {
      const input = generateScheduledPlanGenerationInput([
        { weekday: MON, place: "HOME", duration: 30 },
        { weekday: WED, place: "HOME", duration: 30 },
        { weekday: SAT, place: "HOME", duration: 30 },
        { weekday: SUN, place: "HOME", duration: 30 },
      ]);

      const groups = assignTrainingDayFocus(input, adult);

      expect(weekdaysPerGroup(groups)).toEqual([[WED], [SAT, SUN, MON]]);
    });

    it("forms one group from Monday to Sunday when every weekday is active", () => {
      const input = generateScheduledPlanGenerationInput(
        [MON, TUE, WED, THU, FRI, SAT, SUN].map((weekday) => ({
          weekday,
          place: "HOME" as const,
          duration: 30,
        })),
      );

      const groups = assignTrainingDayFocus(input, adult);

      expect(weekdaysPerGroup(groups)).toEqual([
        [MON, TUE, WED, THU, FRI, SAT, SUN],
      ]);
    });

    it("returns no group without an active weekday", () => {
      const input = generateScheduledPlanGenerationInput([]);

      expect(assignTrainingDayFocus(input, adult)).toEqual([]);
    });
  });

  describe("children", () => {
    it("gives every day PHASE and skips the weekly cardio guarantee", () => {
      const input = generateScheduledPlanGenerationInput(
        [
          { weekday: MON, place: "STUDIO", duration: 60 },
          { weekday: TUE, place: "OUTSIDE", duration: 60 },
          { weekday: WED, place: "HOME", duration: 45 },
        ],
        ["STUDIO", "OUTSIDE"],
      );

      const groups = assignTrainingDayFocus(
        input,
        generateDerivedProfile({ ageGroup: "CHILD" }),
      );

      expect(focusPerWeekday(groups)).toEqual({
        [MON]: "PHASE",
        [TUE]: "PHASE",
        [WED]: "PHASE",
      });
    });

    it("applies the adult rules to adolescents", () => {
      const input = generateScheduledPlanGenerationInput(
        [
          { weekday: MON, place: "STUDIO", duration: 60 },
          { weekday: TUE, place: "OUTSIDE", duration: 60 },
        ],
        ["OUTSIDE"],
      );

      const groups = assignTrainingDayFocus(
        input,
        generateDerivedProfile({ ageGroup: "ADOLESCENT" }),
      );

      expect(focusPerWeekday(groups)).toEqual({
        [MON]: "PHASE",
        [TUE]: "CARDIO",
      });
    });
  });

  describe("adult one-day group", () => {
    it("gives the only training day of the week PHASE", () => {
      const input = generateScheduledPlanGenerationInput(
        [{ weekday: MON, place: "STUDIO", duration: 60 }],
        ["STUDIO"],
      );

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "PHASE",
      });
    });
  });

  describe("adult two-day group", () => {
    it.each([
      [
        "the studio day over a longer day",
        { place: "HOME", duration: 60 },
        { place: "STUDIO", duration: 45 },
        { [MON]: "CARDIO", [TUE]: "PHASE" },
      ],
      [
        "the longer day without a single studio day",
        { place: "OUTSIDE", duration: 45 },
        { place: "HALL", duration: 60 },
        { [MON]: "CARDIO", [TUE]: "PHASE" },
      ],
      [
        "the non-home day at equal length",
        { place: "HOME", duration: 45 },
        { place: "OUTSIDE", duration: 45 },
        { [MON]: "CARDIO", [TUE]: "PHASE" },
      ],
      [
        "the first day when no rule decides",
        { place: "OUTSIDE", duration: 45 },
        { place: "OUTSIDE", duration: 45 },
        { [MON]: "PHASE", [TUE]: "CARDIO" },
      ],
    ] as const)(
      "gives PHASE to %s and CARDIO to the other day",
      (_, monday, tuesday, expected) => {
        const input = generateScheduledPlanGenerationInput(
          [
            { weekday: MON, ...monday },
            { weekday: TUE, ...tuesday },
          ],
          ["HOME", "STUDIO", "HALL", "OUTSIDE"],
        );

        expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual(
          expected,
        );
      },
    );

    it("gives STABILITY to the other day without run equipment", () => {
      const input = generateScheduledPlanGenerationInput(
        [
          { weekday: MON, place: "STUDIO", duration: 60 },
          { weekday: TUE, place: "HALL", duration: 45 },
          { weekday: THU, place: "STUDIO", duration: 60 },
          { weekday: FRI, place: "OUTSIDE", duration: 45 },
        ],
        ["STUDIO", "OUTSIDE"],
      );

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "PHASE",
        [TUE]: "STABILITY",
        [THU]: "PHASE",
        [FRI]: "CARDIO",
      });
    });
  });

  describe("adult three-day group", () => {
    it("ranks the longest studio day first, then non-home days, then home days", () => {
      const input = generateScheduledPlanGenerationInput(
        [
          { weekday: MON, place: "HOME", duration: 90 },
          { weekday: TUE, place: "OUTSIDE", duration: 45 },
          { weekday: WED, place: "STUDIO", duration: 60 },
        ],
        ["HOME", "OUTSIDE", "STUDIO"],
      );

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "STABILITY",
        [TUE]: "CARDIO",
        [WED]: "PHASE",
      });
    });

    it("gives PHASE to the longer of two studio days", () => {
      const input = generateScheduledPlanGenerationInput(
        [
          { weekday: MON, place: "STUDIO", duration: 45 },
          { weekday: TUE, place: "STUDIO", duration: 60 },
          { weekday: WED, place: "HOME", duration: 30 },
        ],
        ["STUDIO"],
      );

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "CARDIO",
        [TUE]: "PHASE",
        [WED]: "STABILITY",
      });
    });

    it("downgrades CARDIO at home without run equipment and upgrades PHASE to COMBINED", () => {
      const input = generateScheduledPlanGenerationInput(
        [
          { weekday: MON, place: "STUDIO", duration: 60 },
          { weekday: TUE, place: "HOME", duration: 45 },
          { weekday: WED, place: "HOME", duration: 30 },
        ],
        ["STUDIO"],
      );

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "COMBINED",
        [TUE]: "STABILITY",
        [WED]: "STABILITY",
      });
    });

    it("keeps CARDIO on a non-home day without run equipment", () => {
      const input = generateScheduledPlanGenerationInput([
        { weekday: MON, place: "STUDIO", duration: 60 },
        { weekday: TUE, place: "HALL", duration: 45 },
        { weekday: WED, place: "HOME", duration: 30 },
      ]);

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "PHASE",
        [TUE]: "CARDIO",
        [WED]: "STABILITY",
      });
    });
  });

  describe("adult group of more than three days", () => {
    it("cycles PHASE, CARDIO, STABILITY in group order", () => {
      const input = generateScheduledPlanGenerationInput([
        { weekday: MON, place: "HOME", duration: 30 },
        { weekday: FRI, place: "HOME", duration: 30 },
        { weekday: SAT, place: "HOME", duration: 30 },
        { weekday: SUN, place: "HOME", duration: 30 },
      ]);

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [FRI]: "PHASE",
        [SAT]: "CARDIO",
        [SUN]: "STABILITY",
        [MON]: "PHASE",
      });
    });
  });

  describe("weekly cardio guarantee", () => {
    it.each([
      [
        "COMBINED at 45 minutes or more with run equipment",
        { place: "STUDIO", duration: 45 },
        ["STUDIO"],
        "COMBINED",
      ],
      [
        "CARDIO below 45 minutes",
        { place: "STUDIO", duration: 40 },
        ["STUDIO"],
        "CARDIO",
      ],
      [
        "CARDIO without run equipment",
        { place: "STUDIO", duration: 60 },
        [],
        "CARDIO",
      ],
    ] as const)(
      "converts the longest PHASE day to %s",
      (_, longestDay, placesWithRunEquipment, expected) => {
        const input = generateScheduledPlanGenerationInput(
          [
            { weekday: MON, ...longestDay },
            { weekday: THU, place: "OUTSIDE", duration: 30 },
          ],
          placesWithRunEquipment,
        );

        expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
          [MON]: expected,
          [THU]: "PHASE",
        });
      },
    );

    it("converts the first day in group order when two PHASE days are equally long", () => {
      const input = generateScheduledPlanGenerationInput(
        [
          { weekday: MON, place: "STUDIO", duration: 60 },
          { weekday: FRI, place: "STUDIO", duration: 60 },
        ],
        ["STUDIO"],
      );

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "PHASE",
        [FRI]: "COMBINED",
      });
    });

    it("skips a home day without run equipment", () => {
      const input = generateScheduledPlanGenerationInput(
        [
          { weekday: MON, place: "HOME", duration: 90 },
          { weekday: THU, place: "STUDIO", duration: 45 },
        ],
        ["STUDIO"],
      );

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "PHASE",
        [THU]: "COMBINED",
      });
    });

    it("converts no day when every PHASE day is a home day without run equipment", () => {
      const input = generateScheduledPlanGenerationInput([
        { weekday: MON, place: "HOME", duration: 60 },
        { weekday: TUE, place: "HOME", duration: 45 },
      ]);

      expect(focusPerWeekday(assignTrainingDayFocus(input, adult))).toEqual({
        [MON]: "PHASE",
        [TUE]: "STABILITY",
      });
    });
  });
});
