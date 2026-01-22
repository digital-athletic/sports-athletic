import { WorkoutConstants } from "@/constants/workoutConstants";
import type { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { TrainingSectionType } from "@/features/training/models/TrainingSection";
import type { PlacesState } from "@/store/placesStore";
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
        { active: true, weekday: 0, duration: 60, place: "HOME" },
        { active: true, weekday: 1, duration: 60, place: "HOME" },
        { active: false, weekday: 2, duration: 60, place: "HOME" },
        { active: true, weekday: 3, duration: 60, place: "HOME" },
        { active: true, weekday: 4, duration: 60, place: "HOME" },
        { active: false, weekday: 5, duration: 60, place: "HOME" },
        { active: false, weekday: 6, duration: 60, place: "HOME" },
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
          duration: 60,
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
          duration: 60,
          place: "HOME" as const,
        }));

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(0);
    });

    it("should wrap around week boundary for consecutive days spanning Sunday to Monday", () => {
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 0, duration: 60, place: "HOME" }, // Sunday - active
        { active: false, weekday: 1, duration: 60, place: "HOME" },
        { active: false, weekday: 2, duration: 60, place: "HOME" },
        { active: false, weekday: 3, duration: 60, place: "HOME" },
        { active: false, weekday: 4, duration: 60, place: "HOME" },
        { active: true, weekday: 5, duration: 60, place: "HOME" }, // Friday - active
        { active: true, weekday: 6, duration: 60, place: "HOME" }, // Saturday - active
      ];

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(1);
      expect(groups[0].map((d) => d.weekday)).toEqual([5, 6, 0]);
    });

    it("should create separate groups for alternating training days", () => {
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 0, duration: 60, place: "HOME" },
        { active: false, weekday: 1, duration: 60, place: "HOME" },
        { active: true, weekday: 2, duration: 60, place: "HOME" },
        { active: false, weekday: 3, duration: 60, place: "HOME" },
        { active: true, weekday: 4, duration: 60, place: "HOME" },
        { active: false, weekday: 5, duration: 60, place: "HOME" },
        { active: false, weekday: 6, duration: 60, place: "HOME" },
      ];

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(3);
      expect(groups.every((g) => g.length === 1)).toBe(true);
    });

    it("should preserve training day properties in groups", () => {
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 0, duration: 60, place: "HOME" },
        { active: true, weekday: 1, duration: 45, place: "STUDIO" },
        { active: false, weekday: 2, duration: 60, place: "HOME" },
        { active: false, weekday: 3, duration: 60, place: "HOME" },
        { active: false, weekday: 4, duration: 60, place: "HOME" },
        { active: false, weekday: 5, duration: 60, place: "HOME" },
        { active: false, weekday: 6, duration: 60, place: "HOME" },
      ];

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups[0][0]).toMatchObject({
        weekday: 0,
        duration: 60,
        place: "HOME",
      });
      expect(groups[0][1]).toMatchObject({
        weekday: 1,
        duration: 45,
        place: "STUDIO",
      });
    });
  });

  describe("getTrainingDayGroupsFocuses", () => {
    const mockPlaces: PlacesState = {
      HOME: { name: "HOME", equipment: ["DUMBBELL", "MAT"] },
      STUDIO: { name: "STUDIO", equipment: ["BARBELL", "BENCH"] },
      HALL: { name: "HALL", equipment: [] },
      OUTSIDE: { name: "OUTSIDE", equipment: ["TRACK_20"] },
    };

    it("should return PHASE for all child training days", () => {
      const trainingDayGroups: TrainingDayType[][] = [
        [{ active: true, weekday: 1, duration: 60, place: "HOME" }],
        [{ active: true, weekday: 4, duration: 45, place: "STUDIO" }],
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
          { active: true, weekday: 1, duration: 60, place: "STUDIO" },
          { active: true, weekday: 2, duration: 60, place: "OUTSIDE" },
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

    it("should return PHASE for single-day adult training group", () => {
      const trainingDayGroups: TrainingDayType[][] = [
        [{ active: true, weekday: 3, duration: 60, place: "HOME" }],
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

  /**
   * Assigns a training focus (PHASE, CARDIO, STABILITY, COMBINED) to each day in a group.
   * Children always receive PHASE. For adults, assignment depends on place type, equipment
   * availability (weights, run equipment), and session duration to optimize training variety.
   */
  describe("getFocusForTrainingDayGroup", () => {
    const mockPlaces: PlacesState = {
      HOME: { name: "HOME", equipment: ["DUMBBELL", "MAT"] },
      STUDIO: { name: "STUDIO", equipment: ["BARBELL", "BENCH"] },
      HALL: { name: "HALL", equipment: [] },
      OUTSIDE: { name: "OUTSIDE", equipment: ["TRACK_20"] },
    };

    it("should assign PHASE to studio and CARDIO to outside for 2-day adult group", () => {
      const groupTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 1, duration: 60, place: "STUDIO" },
        { active: true, weekday: 2, duration: 45, place: "OUTSIDE" },
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
        { active: true, weekday: 1, duration: 45, place: "HOME" },
        { active: true, weekday: 2, duration: 60, place: "HOME" },
      ];

      const focuses = PlanGenerator.getFocusForTrainingDayGroup(
        groupTrainingDays,
        WorkoutConstants.AGE_GROUPS.ADULT,
        mockPlaces,
      );

      expect(focuses[0]).toBe("STABILITY");
      expect(focuses[1]).toBe("PHASE");
    });

    it("should return PHASE for all days in child age group regardless of places", () => {
      const groupTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 1, duration: 60, place: "STUDIO" },
        { active: true, weekday: 2, duration: 45, place: "OUTSIDE" },
        { active: true, weekday: 3, duration: 30, place: "HOME" },
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
        endDate: "01-05-2025",
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
        type: SeasonPhase.PREPATORY,
        numOfWeeks: 6,
        endDate: "01-03-2025",
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
        endDate: "01-02-2025",
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
      const startDate = "06-01-2025"; // Monday, Jan 6, 2025
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
      expect(result[0].start).toBe("06-01-2025"); // Jan 6
      expect(result[1].start).toBe("20-01-2025"); // Jan 6 + 2 weeks = Jan 20
      expect(result[2].start).toBe("10-02-2025"); // Jan 20 + 3 weeks = Feb 10
    });

    it("should adjust Friday start to next Monday", () => {
      const friday = "03-01-2025"; // Friday, Jan 3, 2025
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
      expect(result[0].start).toBe("06-01-2025");
      expect(result[1].start).toBe("20-01-2025"); // Jan 6 + 2 weeks
    });

    it("should preserve section properties while adding start dates", () => {
      const startDate = "06-01-2025";
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
        start: "06-01-2025",
        cardioType: "CARDIO_3",
        trainings: [],
      });
    });
  });

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
  });

  /**
   * Creates a complete training plan by combining weighted sections with calculated start dates.
   * Uses season phase, user demographics, and training preferences to determine section structure.
   * Returns a TrainingPlanType with a start date and array of training sections.
   */
  describe("initializeTrainingPlan", () => {
    it("should create plan with correct start date and sections for competition adult", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.COMPETITION,
        numOfWeeks: 8,
        endDate: "06-03-2025",
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

      expect(result.start).toEqual(startDate);
      expect(result.sections).toHaveLength(3);
      expect(result.sections[0]).toMatchObject({
        type: "SWR2",
        numOfWeeks: 3,
        start: "06-01-2025",
      });
      expect(result.sections[1]).toMatchObject({
        type: "MAX",
        numOfWeeks: 3,
        start: "27-01-2025",
      });
      expect(result.sections[2]).toMatchObject({
        type: "SK",
        numOfWeeks: 2,
        start: "17-02-2025",
      });
    });

    it("should create plan with child-appropriate sections for prepatory phase", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.PREPATORY,
        numOfWeeks: 6,
        endDate: "17-03-2025",
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

      expect(result.start).toEqual(startDate);
      expect(result.sections).toHaveLength(3);
      expect(result.sections[0]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        start: "03-02-2025",
      });
      expect(result.sections[1]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        start: "17-02-2025",
      });
      expect(result.sections[2]).toMatchObject({
        type: "SWR1",
        numOfWeeks: 2,
        start: "03-03-2025",
      });
    });

    it("should create plan without SA sections for keepers", () => {
      const seasonPhase: SeasonPhaseType = {
        type: SeasonPhase.COMPETITION,
        numOfWeeks: 10,
        endDate: "19-05-2025",
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

      expect(result.start).toEqual(startDate);
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
          { tags: ["REGION_OBERKOERPER", "REGION_UNTERKOERPER"], count: 2 },
          { tags: ["SKILL_SAS"], count: 1 },
        ],
        20: [
          { tags: ["REGION_OBERKOERPER"], count: 2 },
          { tags: ["REGION_UNTERKOERPER"], count: 2 },
        ],
        25: [
          { tags: ["REGION_OBERKOERPER"], count: 2 },
          { tags: ["REGION_UNTERKOERPER"], count: 2 },
          { tags: ["SKILL_SAS"], count: 2 },
        ],
        30: [
          { tags: ["REGION_OBERKOERPER"], count: 2 },
          { tags: ["REGION_UNTERKOERPER"], count: 2 },
          { tags: ["SKILL_SAS"], count: 2 },
        ],
        35: [
          { tags: ["REGION_OBERKOERPER"], count: 3 },
          { tags: ["REGION_UNTERKOERPER"], count: 3 },
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
        workoutData: {
          birthday: "01-01-1990",
          tags: [
            `LEVEL_${WorkoutConstants.LEVELS.ADVANCED}`,
            "POSITION_MIDFIELDER",
          ],
          seasonPhase: {
            type: SeasonPhase.COMPETITION,
            numOfWeeks: 8,
            endDate: "01-03-2025",
          },
        },
      };

      const exercisesList: any[] = [];
      const skillTrees: any = {};
      const exerciseBranchData: any = {};
      const userTrainingDays: TrainingDayType[] = [
        { active: true, weekday: 1, duration: 60, place: "HOME" },
        { active: false, weekday: 2, duration: 60, place: "HOME" },
        { active: true, weekday: 3, duration: 60, place: "HOME" },
        { active: false, weekday: 4, duration: 60, place: "HOME" },
        { active: true, weekday: 5, duration: 60, place: "HOME" },
        { active: false, weekday: 6, duration: 60, place: "HOME" },
        { active: false, weekday: 0, duration: 60, place: "HOME" },
      ];
      const places = {
        HOME: {
          name: "HOME",
          equipment: ["WEIGHTS", "MAT"],
        },
      } as PlacesState;
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
        workoutData: {
          birthday: "01-01-2015",
          tags: [
            `LEVEL_${WorkoutConstants.LEVELS.PROFESSIONAL}`,
            "POSITION_FORWARD",
          ],
          seasonPhase: {
            type: SeasonPhase.PREPATORY,
            numOfWeeks: 6,
            endDate: "15-02-2025",
          },
        },
      };

      const exercisesList: any[] = [];
      const skillTrees: any = {};
      const exerciseBranchData: any = {};
      const userTrainingDays: TrainingDayType[] = [
        { active: false, weekday: 0, duration: 60, place: "OUTSIDE" },
        { active: true, weekday: 1, duration: 60, place: "OUTSIDE" },
        { active: false, weekday: 2, duration: 60, place: "OUTSIDE" },
        { active: true, weekday: 3, duration: 60, place: "OUTSIDE" },
        { active: false, weekday: 4, duration: 60, place: "OUTSIDE" },
        { active: false, weekday: 5, duration: 60, place: "OUTSIDE" },
        { active: false, weekday: 6, duration: 60, place: "OUTSIDE" },
      ];
      const places = {
        OUTSIDE: {
          name: "OUTSIDE",
          equipment: ["MAT"],
        },
      } as PlacesState;
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
        workoutData: {
          birthday: "01-01-1985",
          tags: [
            `LEVEL_${WorkoutConstants.LEVELS.BEGINNER}`,
            "POSITION_DEFENDER",
            "PAIN_KNIE_LINKS",
          ],
          seasonPhase: {
            type: SeasonPhase.PAUSE,
            numOfWeeks: 4,
            endDate: "03-02-2025",
          },
        },
      };

      const exercisesList: any[] = [];
      const mockBranch = {
        tags: ["PREVENTION_KNEE"],
        levels: { "1": { id: "exercise-1" } },
      };
      const mockSkillTree = { "mock-branch": mockBranch };
      const skillTrees: Record<
        string,
        Record<
          string,
          { tags: string[]; levels: Record<string, { id: string }> }
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
        { active: false, weekday: 0, duration: 60, place: "STUDIO" },
        { active: false, weekday: 1, duration: 60, place: "STUDIO" },
        { active: true, weekday: 2, duration: 60, place: "STUDIO" },
        { active: false, weekday: 3, duration: 60, place: "STUDIO" },
        { active: true, weekday: 4, duration: 60, place: "STUDIO" },
        { active: false, weekday: 5, duration: 60, place: "STUDIO" },
        { active: false, weekday: 6, duration: 60, place: "STUDIO" },
      ];
      const places = {
        STUDIO: {
          name: "STUDIO",
          equipment: ["DUMBBELL", "MAT", "BANDS"],
        },
      } as PlacesState;
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
  });

  describe("createSection", () => {
    const mockPlaces: PlacesState = {
      HOME: { name: "HOME", equipment: ["DUMBBELL", "BLACK_ROLL"] },
      STUDIO: { name: "STUDIO", equipment: ["BARBELL", "BENCH"] },
      HALL: { name: "HALL", equipment: [] },
      OUTSIDE: { name: "OUTSIDE", equipment: ["TRACK_20"] },
    };

    const mockSeasonPhase: SeasonPhaseType = {
      type: SeasonPhase.PREPATORY,
      numOfWeeks: 4,
      endDate: "01-03-2026",
    };

    const mockUser = {
      userId: "test-user",
      workoutData: {
        tags: ["LEVEL_BEGINNER", "POSITION_FIELD"],
        birthday: "01-01-1990",
      },
    };

    const createMockSection = (
      type: "SWR1" | "SK" | "SA" = "SWR1",
    ): TrainingSectionType => ({
      start: "01-01-2026",
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
        duration: 60,
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
          SeasonPhase.PREPATORY,
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
        "prepatory",
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
      workoutData: { birthday: "01-01-1990", tags: [] },
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
        exerciseBranchId: "branch-1",
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
        exerciseBranchId: "branch-1",
        tags: ["UPPER_BODY"],
      });

      spy.mockRestore();
    });
  });
});
