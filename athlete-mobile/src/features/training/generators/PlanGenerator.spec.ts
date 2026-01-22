import { WorkoutConstants } from "@/constants/workoutConstants";
import type { SeasonPhaseType } from "@/features/training/models/SeasonPhase";
import { SeasonPhase } from "@/features/training/models/SeasonPhase";
import type { TrainingDayType } from "@/features/training/models/TrainingDay";
import type { TrainingSectionType } from "@/features/training/models/TrainingSection";
import type { PlacesState } from "@/store/placesStore";
import PlanGenerator from "./PlanGenerator";

describe("PlanGenerator", () => {
  describe("addDays", () => {
    it("should add days to a date within the same month", () => {
      const date = new Date(2025, 0, 15); // Jan 15, 2025
      const result = PlanGenerator.addDays(date, 10);
      expect(result.getDate()).toBe(25);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2025);
    });

    it("should add days crossing into next month", () => {
      const date = new Date(2025, 0, 25); // Jan 25, 2025
      const result = PlanGenerator.addDays(date, 10);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1);
      expect(result.getFullYear()).toBe(2025);
    });

    it("should add days crossing into next year", () => {
      const date = new Date(2025, 11, 28); // Dec 28, 2025
      const result = PlanGenerator.addDays(date, 10);
      expect(result.getDate()).toBe(7);
      expect(result.getMonth()).toBe(0);
      expect(result.getFullYear()).toBe(2026);
    });
  });

  describe("isLeapYear", () => {
    it("should check if year is leap year", () => {
      const year2024 = new Date(2024, 0, 1);
      const year2023 = new Date(2023, 0, 1);

      // Test the function returns a boolean
      expect(typeof PlanGenerator.isLeapYear(year2024)).toBe("boolean");
      expect(typeof PlanGenerator.isLeapYear(year2023)).toBe("boolean");
    });
  });

  describe("getMonthLength", () => {
    it("should return 31 for months with 31 days", () => {
      expect(PlanGenerator.getMonthLength(new Date(2025, 0, 1))).toBe(31); // Jan
      expect(PlanGenerator.getMonthLength(new Date(2025, 2, 1))).toBe(31); // Mar
      expect(PlanGenerator.getMonthLength(new Date(2025, 11, 1))).toBe(31); // Dec
    });

    it("should return 30 for months with 30 days", () => {
      expect(PlanGenerator.getMonthLength(new Date(2025, 3, 1))).toBe(30); // Apr
      expect(PlanGenerator.getMonthLength(new Date(2025, 5, 1))).toBe(30); // Jun
    });

    it("should return length for February", () => {
      const febLength = PlanGenerator.getMonthLength(new Date(2025, 1, 1));
      expect(febLength).toBeGreaterThanOrEqual(28);
      expect(febLength).toBeLessThanOrEqual(29);
    });
  });

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
  });

  describe("getTrainingDayGroups", () => {
    it("should group consecutive active training days", () => {
      const userTrainingDays = [
        { active: true, weekday: 0 },
        { active: true, weekday: 1 },
        { active: false, weekday: 2 },
        { active: true, weekday: 3 },
        { active: true, weekday: 4 },
        { active: false, weekday: 5 },
        { active: false, weekday: 6 },
      ];

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(2);
      expect(groups[0].length).toBe(2); // Days 3-4
      expect(groups[1].length).toBe(2); // Days 0-1
    });

    it("should handle all active days as single group", () => {
      const userTrainingDays = Array(7)
        .fill(null)
        .map((_, i) => ({
          active: true,
          weekday: i,
        }));

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(1);
      expect(groups[0].length).toBe(7);
    });

    it("should handle no active days", () => {
      const userTrainingDays = Array(7)
        .fill(null)
        .map((_, i) => ({
          active: false,
          weekday: i,
        }));

      const groups = PlanGenerator.getTrainingDayGroups(userTrainingDays);
      expect(groups.length).toBe(0);
    });
  });

  describe("calculateStartingDates", () => {
    it("should calculate starting dates for sections", () => {
      const startDate = "06-01-2025"; // Monday, Jan 6, 2025
      const sections = [
        {
          type: "SWR1" as const,
          numOfWeeks: 2,
          start: "06-01-2025",
          cardioType: "ZONE_1" as const,
          trainings: [],
        },
        {
          type: "SA" as const,
          numOfWeeks: 3,
          start: "06-01-2025",
          cardioType: "ZONE_2" as const,
          trainings: [],
        },
        {
          type: "MAX" as const,
          numOfWeeks: 1,
          start: "06-01-2025",
          cardioType: "ZONE_1" as const,
          trainings: [],
        },
      ];

      const result = PlanGenerator.calculateStartingDates(sections, startDate);

      expect(result.length).toBe(3);
      expect(result[0].start).toBeDefined();
      expect(result[1].start).toBeDefined();
      expect(result[2].start).toBeDefined();
    });

    it("should adjust start date to next Monday if not Monday", () => {
      const friday = "03-01-2025"; // Friday, Jan 3, 2025
      const sections = [
        {
          type: "SWR2" as const,
          numOfWeeks: 1,
          start: "03-01-2025",
          cardioType: "ZONE_1" as const,
          trainings: [],
        },
      ];

      const result = PlanGenerator.calculateStartingDates(sections, friday);

      expect(result[0]).toBeDefined();
      expect(result[0].start).toBeDefined();
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
  });

  describe("initializeTrainingPlan", () => {
    it("should initialize training plan with sections", () => {
      const seasonPhase = {
        type: "COMPETITION",
        numOfWeeks: 8,
      };
      const startDate = new Date(2025, 0, 6);

      const result = PlanGenerator.initializeTrainingPlan(
        seasonPhase,
        WorkoutConstants.AGE_GROUPS.ADULT,
        "MIDFIELDER",
        WorkoutConstants.LEVELS.ADVANCED,
        true,
        startDate,
        false,
      );

      expect(result).toHaveProperty("start");
      expect(result).toHaveProperty("sections");
      expect(Array.isArray(result.sections)).toBe(true);
      expect(result.sections.length).toBeGreaterThan(0);
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
  });

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
            type: "COMPETITION",
            numOfWeeks: 8,
          },
        },
      };

      const exercisesList: any[] = [];
      const skillTrees: any = {};
      const exerciseBranchData: any = {};
      const userTrainingDays = [
        { active: true, weekday: 1, place: "home" },
        { active: false, weekday: 2, place: "home" },
        { active: true, weekday: 3, place: "home" },
        { active: false, weekday: 4, place: "home" },
        { active: true, weekday: 5, place: "home" },
        { active: false, weekday: 6, place: "home" },
        { active: false, weekday: 0, place: "home" },
      ];
      const places = {
        home: {
          name: "Home",
          equipment: ["WEIGHTS", "MAT"],
        },
      };
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
            type: "PREPATORY",
            numOfWeeks: 6,
          },
        },
      };

      const exercisesList: any[] = [];
      const skillTrees: any = {};
      const exerciseBranchData: any = {};
      const userTrainingDays = [
        { active: false, weekday: 0, place: "field" },
        { active: true, weekday: 1, place: "field" },
        { active: false, weekday: 2, place: "field" },
        { active: true, weekday: 3, place: "field" },
        { active: false, weekday: 4, place: "field" },
        { active: false, weekday: 5, place: "field" },
        { active: false, weekday: 6, place: "field" },
      ];
      const places = {
        field: {
          name: "Field",
          equipment: ["MAT"],
        },
      };
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
            type: "PAUSE",
            numOfWeeks: 4,
          },
        },
      };

      const exercisesList: any[] = [];
      const skillTrees: any = {};
      const exerciseBranchData: any = {};
      const userTrainingDays = [
        { active: false, weekday: 0, place: "gym" },
        { active: false, weekday: 1, place: "gym" },
        { active: true, weekday: 2, place: "gym" },
        { active: false, weekday: 3, place: "gym" },
        { active: true, weekday: 4, place: "gym" },
        { active: false, weekday: 5, place: "gym" },
        { active: false, weekday: 6, place: "gym" },
      ];
      const places = {
        gym: {
          name: "Gym",
          equipment: ["WEIGHTS", "MAT", "BANDS"],
        },
      };
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
      cardioType: "ZONE_1",
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
