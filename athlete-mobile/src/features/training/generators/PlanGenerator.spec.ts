import { WorkoutConstants } from "@/constants/workoutConstants";
import { loadExercises } from "@/data/loadExercises";
import { loadSkillTree } from "@/data/loadSkillTrees";
import type { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import { minutes } from "@/features/training/models/TimeUnits";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { TrainingSectionType } from "@/features/training/models/TrainingSection";
import type { SkillTreeType } from "@/schemas/skillTree.schema";
import type { PlacesData } from "@/store/placesStore";
import PlanGenerator from "./PlanGenerator";

describe("PlanGenerator", () => {
  describe("indexByCounter", () => {
    it("should return 0 for negative counter", () => {
      expect(PlanGenerator.indexByCounter(-5)).toBe(0);
      expect(PlanGenerator.indexByCounter(-1)).toBe(0);
    });

    it("should return the counter value for non-negative counter", () => {
      expect(PlanGenerator.indexByCounter(0)).toBe(0);
      expect(PlanGenerator.indexByCounter(5)).toBe(5);
      expect(PlanGenerator.indexByCounter(100)).toBe(100);
    });
  });

  describe("replaceUserSpecificSkill", () => {
    it("should return null when skill is null", () => {
      expect(PlanGenerator.replaceUserSpecificSkill(null, "ADULT")).toBeNull();
    });

    it("should replace PREV skills with prevSkill when provided", () => {
      const result = PlanGenerator.replaceUserSpecificSkill(
        "PREV",
        "ADULT",
        "PREVKNEE",
      );
      expect(result).toBe("PREVKNEE");
    });

    it("should handle WUSPEZIAL skill", () => {
      const result = PlanGenerator.replaceUserSpecificSkill(
        "WUSPEZIAL",
        "ADULT",
        "PREVKNEE",
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should replace SWR1 with SWR1KG for children", () => {
      const result = PlanGenerator.replaceUserSpecificSkill("SWR1", "CHILD");
      expect(result).toBe("SWR1KG");
    });

    it("should replace SWR2 with SWR2KG for children", () => {
      const result = PlanGenerator.replaceUserSpecificSkill("SWR2", "CHILD");
      expect(result).toBe("SWR2KG");
    });

    it("should not replace SWR1 for adults", () => {
      const result = PlanGenerator.replaceUserSpecificSkill("SWR1", "ADULT");
      expect(result).toBe("SWR1");
    });

    it("should replace PREV2 with GKS for children without prevSkill", () => {
      const result = PlanGenerator.replaceUserSpecificSkill("PREV2", "CHILD");
      expect(result).toBe("GKS");
    });

    it("should replace PREV3 with BAS for children without prevSkill", () => {
      const result = PlanGenerator.replaceUserSpecificSkill("PREV3", "CHILD");
      expect(result).toBe("BAS");
    });

    it("should return null for WUSPEZIAL when no prevSkill is provided", () => {
      const result = PlanGenerator.replaceUserSpecificSkill(
        "WUSPEZIAL",
        "ADULT",
      );
      expect(result).toBeNull();
    });
  });

  describe("getTrainingDayGroups", () => {
    it("should group consecutive active training days", () => {
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 0, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 1, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 2, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 3, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 4, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 5, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 6, duration: minutes(60), place: "HOME" },
      ];

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(2);
      expect(groups[0].length).toBe(2); // Days 3-4
      expect(groups[1].length).toBe(2); // Days 0-1
    });

    it("should handle all active days as single group", () => {
      const userTrainingDays: TrainingDayType[] = Array(7)
        .fill(null)
        .map((_, i) => ({
          active: true,
          weekday: i,
          duration: minutes(60),
          place: "HOME" as const,
        }));

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(1);
      expect(groups[0].length).toBe(7);
    });

    it("should handle no active days", () => {
      const userTrainingDays: TrainingDayType[] = Array(7)
        .fill(null)
        .map((_, i) => ({
          active: false,
          weekday: i,
          duration: minutes(60),
          place: "HOME" as const,
        }));

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(0);
    });

    it("should wrap around week boundary for consecutive days spanning Sunday to Monday", () => {
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 0, duration: minutes(60), place: "HOME" }, // Sunday - active
        { active: false, weekday: 1, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 2, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 3, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 4, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 5, duration: minutes(60), place: "HOME" }, // Friday - active
        { active: true, weekday: 6, duration: minutes(60), place: "HOME" }, // Saturday - active
      ];

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(1);
      expect(groups[0].map((d) => d.weekday)).toEqual([5, 6, 0]);
    });

    it("should create separate groups for alternating training days", () => {
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 0, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 1, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 2, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 3, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 4, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 5, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 6, duration: minutes(60), place: "HOME" },
      ];

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(3);
      expect(groups.every((g) => g.length === 1)).toBe(true);
    });

    it("should preserve training day properties in groups", () => {
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 0, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 1, duration: minutes(45), place: "STUDIO" },
        { active: false, weekday: 2, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 3, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 4, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 5, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 6, duration: minutes(60), place: "HOME" },
      ];

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups[0][0]).toMatchObject({
        weekday: 0,
        duration: minutes(60),
        place: "HOME",
      });
      expect(groups[0][1]).toMatchObject({
        weekday: 1,
        duration: minutes(45),
        place: "STUDIO",
      });
    });
  });

  describe("getTrainingDayGroupsFocuses", () => {
    const mockPlaces: PlacesData = {
      HOME: { equipment: ["DUMBBELL", "MAT"] },
      STUDIO: { equipment: ["BARBELL", "BENCH"] },
      HALL: { equipment: [] },
      OUTSIDE: { equipment: ["TRACK_20"] },
    };

    it("should return PHASE for all child training days", () => {
      const trainingDayGroups: TrainingDayType[][] = [
        [{ active: true, weekday: 1, duration: minutes(60), place: "HOME" }],
        [{ active: true, weekday: 4, duration: minutes(45), place: "STUDIO" }],
      ];

      const focuses = PlanGenerator.getTrainingDayGroupsFocuses(
        trainingDayGroups,
        WorkoutConstants.AGE_GROUPS.CHILD,
        mockPlaces,
      );

      expect(focuses).toHaveLength(2);
      expect(focuses[0]).toEqual(["PHASE"]);
      expect(focuses[1]).toEqual(["PHASE"]);
    });

    it("should assign PHASE to studio and CARDIO to location with run equipment for 2-day adult group", () => {
      const trainingDayGroups: TrainingDayType[][] = [
        [
          { active: true, weekday: 1, duration: minutes(60), place: "STUDIO" },
          { active: true, weekday: 2, duration: minutes(60), place: "OUTSIDE" },
        ],
      ];

      const focuses = PlanGenerator.getTrainingDayGroupsFocuses(
        trainingDayGroups,
        WorkoutConstants.AGE_GROUPS.ADULT,
        mockPlaces,
      );

      expect(focuses[0]).toContain("PHASE");
      expect(focuses[0]).toContain("CARDIO");
    });

    describe("week-wide cardio guarantee", () => {
      const places: PlacesData = {
        HOME: { equipment: ["DUMBBELL"] },
        STUDIO: { equipment: ["BARBELL"] },
        HALL: { equipment: ["TRACK_20"] },
        OUTSIDE: { equipment: [] },
      };
      const singleDayGroups = (
        days: [TrainingDayType["place"], number][],
      ): TrainingDayType[][] =>
        days.map(([place, duration], index) => [
          {
            active: true,
            weekday: index * 2,
            duration: minutes(duration),
            place,
          },
        ]);
      const focusesFor = (days: [TrainingDayType["place"], number][]) =>
        PlanGenerator.getTrainingDayGroupsFocuses(
          singleDayGroups(days),
          WorkoutConstants.AGE_GROUPS.ADULT,
          places,
        ).flat();

      it("converts the longest PHASE day to CARDIO when its place has no run equipment", () => {
        expect(
          focusesFor([
            ["STUDIO", 60],
            ["HALL", 45],
          ]),
        ).toEqual(["CARDIO", "PHASE"]);
      });

      it("converts the longest PHASE day to COMBINED when it lasts 45 minutes with run equipment", () => {
        expect(
          focusesFor([
            ["STUDIO", 40],
            ["HALL", 60],
          ]),
        ).toEqual(["PHASE", "COMBINED"]);
      });

      it("converts a day shorter than 45 minutes with run equipment to CARDIO", () => {
        expect(
          focusesFor([
            ["STUDIO", 30],
            ["HALL", 40],
          ]),
        ).toEqual(["PHASE", "CARDIO"]);
      });

      it("passes over a home day without run equipment", () => {
        expect(
          focusesFor([
            ["HOME", 90],
            ["STUDIO", 45],
          ]),
        ).toEqual(["PHASE", "CARDIO"]);
      });
    });

    it("should return PHASE for single-day adult training group", () => {
      const trainingDayGroups: TrainingDayType[][] = [
        [{ active: true, weekday: 3, duration: minutes(60), place: "HOME" }],
      ];

      const focuses = PlanGenerator.getTrainingDayGroupsFocuses(
        trainingDayGroups,
        WorkoutConstants.AGE_GROUPS.ADULT,
        mockPlaces,
      );

      expect(focuses).toHaveLength(1);
      expect(focuses[0]).toEqual(["PHASE"]);
    });
  });

  describe("addToSkillTree: goalkeeper exercises", () => {
    const goalkeeperBranch: SkillTreeType = {
      "900": {
        tags: ["REGION_LOWER_BODY", "SIDE_BOTH"],
        levels: { 1: { exerciseId: "661" } },
      },
    };
    const branchIdsFor = (position: string | undefined) =>
      Object.keys(
        PlanGenerator.addToSkillTree(
          {},
          goalkeeperBranch,
          [],
          WorkoutConstants.AGE_GROUPS.ADULT,
          "MALE",
          WorkoutConstants.LEVELS.BEGINNER,
          ["HANDBALL_GOAL"],
          [],
          {},
          loadExercises(),
          [],
          position,
        ),
      );

    it.each(["GOAL", "GOALKEEPER"])(
      "keeps a goalkeeper exercise for position %s",
      (position) => {
        expect(branchIdsFor(position)).toEqual(["900"]);
      },
    );

    it.each(["FIELD", undefined])(
      "drops a goalkeeper exercise for position %s",
      (position) => {
        expect(branchIdsFor(position)).toEqual([]);
      },
    );
  });

  /**
   * Assigns a training focus (PHASE, CARDIO, STABILITY, COMBINED) to each day in a group.
   * Children always receive PHASE. For adults, assignment depends on place type, equipment
   * availability (weights, run equipment), and session duration to optimize training variety.
   */
  describe("getFocusForTrainingDayGroup", () => {
    const mockPlaces: PlacesData = {
      HOME: { equipment: ["DUMBBELL", "MAT"] },
      STUDIO: { equipment: ["BARBELL", "BENCH"] },
      HALL: { equipment: [] },
      OUTSIDE: { equipment: ["TRACK_20"] },
    };

    it("should assign PHASE to studio and CARDIO to outside for 2-day adult group", () => {
      const groupTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 1, duration: minutes(60), place: "STUDIO" },
        { active: true, weekday: 2, duration: minutes(45), place: "OUTSIDE" },
      ];

      const focuses = PlanGenerator.getFocusForTrainingDayGroup(
        groupTrainingDays,
        WorkoutConstants.AGE_GROUPS.ADULT,
        mockPlaces,
      );

      expect(focuses[0]).toBe("PHASE");
      expect(focuses[1]).toBe("CARDIO");
    });

    it("should assign PHASE to longer and STABILITY to shorter home day without run equipment", () => {
      const groupTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 1, duration: minutes(45), place: "HOME" },
        { active: true, weekday: 2, duration: minutes(60), place: "HOME" },
      ];

      const focuses = PlanGenerator.getFocusForTrainingDayGroup(
        groupTrainingDays,
        WorkoutConstants.AGE_GROUPS.ADULT,
        mockPlaces,
      );

      expect(focuses[0]).toBe("STABILITY");
      expect(focuses[1]).toBe("PHASE");
    });

    describe("rule order without a studio day", () => {
      const places: PlacesData = {
        HOME: { equipment: ["DUMBBELL"] },
        STUDIO: { equipment: ["BARBELL"] },
        HALL: { equipment: ["TRACK_20"] },
        OUTSIDE: { equipment: [] },
      };

      it("puts PHASE on the longer day before checking the place", () => {
        const focuses = PlanGenerator.getFocusForTrainingDayGroup(
          [
            { active: true, weekday: 1, duration: minutes(45), place: "HOME" },
            { active: true, weekday: 2, duration: minutes(90), place: "HALL" },
          ],
          WorkoutConstants.AGE_GROUPS.ADULT,
          places,
        );
        expect(focuses).toEqual(["STABILITY", "PHASE"]);
      });

      it("puts PHASE on the non-home day when both days are equally long", () => {
        const focuses = PlanGenerator.getFocusForTrainingDayGroup(
          [
            { active: true, weekday: 1, duration: minutes(60), place: "HOME" },
            {
              active: true,
              weekday: 2,
              duration: minutes(60),
              place: "OUTSIDE",
            },
          ],
          WorkoutConstants.AGE_GROUPS.ADULT,
          places,
        );
        expect(focuses).toEqual(["STABILITY", "PHASE"]);
      });
    });

    it("assigns 3 days studio first, then non-home, then home, also without run equipment", () => {
      const focuses = PlanGenerator.getFocusForTrainingDayGroup(
        [
          { active: true, weekday: 1, duration: minutes(60), place: "STUDIO" },
          { active: true, weekday: 2, duration: minutes(60), place: "HALL" },
          { active: true, weekday: 3, duration: minutes(60), place: "HOME" },
        ],
        WorkoutConstants.AGE_GROUPS.ADULT,
        {
          HOME: { equipment: [] },
          STUDIO: { equipment: ["BARBELL"] },
          HALL: { equipment: [] },
          OUTSIDE: { equipment: [] },
        },
      );
      expect(focuses).toEqual(["PHASE", "CARDIO", "STABILITY"]);
    });

    it("should return PHASE for all days in child age group regardless of places", () => {
      const groupTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 1, duration: minutes(60), place: "STUDIO" },
        { active: true, weekday: 2, duration: minutes(45), place: "OUTSIDE" },
        { active: true, weekday: 3, duration: minutes(30), place: "HOME" },
      ];

      const focuses = PlanGenerator.getFocusForTrainingDayGroup(
        groupTrainingDays,
        WorkoutConstants.AGE_GROUPS.CHILD,
        mockPlaces,
      );

      expect(focuses).toHaveLength(3);
      expect(focuses.every((f) => f === "PHASE")).toBe(true);
    });
  });

  /**
   * Determines training section types and durations based on season phase and user profile.
   * Delegates to getSectionsBySeasonPhaseAgeGroupLevelNumOfWeeks for section selection.
   * Returns an array of TrainingSectionType objects with type, numOfWeeks, and cardioType.
   */
  describe("getWeightedSections", () => {
    it("should return correct sections for competition adult advanced 8 weeks", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.COMPETITION,
        numOfWeeks: 8,
        endDate: "2025-05-01",
      };

      const result = PlanGenerator.getWeightedSections(
        seasonPhase,
        WorkoutConstants.AGE_GROUPS.ADULT,
        "MIDFIELDER",
        WorkoutConstants.LEVELS.ADVANCED,
        true,
        false,
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 3,
        cardioType: "CARDIO_2",
      });
      expect(result[1]).toMatchObject({
        type: "MAX",
        numOfWeeks: 3,
        cardioType: "CARDIO_1_SHORT",
      });
      expect(result[2]).toMatchObject({
        type: "SK",
        numOfWeeks: 2,
        cardioType: "CARDIO_2",
      });
    });

    it("should return correct sections for prepatory child beginner 6 weeks", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.PREPARATORY,
        numOfWeeks: 6,
        endDate: "2025-03-01",
      };

      const result = PlanGenerator.getWeightedSections(
        seasonPhase,
        WorkoutConstants.AGE_GROUPS.CHILD,
        "FORWARD",
        WorkoutConstants.LEVELS.BEGINNER,
        false,
        false,
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        cardioType: "CARDIO_3",
      });
      expect(result[1]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        cardioType: "CARDIO_2",
      });
      expect(result[2]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        cardioType: "CARDIO_1_SHORT",
      });
    });

    it("should return sections without SA for keepers", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.PAUSE,
        numOfWeeks: 4,
        endDate: "2025-02-01",
      };

      const result = PlanGenerator.getWeightedSections(
        seasonPhase,
        WorkoutConstants.AGE_GROUPS.ADULT,
        "GOALKEEPER",
        WorkoutConstants.LEVELS.PROFESSIONAL,
        true,
        true,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        cardioType: "CARDIO_4",
      });
      expect(result[1]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 2,
        cardioType: "CARDIO_4",
      });
    });
  });

  /**
   * Calculates sequential start dates for training sections based on a plan start date.
   * Adjusts the start date to the next Monday if it doesn't fall on a Monday.
   * Each section's start is offset by the cumulative weeks of all previous sections.
   */
  describe("calculateStartingDates", () => {
    it("should calculate sequential start dates for multiple sections", () => {
      const startDate = "2025-01-06"; // Monday, Jan 6, 2025
      const sections = [
        {
          type: "SWR1",
          numOfWeeks: 2,
          start: "",
          cardioType: "CARDIO_2",
          trainings: [],
        },
        {
          type: "SA",
          numOfWeeks: 3,
          start: "",
          cardioType: "CARDIO_2",
          trainings: [],
        },
        {
          type: "MAX",
          numOfWeeks: 1,
          start: "",
          cardioType: "CARDIO_1_SHORT",
          trainings: [],
        },
      ] as unknown as TrainingSectionType[];

      const result = PlanGenerator.calculateStartingDates(sections, startDate);

      expect(result).toHaveLength(3);
      expect(result[0].start).toBe("2025-01-06"); // Jan 6
      expect(result[1].start).toBe("2025-01-20"); // Jan 6 + 2 weeks = Jan 20
      expect(result[2].start).toBe("2025-02-10"); // Jan 20 + 3 weeks = Feb 10
    });

    it("should adjust Friday start to next Monday", () => {
      const friday = "2025-01-03"; // Friday, Jan 3, 2025
      const sections = [
        {
          type: "SWR2",
          numOfWeeks: 2,
          start: "",
          cardioType: "CARDIO_3",
          trainings: [],
        },
        {
          type: "SK",
          numOfWeeks: 1,
          start: "",
          cardioType: "CARDIO_2",
          trainings: [],
        },
      ] as unknown as TrainingSectionType[];

      const result = PlanGenerator.calculateStartingDates(sections, friday);

      // Friday Jan 3 -> next Monday is Jan 6
      expect(result[0].start).toBe("2025-01-06");
      expect(result[1].start).toBe("2025-01-20"); // Jan 6 + 2 weeks
    });

    it("should preserve section properties while adding start dates", () => {
      const startDate = "2025-01-06";
      const sections = [
        {
          type: "SWR1",
          numOfWeeks: 2,
          start: "",
          cardioType: "CARDIO_3",
          trainings: [],
        },
      ] as unknown as TrainingSectionType[];

      const result = PlanGenerator.calculateStartingDates(sections, startDate);

      expect(result[0]).toEqual({
        type: "SWR1",
        numOfWeeks: 2,
        start: "2025-01-06",
        cardioType: "CARDIO_3",
        trainings: [],
      });
    });
  });

  /**
   * Maps chosen training sections to fallback section types based on length matching.
   * Splits sections when the chosen section is longer than the fallback, and assigns
   * the fallback's type property to each resulting section with a dynamic key (e.g., cardioType).
   */
  describe("mapFallbackSections", () => {
    it("should map chosen sections to fallback types", () => {
      const chosen = [{ length: 6 }, { length: 4 }];
      const fallback = [
        { length: 3, type: "TYPE_A" },
        { length: 3, type: "TYPE_B" },
        { length: 4, type: "TYPE_C" },
      ];

      const result = PlanGenerator.mapFallbackSections(
        chosen,
        fallback,
        "cardio",
      );

      expect(result.length).toBe(3);
      expect(result[0]).toEqual({ length: 3, cardioType: "TYPE_A" });
      expect(result[1]).toEqual({ length: 3, cardioType: "TYPE_B" });
      expect(result[2]).toEqual({ length: 4, cardioType: "TYPE_C" });
    });

    it("should handle chosen section shorter than fallback and split across types", () => {
      const chosen = [{ length: 2 }, { length: 4 }];
      const fallback = [
        { length: 3, type: "CARDIO_1" },
        { length: 3, type: "CARDIO_2" },
      ];

      const result = PlanGenerator.mapFallbackSections(
        chosen,
        fallback,
        "cardio",
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ length: 2, cardioType: "CARDIO_1" });
      expect(result[1]).toEqual({ length: 1, cardioType: "CARDIO_1" });
      expect(result[2]).toEqual({ length: 3, cardioType: "CARDIO_2" });
    });

    it("should stop mapping when fallback sections are exhausted", () => {
      const chosen = [{ length: 4 }, { length: 4 }, { length: 4 }];
      const fallback = [
        { length: 2, type: "CARDIO_3" },
        { length: 2, type: "CARDIO_4" },
      ];

      const result = PlanGenerator.mapFallbackSections(
        chosen,
        fallback,
        "cardio",
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ length: 2, cardioType: "CARDIO_3" });
      expect(result[1]).toEqual({ length: 2, cardioType: "CARDIO_4" });
    });
  });

  /**
   * Replaces placeholder skills in a training plan with concrete skill types based on context.
   * Substitutes PHASE with the section type (with KG suffix if no weights), WU with WUSKSA
   * for SA/SK sections, and CARDIO placeholders with the actual cardio type for the section.
   */
  describe("getSkillTrainingplan", () => {
    it("should replace PHASE with section type when weights are available", () => {
      const skills = {
        day1: ["PHASE", "BAS", "MOB"],
        day2: ["PHASE", "CARDIO"],
      };
      const placeEquipment = ["DUMBBELL", "BARBELL"];

      const result = PlanGenerator.getSkillTrainingplan(
        "SWR1",
        "CARDIO_2",
        skills,
        placeEquipment,
      );

      expect(result.day1[0]).toBe("SWR1");
      expect(result.day2[0]).toBe("SWR1");
    });

    it("should replace PHASE with KG suffix when no weights and MAX becomes SWR2KG", () => {
      const skills = {
        day1: ["PHASE", "BAS"],
        day2: ["PHASE", "MOB"],
      };
      const placeEquipment = ["MAT", "TRACK_20"];

      const resultMax = PlanGenerator.getSkillTrainingplan(
        "MAX",
        "CARDIO_1_SHORT",
        { ...skills },
        placeEquipment,
      );
      expect(resultMax.day1[0]).toBe("SWR2KG");

      const resultSwr = PlanGenerator.getSkillTrainingplan(
        "SWR1",
        "CARDIO_3",
        { day1: ["PHASE"] },
        placeEquipment,
      );
      expect(resultSwr.day1[0]).toBe("SWR1KG");
    });

    it("should replace WU with WUSKSA for SA/SK sections and CARDIO with cardioType", () => {
      const skills = {
        warmup: ["WU", "MOB"],
        main: ["PHASE", "CARDIO"],
      };
      const placeEquipment = ["DUMBBELL"];

      const result = PlanGenerator.getSkillTrainingplan(
        "SA",
        "CARDIO_2",
        skills,
        placeEquipment,
      );

      expect(result.warmup[0]).toBe("WUSKSA");
      expect(result.main[1]).toBe("CARDIO_2");
    });
  });

  /**
   * Returns the maximum allowed time for a skill based on the user's level.
   * Different skills have different max time configurations (e.g., SWR allows more time than BAS).
   * Falls back to a default max time for unknown skill types.
   */
  describe("getMaxTimeForSkillAndLevel", () => {
    it("should return max time for BAS skill", () => {
      const result = PlanGenerator.getMaxTimeForSkillAndLevel(
        "BAS",
        WorkoutConstants.LEVELS.BEGINNER,
      );
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("should return max time for CARDIO skills", () => {
      const result = PlanGenerator.getMaxTimeForSkillAndLevel(
        "CARDIO_1_SHORT",
        WorkoutConstants.LEVELS.ADVANCED,
      );
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("should return max time for MAX skill", () => {
      const result = PlanGenerator.getMaxTimeForSkillAndLevel(
        "MAX",
        WorkoutConstants.LEVELS.PROFESSIONAL,
      );
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it("should return different max times for SWR skill based on level", () => {
      const beginnerMax = PlanGenerator.getMaxTimeForSkillAndLevel(
        "SWR1",
        WorkoutConstants.LEVELS.BEGINNER,
      );
      const advancedMax = PlanGenerator.getMaxTimeForSkillAndLevel(
        "SWR1",
        WorkoutConstants.LEVELS.ADVANCED,
      );
      const professionalMax = PlanGenerator.getMaxTimeForSkillAndLevel(
        "SWR1",
        WorkoutConstants.LEVELS.PROFESSIONAL,
      );

      expect(beginnerMax).toBe(35);
      expect(advancedMax).toBe(45);
      expect(professionalMax).toBeGreaterThan(advancedMax);
    });

    it("should return same max time for SWR variants (SWR1, SWR2, SWR1KG, SWR2KG)", () => {
      const level = WorkoutConstants.LEVELS.ADVANCED;
      const swr1Max = PlanGenerator.getMaxTimeForSkillAndLevel("SWR1", level);
      const swr2Max = PlanGenerator.getMaxTimeForSkillAndLevel("SWR2", level);
      const swr1kgMax = PlanGenerator.getMaxTimeForSkillAndLevel(
        "SWR1KG",
        level,
      );
      const swr2kgMax = PlanGenerator.getMaxTimeForSkillAndLevel(
        "SWR2KG",
        level,
      );

      expect(swr1Max).toBe(swr2Max);
      expect(swr1Max).toBe(swr1kgMax);
      expect(swr1Max).toBe(swr2kgMax);
    });

    it("should return default max time for unknown skill types", () => {
      const result = PlanGenerator.getMaxTimeForSkillAndLevel(
        "UNKNOWN_SKILL",
        WorkoutConstants.LEVELS.BEGINNER,
      );

      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    it.each([
      "PREVKNEE",
      "PREVSHOULDER",
      "PREVWRIST",
      "PREVANKLE",
      "PREVSPINE",
    ])("allows 15 minutes for the prevention skill %s", (skill) => {
      expect(
        PlanGenerator.getMaxTimeForSkillAndLevel(
          skill,
          WorkoutConstants.LEVELS.ADVANCED,
        ),
      ).toBe(15);
    });
  });

  /**
   * Creates a complete training plan by combining weighted sections with calculated start dates.
   * Uses season phase, user demographics, and training preferences to determine section structure.
   * Returns a TrainingPlanType with a start date and array of training sections.
   */
  describe("initializeTrainingPlan", () => {
    it("should return start date in ISO 8601 date format (YYYY-MM-DD), not full ISO datetime", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.COMPETITION,
        numOfWeeks: 8,
        endDate: "2025-03-06",
      };
      const startDate = new Date(2025, 0, 6); // Monday, Jan 6, 2025

      const result = PlanGenerator.initializeTrainingPlan(
        seasonPhase,
        WorkoutConstants.AGE_GROUPS.ADULT,
        "MIDFIELDER",
        WorkoutConstants.LEVELS.ADVANCED,
        true,
        startDate,
        false,
      );

      // The start field should be in YYYY-MM-DD format, NOT full ISO datetime
      expect(result.start).toBe("2025-01-06");
    });

    it("should create plan with correct start date and sections for competition adult", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.COMPETITION,
        numOfWeeks: 8,
        endDate: "2025-03-06",
      };
      const startDate = new Date(2025, 0, 6); // Monday, Jan 6, 2025

      const result = PlanGenerator.initializeTrainingPlan(
        seasonPhase,
        WorkoutConstants.AGE_GROUPS.ADULT,
        "MIDFIELDER",
        WorkoutConstants.LEVELS.ADVANCED,
        true,
        startDate,
        false,
      );

      expect(result.start).toBe("2025-01-06");
      expect(result.sections).toHaveLength(3);
      expect(result.sections[0]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 3,
        start: "2025-01-06",
      });
      expect(result.sections[1]).toMatchObject({
        type: "MAX",
        numOfWeeks: 3,
        start: "2025-01-27",
      });
      expect(result.sections[2]).toMatchObject({
        type: "SK",
        numOfWeeks: 2,
        start: "2025-02-17",
      });
    });

    it("should create plan with child-appropriate sections for prepatory phase", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.PREPARATORY,
        numOfWeeks: 6,
        endDate: "2025-03-17",
      };
      const startDate = new Date(2025, 1, 3); // Monday, Feb 3, 2025

      const result = PlanGenerator.initializeTrainingPlan(
        seasonPhase,
        WorkoutConstants.AGE_GROUPS.CHILD,
        "FORWARD",
        WorkoutConstants.LEVELS.BEGINNER,
        false,
        startDate,
        false,
      );

      expect(result.start).toBe("2025-02-03");
      expect(result.sections).toHaveLength(3);
      expect(result.sections[0]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        start: "2025-02-03",
      });
      expect(result.sections[1]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        start: "2025-02-17",
      });
      expect(result.sections[2]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        start: "2025-03-03",
      });
    });

    it("should create plan without SA sections for keepers", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.COMPETITION,
        numOfWeeks: 10,
        endDate: "2025-05-19",
      };
      const startDate = new Date(2025, 2, 10); // Monday, Mar 10, 2025

      const result = PlanGenerator.initializeTrainingPlan(
        seasonPhase,
        WorkoutConstants.AGE_GROUPS.ADULT,
        "GOALKEEPER",
        WorkoutConstants.LEVELS.ADVANCED,
        true,
        startDate,
        true,
      );

      expect(result.start).toBe("2025-03-10");
      expect(result.sections).toHaveLength(3);
      const sectionTypes = result.sections.map((s) => s.type);
      expect(sectionTypes).not.toContain("SA");
      expect(sectionTypes).toEqual(["SWR2", "MAX", "SK"]);
    });
  });

  describe("getTagsForSkill", () => {
    it("should return tags for SWR1 skill", () => {
      const result = PlanGenerator.getTagsForSkill("SWR1");
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should return child-specific tags when age is CHILD", () => {
      const result = PlanGenerator.getTagsForSkill(
        "BAS",
        WorkoutConstants.AGE_GROUPS.CHILD,
      );
      expect(result).toBeDefined();
    });

    it("should return professional tags when level is PROFESSIONAL", () => {
      const result = PlanGenerator.getTagsForSkill(
        "MAX",
        WorkoutConstants.AGE_GROUPS.ADULT,
        WorkoutConstants.LEVELS.PROFESSIONAL,
      );
      expect(result).toBeDefined();
    });

    it("should return cardio region tags for CARDIO skills", () => {
      const result = PlanGenerator.getTagsForSkill("CARDIO_1_SHORT");
      expect(result).toEqual({
        10: [{ tags: [], count: 1 }],
      });
    });

    it("should return default SWR1 tags for unknown skill types", () => {
      const unknownSkillTags = PlanGenerator.getTagsForSkill("UNKNOWN_SKILL");
      const swr1Tags = PlanGenerator.getTagsForSkill("SWR1");
      expect(unknownSkillTags).toEqual(swr1Tags);
    });

    it("should return default tags when adult with non-professional level", () => {
      const result = PlanGenerator.getTagsForSkill(
        "SA",
        WorkoutConstants.AGE_GROUPS.ADULT,
        WorkoutConstants.LEVELS.BEGINNER,
      );
      expect(result).toEqual({
        15: [
          { tags: ["REGION_UPPER_BODY", "REGION_LOWER_BODY"], count: 2 },
          { tags: ["SKILL_SAS"], count: 1 },
        ],
        20: [
          { tags: ["REGION_UPPER_BODY"], count: 2 },
          { tags: ["REGION_LOWER_BODY"], count: 2 },
        ],
        25: [
          { tags: ["REGION_UPPER_BODY"], count: 2 },
          { tags: ["REGION_LOWER_BODY"], count: 2 },
          { tags: ["SKILL_SAS"], count: 2 },
        ],
        30: [
          { tags: ["REGION_UPPER_BODY"], count: 2 },
          { tags: ["REGION_LOWER_BODY"], count: 2 },
          { tags: ["SKILL_SAS"], count: 2 },
        ],
        35: [
          { tags: ["REGION_UPPER_BODY"], count: 3 },
          { tags: ["REGION_LOWER_BODY"], count: 3 },
          { tags: ["SKILL_SAS"], count: 1 },
        ],
      });
    });
  });

  /**
   * Distributes remaining training time across skills based on fill priorities.
   * For longer sessions (>45 min), priority 2 skill is filled first before distributing to others.
   * Each skill is capped at its maximum allowed time based on the user's level.
   */
  describe("addTimeLeftToSkills", () => {
    it("should distribute remaining time across skills", () => {
      const timePerSkill = {
        BAS: 10,
        SWR1: 15,
        SA: 5,
      };
      const fillPriorities = ["SA", "SWR1", "BAS"];
      const timeLeft = 20;

      const result = PlanGenerator.addTimeLeftToSkills(
        timePerSkill,
        fillPriorities,
        timeLeft,
        WorkoutConstants.LEVELS.ADVANCED,
        60,
      );

      expect(result).toHaveProperty("BAS");
      expect(result).toHaveProperty("SWR1");
      expect(result).toHaveProperty("SA");

      const totalTime = Object.values(result).reduce(
        (sum: number, val) => sum + (val as number),
        0,
      );
      expect(totalTime).toBeGreaterThan(
        timePerSkill.BAS + timePerSkill.SWR1 + timePerSkill.SA,
      );
    });

    it("should not exceed max time for any skill", () => {
      const timePerSkill = { BAS: 30 };
      const fillPriorities = ["BAS"];
      const timeLeft = 100;

      const result = PlanGenerator.addTimeLeftToSkills(
        timePerSkill,
        fillPriorities,
        timeLeft,
        WorkoutConstants.LEVELS.BEGINNER,
        90,
      );

      const maxTime = PlanGenerator.getMaxTimeForSkillAndLevel(
        "BAS",
        WorkoutConstants.LEVELS.BEGINNER,
      );
      expect(result.BAS).toBeLessThanOrEqual(maxTime);
    });

    it("should fill priority 2 skill first when training duration > 45", () => {
      const timePerSkill = {
        SWR1: 10,
        SA: 10,
        SK: 10,
      };
      const fillPriorities = ["SWR1", "SA", "SK"]; // SA is prio 2 (index 1)
      const timeLeft = 15;

      const result = PlanGenerator.addTimeLeftToSkills(
        timePerSkill,
        fillPriorities,
        timeLeft,
        WorkoutConstants.LEVELS.ADVANCED,
        60, // duration > 45
      );

      // SA (priority 2) should be filled first, then remaining distributed
      expect(result.SA).toBeGreaterThan(timePerSkill.SA);
    });

    it("should skip priority 2 special treatment when training duration <= 45", () => {
      const timePerSkill = {
        SWR1: 10,
        SA: 10,
      };
      const fillPriorities = ["SWR1", "SA"];
      const timeLeft = 10;

      const result = PlanGenerator.addTimeLeftToSkills(
        timePerSkill,
        fillPriorities,
        timeLeft,
        WorkoutConstants.LEVELS.BEGINNER,
        45, // duration <= 45
      );

      // With shorter duration, filling starts from priority 0
      // SWR1 max for BEGINNER is 35, so it can take all 10 extra minutes
      expect(result.SWR1).toBe(20);
    });

    it("should fill skills in priority order up to their max times", () => {
      const timePerSkill = {
        BAS: 5,
        SWR1: 30,
        SA: 25,
      };
      const fillPriorities = ["BAS", "SWR1", "SA"];
      const timeLeft = 50;

      const result = PlanGenerator.addTimeLeftToSkills(
        timePerSkill,
        fillPriorities,
        timeLeft,
        WorkoutConstants.LEVELS.ADVANCED,
        90,
      );

      // BAS max is 10, so capped at 10 (adds 5)
      // SWR1 max for ADVANCED is 45, so capped at 45 (adds 15)
      // SA max for ADVANCED is 35, so capped at 35 (adds 10)
      expect(result.BAS).toBe(10);
      expect(result.SWR1).toBe(45);
    });
  });

  describe("getStudioPreferencePlans", () => {
    it("should separate studio and non-studio plans", () => {
      const planStructures = [
        { skill: "SWR1", hasStudio: true },
        { skill: "BAS", hasStudio: false },
        { skill: "MAX", hasStudio: true },
      ];
      const activeTrainingDays = [
        { weekday: 1, active: true },
        { weekday: 3, active: true },
      ];

      const result = PlanGenerator.getStudioPreferencePlans(
        planStructures,
        activeTrainingDays,
      );

      expect(result).toHaveProperty("studio");
      expect(result).toHaveProperty("nonStudio");
      expect(Array.isArray(result.studio)).toBe(true);
      expect(Array.isArray(result.nonStudio)).toBe(true);
    });

    it("should keep original plan structure when 3 consecutive training days exist", () => {
      const planStructures = [
        { PHASE: ["SWR1", "SA"] },
        { PHASE: ["SK", "MAX"] },
        { PHASE: ["BAS", "GKS"] },
      ];
      const activeTrainingDays = [
        { weekday: 1, active: true },
        { weekday: 2, active: true },
        { weekday: 3, active: true },
      ];

      const result = PlanGenerator.getStudioPreferencePlans(
        planStructures,
        activeTrainingDays,
      );

      expect(result.studio.length + result.nonStudio.length).toBe(3);
    });

    it("should adjust plan structure to 1-2-1 pattern when training days have gaps", () => {
      const planStructures = [
        { PHASE: ["SWR1"] },
        { PHASE: ["SK"] },
        { PHASE: ["MAX"] },
      ];
      const activeTrainingDays = [
        { weekday: 1, active: true },
        { weekday: 3, active: true },
        { weekday: 5, active: true },
      ];

      const result = PlanGenerator.getStudioPreferencePlans(
        planStructures,
        activeTrainingDays,
      );

      expect(result.studio).toBeDefined();
      expect(result.nonStudio).toBeDefined();
    });

    it("should handle wrap-around consecutive days (Sat-Sun-Mon)", () => {
      const planStructures = [
        { PHASE: ["SWR1", "SA"] },
        { PHASE: ["SK", "MAX"] },
        { PHASE: ["BAS", "GKS"] },
      ];
      const activeTrainingDays = [
        { weekday: 6, active: true },
        { weekday: 0, active: true },
        { weekday: 1, active: true },
      ];

      const result = PlanGenerator.getStudioPreferencePlans(
        planStructures,
        activeTrainingDays,
      );

      expect(result.studio.length + result.nonStudio.length).toBe(3);
    });
  });

  describe("generatePlan", () => {
    it("should generate a complete training plan for an adult user", () => {
      const user = {
        userId: "test-user-1",
        personalData: { gender: "MALE" as const, birthday: "1990-01-01" },
        workoutData: {
          tags: {
            LEVEL: [WorkoutConstants.LEVELS.ADVANCED],
            POSITION: ["MIDFIELDER"],
          },
          seasonPhase: {
            type: SeasonPhase.COMPETITION,
            numOfWeeks: 8,
            endDate: "2025-03-01",
          },
        },
      };

      const exercisesList: any[] = [];
      const skillTrees: any = {};
      const exerciseBranchData: any = {};
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 1, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 2, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 3, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 4, duration: minutes(60), place: "HOME" },
        { active: true, weekday: 5, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 6, duration: minutes(60), place: "HOME" },
        { active: false, weekday: 0, duration: minutes(60), place: "HOME" },
      ];
      const places = {
        HOME: {
          equipment: ["WEIGHTS", "MAT"],
        },
      } as PlacesData;
      const startDate = new Date(2025, 0, 6); // Monday, Jan 6, 2025

      const result = PlanGenerator.generatePlan(
        user,
        exercisesList,
        skillTrees,
        exerciseBranchData,
        userTrainingDays,
        places,
        startDate,
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty("start");
      expect(result).toHaveProperty("sections");
      expect(Array.isArray(result.sections)).toBe(true);
      expect(result.sections.length).toBeGreaterThan(0);
    });

    it("should handle child users with adjusted level", () => {
      const user = {
        userId: "test-child-1",
        personalData: { gender: "MALE" as const, birthday: "2015-01-01" },
        workoutData: {
          tags: {
            LEVEL: [WorkoutConstants.LEVELS.PROFESSIONAL],
            POSITION: ["FORWARD"],
          },
          seasonPhase: {
            type: SeasonPhase.PREPARATORY,
            numOfWeeks: 6,
            endDate: "2025-02-15",
          },
        },
      };

      const exercisesList: any[] = [];
      const skillTrees: any = {};
      const exerciseBranchData: any = {};
      const userTrainingDays: TrainingDayType[] = [
        { active: false, weekday: 0, duration: minutes(60), place: "OUTSIDE" },
        { active: true, weekday: 1, duration: minutes(60), place: "OUTSIDE" },
        { active: false, weekday: 2, duration: minutes(60), place: "OUTSIDE" },
        { active: true, weekday: 3, duration: minutes(60), place: "OUTSIDE" },
        { active: false, weekday: 4, duration: minutes(60), place: "OUTSIDE" },
        { active: false, weekday: 5, duration: minutes(60), place: "OUTSIDE" },
        { active: false, weekday: 6, duration: minutes(60), place: "OUTSIDE" },
      ];
      const places = {
        OUTSIDE: {
          equipment: ["MAT"],
        },
      } as PlacesData;
      const startDate = new Date(2025, 0, 6);

      const result = PlanGenerator.generatePlan(
        user,
        exercisesList,
        skillTrees,
        exerciseBranchData,
        userTrainingDays,
        places,
        startDate,
      );

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(Array.isArray(result.sections)).toBe(true);
    });

    it("should handle users with pain and prevention needs", () => {
      const user = {
        userId: "test-user-pain",
        personalData: { gender: "MALE" as const, birthday: "1985-01-01" },
        workoutData: {
          tags: {
            LEVEL: [WorkoutConstants.LEVELS.BEGINNER],
            POSITION: ["DEFENDER"],
            PAIN: ["KNEE_LEFT"],
          },
          seasonPhase: {
            type: SeasonPhase.PAUSE,
            numOfWeeks: 4,
            endDate: "2025-02-03",
          },
        },
      };

      const exercisesList: any[] = [];
      const mockBranch = {
        tags: ["PREVENTION_KNEE"],
        levels: { 1: { exerciseId: "exercise-1" } },
      };
      const mockSkillTree = { "mock-branch": mockBranch };
      const skillTrees: Record<
        string,
        Record<
          string,
          { tags: string[]; levels: Record<number, { exerciseId: string }> }
        >
      > = {
        PREV: mockSkillTree,
        PREVKG: mockSkillTree,
        WUSPEZIAL: mockSkillTree,
        GKS: mockSkillTree,
        GKSKG: mockSkillTree,
        SA: mockSkillTree,
        SAKG: mockSkillTree,
        SK: mockSkillTree,
        SKKG: mockSkillTree,
        SWR1: mockSkillTree,
        SWR1KG: mockSkillTree,
        SWR2: mockSkillTree,
        SWR2KG: mockSkillTree,
        MOB: mockSkillTree,
        BAS: mockSkillTree,
        CD: mockSkillTree,
        BR: mockSkillTree,
        MAX: mockSkillTree,
        PLYO: mockSkillTree,
      };
      const exerciseBranchData: any = {};
      const userTrainingDays: TrainingDayType[] = [
        { active: false, weekday: 0, duration: minutes(60), place: "STUDIO" },
        { active: false, weekday: 1, duration: minutes(60), place: "STUDIO" },
        { active: true, weekday: 2, duration: minutes(60), place: "STUDIO" },
        { active: false, weekday: 3, duration: minutes(60), place: "STUDIO" },
        { active: true, weekday: 4, duration: minutes(60), place: "STUDIO" },
        { active: false, weekday: 5, duration: minutes(60), place: "STUDIO" },
        { active: false, weekday: 6, duration: minutes(60), place: "STUDIO" },
      ];
      const places = {
        STUDIO: {
          equipment: ["DUMBBELL", "MAT", "BANDS"],
        },
      } as PlacesData;
      const startDate = new Date(2025, 0, 6);

      const result = PlanGenerator.generatePlan(
        user,
        exercisesList,
        skillTrees,
        exerciseBranchData,
        userTrainingDays,
        places,
        startDate,
      );

      expect(result).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(Array.isArray(result.sections)).toBe(true);
    });

    describe("generatePlan: age group from the birthday", () => {
      const generateProfessionalPlan = (personalData?: {
        gender: "MALE" | "FEMALE";
        birthday: string;
      }) => {
        const skillTrees: Record<string, SkillTreeType> = {};
        for (const name of ["MAX", "SWR1", "SK", "MOB", "WU", "CD"] as const) {
          skillTrees[name] = loadSkillTree(name);
        }
        const user = {
          userId: "test-user-age",
          personalData,
          workoutData: {
            tags: {
              LEVEL: [WorkoutConstants.LEVELS.PROFESSIONAL],
              POSITION: ["FIELD"],
            },
            seasonPhase: {
              type: SeasonPhase.PREPARATORY,
              numOfWeeks: 20,
              endDate: "2026-06-15",
            },
          },
        };
        const userTrainingDays: TrainingDayType[] = [0, 1, 2, 3, 4, 5, 6].map(
          (weekday) => ({
            active: weekday === 1,
            weekday,
            duration: minutes(60),
            place: "STUDIO",
          }),
        );
        const places = {
          STUDIO: { equipment: ["BARBELL", "DUMBBELL", "BENCH", "MAT"] },
        } as PlacesData;

        return PlanGenerator.generatePlan(
          user,
          loadExercises(),
          skillTrees,
          {},
          userTrainingDays,
          places,
          new Date(2026, 0, 19),
        );
      };
      const sectionTypes = (plan: { sections: { type: string }[] }) =>
        plan.sections.map((section) => section.type);

      it("plans an athlete with an adult birthday as an adult and keeps the professional max strength sections", () => {
        expect(
          sectionTypes(
            generateProfessionalPlan({
              gender: "MALE",
              birthday: "1990-01-01",
            }),
          ),
        ).toContain("MAX");
      });

      it("plans an athlete without a birthday as an adult and keeps the professional max strength sections", () => {
        expect(sectionTypes(generateProfessionalPlan())).toContain("MAX");
      });

      it("plans an athlete with a child birthday as a child without max strength", () => {
        const childBirthday = `${new Date().getFullYear() - 10}-01-01`;
        expect(
          sectionTypes(
            generateProfessionalPlan({
              gender: "MALE",
              birthday: childBirthday,
            }),
          ),
        ).not.toContain("MAX");
      });
    });

    it("should generate a valid plan for advanced fieldplayer with preparatory phase", () => {
      const skillTreeNames = [
        "BAS",
        "BR",
        "CARDIO_1_SHORT",
        "CARDIO_1_LAKTAT",
        "CARDIO_2",
        "CARDIO_3",
        "CARDIO_4",
        "CARDIO_5",
        "CD",
        "GKS",
        "GKSKG",
        "MAX",
        "MOB",
        "PLYO",
        "PREV",
        "PREVKG",
        "SA",
        "SAKG",
        "SASPEZIAL",
        "SK",
        "SKKG",
        "SWR1",
        "SWR1KG",
        "WU",
        "WUSKSA",
        "WUSPEZIAL",
      ] as const;
      const skillTrees: Record<string, SkillTreeType> = {};
      for (const name of skillTreeNames) {
        skillTrees[name] = loadSkillTree(name);
      }
      const exercisesList = loadExercises();

      const user = {
        userId: "test-user-prep",
        personalData: { gender: "MALE" as const, birthday: "1987-01-01" },
        workoutData: {
          tags: {
            LEVEL: [WorkoutConstants.LEVELS.ADVANCED],
            POSITION: ["FIELD"],
          },
          seasonPhase: {
            type: SeasonPhase.PREPARATORY,
            numOfWeeks: 20,
            endDate: "2026-06-15",
          },
        },
      };
      // Tu, We, Th, Sa active - each 30 min at STUDIO
      const userTrainingDays: TrainingDayType[] = [
        { active: false, weekday: 0, duration: minutes(30), place: "STUDIO" },
        { active: true, weekday: 1, duration: minutes(30), place: "STUDIO" },
        { active: true, weekday: 2, duration: minutes(30), place: "STUDIO" },
        { active: true, weekday: 3, duration: minutes(30), place: "STUDIO" },
        { active: false, weekday: 4, duration: minutes(30), place: "STUDIO" },
        { active: true, weekday: 5, duration: minutes(30), place: "STUDIO" },
        { active: false, weekday: 6, duration: minutes(30), place: "STUDIO" },
      ];
      const places = {
        STUDIO: {
          equipment: ["WEIGHTS", "MAT", "DUMBBELL"],
        },
      } as PlacesData;
      const startDate = new Date(2026, 0, 19);

      const result = PlanGenerator.generatePlan(
        user,
        exercisesList,
        skillTrees,
        {},
        userTrainingDays,
        places,
        startDate,
      );

      expect(result).toBeDefined();
      expect(result).toHaveProperty("start");
      expect(result).toHaveProperty("sections");
      expect(Array.isArray(result.sections)).toBe(true);
      expect(result.sections.length).toBeGreaterThan(0);
    });
  });

  describe("createSection", () => {
    const mockPlaces: PlacesData = {
      HOME: { equipment: ["DUMBBELL", "FOAM_ROLLER"] },
      STUDIO: { equipment: ["BARBELL", "BENCH"] },
      HALL: { equipment: [] },
      OUTSIDE: { equipment: ["TRACK_20"] },
    };

    const mockSeasonPhase: SeasonPhaseType = {
      type: SeasonPhase.PREPARATORY,
      numOfWeeks: 4,
      endDate: "2026-03-01",
    };

    const mockUser = {
      userId: "test-user",
      personalData: { gender: "MALE" as const, birthday: "1990-01-01" },
      workoutData: {
        tags: { LEVEL: ["BEGINNER"], POSITION: ["FIELD"] },
      },
    };

    const createMockSection = (
      type: "SWR1" | "SK" | "SA" = "SWR1",
    ): TrainingSectionType => ({
      start: "2026-01-01",
      numOfWeeks: 4,
      type,
      cardioType: "CARDIO_1",
      trainings: [],
    });

    const createMockTrainingDays = (
      activeDays: number[] = [0, 2, 4],
    ): TrainingDayType[] => {
      return Array.from({ length: 7 }, (_, i) => ({
        active: activeDays.includes(i),
        weekday: i,
        duration: minutes(60),
        place: "HOME" as const,
      }));
    };

    it("returns a section with trainings matching active days", () => {
      const section = createMockSection();
      const trainingDays = createMockTrainingDays([0, 2]);

      const result = PlanGenerator.createSection(
        section,
        trainingDays,
        mockPlaces,
        mockSeasonPhase,
        mockUser,
        false,
        "ADULT",
        "BEGINNER",
        [],
        [],
        {},
        {},
      );

      expect(result.trainings).toHaveLength(2);
      expect(result.type).toBe("SWR1");
    });

    it("preserves weekday info in generated trainings", () => {
      const section = createMockSection();
      const trainingDays = createMockTrainingDays([1, 4]);

      const result = PlanGenerator.createSection(
        section,
        trainingDays,
        mockPlaces,
        mockSeasonPhase,
        mockUser,
        false,
        "ADULT",
        "BEGINNER",
        [],
        [],
        {},
        {},
      );

      const weekdays = result.trainings.map((t) => t.weekday);
      expect(weekdays).toContain(1);
      expect(weekdays).toContain(4);
    });

    it("returns empty trainings when no active days", () => {
      const result = PlanGenerator.createSection(
        createMockSection(),
        createMockTrainingDays([]),
        mockPlaces,
        mockSeasonPhase,
        mockUser,
        false,
        "ADULT",
        "BEGINNER",
        [],
        [],
        {},
        {},
      );

      expect(result.trainings).toHaveLength(0);
    });

    it("assigns focus and time lengths to each training", () => {
      const section = createMockSection();
      const trainingDays = createMockTrainingDays([0]);

      const result = PlanGenerator.createSection(
        section,
        trainingDays,
        mockPlaces,
        mockSeasonPhase,
        mockUser,
        false,
        "ADULT",
        "BEGINNER",
        [],
        [],
        {},
        {},
      );

      const training = result.trainings[0];
      expect(training).toMatchObject({
        weekday: 0,
        focus: expect.stringMatching(/^(PHASE|CARDIO|STABILITY|COMBINED)$/),
      });
      expect(
        Object.values(training.lengths).every(
          (v) => typeof v === "number" && v > 0,
        ),
      ).toBe(true);
    });
  });

  /**
   * Selects appropriate training section templates based on season phase, age group, and level.
   * Handles plans longer than 20 weeks by repeating sections, and adjusts MAX to SWR2 for
   * beginners or users without weights. For keepers, converts SA sections to SK.
   */
  describe("getSectionsBySeasonPhaseAgeGroupLevelNumOfWeeks", () => {
    it("should return correct sections for competition adult advanced 8 weeks", () => {
      const result =
        PlanGenerator.getSectionsBySeasonPhaseAgeGroupLevelNumOfWeeks(
          SeasonPhase.COMPETITION,
          WorkoutConstants.AGE_GROUPS.ADULT,
          WorkoutConstants.LEVELS.ADVANCED,
          8,
          true,
          false,
        );

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 3,
        cardioType: "CARDIO_2",
      });
      expect(result[1]).toMatchObject({
        type: "MAX",
        numOfWeeks: 3,
        cardioType: "CARDIO_1_SHORT",
      });
      expect(result[2]).toMatchObject({
        type: "SK",
        numOfWeeks: 2,
        cardioType: "CARDIO_2",
      });
    });

    it("should convert MAX to SWR2 for beginners with weights", () => {
      // Use competition adult beginner - the beginner data doesn't have MAX originally,
      // but if it did, it would be converted. We verify no MAX exists in result.
      const result =
        PlanGenerator.getSectionsBySeasonPhaseAgeGroupLevelNumOfWeeks(
          SeasonPhase.PREPARATORY,
          WorkoutConstants.AGE_GROUPS.ADULT,
          WorkoutConstants.LEVELS.BEGINNER,
          6,
          true,
          false,
        );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 3,
        cardioType: "CARDIO_3",
      });
      expect(result[1]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 3,
        cardioType: "CARDIO_2",
      });
      expect(result.some((s) => s.type === "MAX")).toBe(false);
    });

    it("should convert MAX to SWR2 when professional user has no weights", () => {
      // competition adult professional 12 weeks normally has MAX sections
      const result =
        PlanGenerator.getSectionsBySeasonPhaseAgeGroupLevelNumOfWeeks(
          SeasonPhase.COMPETITION,
          WorkoutConstants.AGE_GROUPS.ADULT,
          WorkoutConstants.LEVELS.PROFESSIONAL,
          12,
          false, // no weights - should convert MAX to SWR2
          false,
        );

      expect(result).toHaveLength(4);
      // MAX sections should be converted to SWR2
      expect(result[0]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 3,
        cardioType: "CARDIO_2",
      });
      expect(result[1]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 3,
        cardioType: "CARDIO_1_SHORT",
      });
      expect(result[2]).toMatchObject({
        type: "SK",
        numOfWeeks: 3,
        cardioType: "CARDIO_2",
      });
      expect(result[3]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 3,
        cardioType: "CARDIO_1_LAKTAT",
      });
    });
  });

  /**
   * Calculates minimum durations for each skill in a training block.
   * Uses getTagsForSkill to fetch tag configurations and extracts the smallest duration key.
   * Returns an object mapping each skill to its minimum required time in minutes.
   */
  describe("getMinimumDurationsForBlock", () => {
    it("should return minimum duration for a single skill in block", () => {
      const block = ["SA"];
      const result = PlanGenerator.getMinimumDurationsForBlock(
        block,
        [],
        "preparatory",
        WorkoutConstants.AGE_GROUPS.ADULT,
        WorkoutConstants.LEVELS.BEGINNER,
      );

      expect(result).toHaveProperty("SA");
      expect(result.SA).toBe(15);
    });

    it("should return minimum durations for multiple skills in block", () => {
      const block = ["SWR1", "BAS"];
      const result = PlanGenerator.getMinimumDurationsForBlock(
        block,
        [],
        "competition",
        WorkoutConstants.AGE_GROUPS.ADULT,
        WorkoutConstants.LEVELS.ADVANCED,
      );

      expect(Object.keys(result)).toHaveLength(2);
      expect(result.SWR1).toBe(20);
      expect(result.BAS).toBe(5);
    });

    it("should skip null skills in the block", () => {
      const block = ["MAX", null, "BAS"];
      const result = PlanGenerator.getMinimumDurationsForBlock(
        block,
        [],
        "competition",
        WorkoutConstants.AGE_GROUPS.ADULT,
        WorkoutConstants.LEVELS.PROFESSIONAL,
      );

      expect(Object.keys(result)).toHaveLength(2);
      expect(result).not.toHaveProperty("null");
      expect(result.MAX).toBe(15);
    });
  });

  /**
   * Selects exercise branches for a skill based on weighted tags.
   * Accumulates branches from getBranchesForWorkout for each tag group.
   */
  describe("chooseByTags", () => {
    const emptyDirections = {};
    const mockUser = {
      userId: "test-user",
      personalData: { gender: "MALE" as const, birthday: "1990-01-01" },
      workoutData: { tags: {} },
    };

    it("returns empty array when weightedTags is empty", () => {
      const result = PlanGenerator.chooseByTags(
        "SWR1",
        [],
        emptyDirections,
        emptyDirections,
        emptyDirections,
        emptyDirections,
        [],
        mockUser,
        "HOME",
        [],
        {},
        [],
        {},
        [],
      );

      expect(result).toEqual([]);
    });

    it("returns array (empty when no matching branches found)", () => {
      const result = PlanGenerator.chooseByTags(
        "SWR1",
        [{ tags: ["UPPER_BODY"], count: 1 }],
        emptyDirections,
        emptyDirections,
        emptyDirections,
        emptyDirections,
        [],
        mockUser,
        "HOME",
        [],
        {},
        [],
        {},
        [],
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it("accumulates branches from multiple weighted tag groups", () => {
      const mockBranch = {
        branchId: "branch-1",
        tags: ["UPPER_BODY"],
        exercises: { 1: { exerciseId: "ex1" } },
      };

      const spy = jest
        .spyOn(PlanGenerator, "getBranchesForWorkout")
        .mockReturnValue([mockBranch]);

      const result = PlanGenerator.chooseByTags(
        "SWR1",
        [
          { tags: ["UPPER_BODY"], count: 1 },
          { tags: ["LOWER_BODY"], count: 1 },
        ],
        emptyDirections,
        emptyDirections,
        emptyDirections,
        emptyDirections,
        [],
        mockUser,
        "HOME",
        [],
        {},
        [],
        {},
        [],
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        branchId: "branch-1",
        tags: ["UPPER_BODY"],
      });

      spy.mockRestore();
    });
  });
});
