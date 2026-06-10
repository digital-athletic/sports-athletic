import { WorkoutConstants } from "@/constants/workoutConstants";
import type { PlacesData } from "@/store/placesStore";
import {
  equipmentExists,
  hasAnyBarbell,
  hasBarbell,
  hasRunEquipment,
  hasWeights,
} from "./equipmentUtils";

const makePlaces = (overrides: Partial<PlacesData> = {}): PlacesData => ({
  HOME: { equipment: [] },
  STUDIO: { equipment: [] },
  HALL: { equipment: [] },
  OUTSIDE: { equipment: [] },
  ...overrides,
});

describe("equipmentUtils", () => {
  const { EQUIPMENT } = WorkoutConstants;

  describe("hasBarbell", () => {
    it("returns true when equipment includes BARBELL", () => {
      expect(hasBarbell([EQUIPMENT.BARBELL])).toBe(true);
    });

    it("returns true when equipment includes BARBELL_MULTIPLE", () => {
      expect(hasBarbell([EQUIPMENT.BARBELL_MULTIPLE])).toBe(true);
    });

    it("returns false when equipment has no barbell", () => {
      expect(hasBarbell([EQUIPMENT.DUMBBELL, EQUIPMENT.BENCH])).toBe(false);
    });

    it("returns false for empty equipment array", () => {
      expect(hasBarbell([])).toBe(false);
    });
  });

  describe("hasAnyBarbell", () => {
    it("returns true when barbell is in exactly one place", () => {
      const places = makePlaces({ HALL: { equipment: [EQUIPMENT.BARBELL] } });
      expect(hasAnyBarbell(places)).toBe(true);
    });

    it("returns false when no place has barbell equipment", () => {
      const places = makePlaces({
        HOME: { equipment: [EQUIPMENT.DUMBBELL] },
        STUDIO: { equipment: [EQUIPMENT.BENCH] },
      });
      expect(hasAnyBarbell(places)).toBe(false);
    });

    it("returns true when only BARBELL_MULTIPLE is present", () => {
      const places = makePlaces({
        STUDIO: { equipment: [EQUIPMENT.BARBELL_MULTIPLE] },
      });
      expect(hasAnyBarbell(places)).toBe(true);
    });

    it("returns false when all places have empty equipment arrays", () => {
      expect(hasAnyBarbell(makePlaces())).toBe(false);
    });
  });

  describe("hasWeights", () => {
    it("returns true when equipment includes DUMBBELL", () => {
      const equipment = [EQUIPMENT.DUMBBELL, EQUIPMENT.BENCH];
      expect(hasWeights(equipment)).toBe(true);
    });

    it("returns true when equipment includes BARBELL", () => {
      const equipment = [EQUIPMENT.BARBELL, EQUIPMENT.BENCH];
      expect(hasWeights(equipment)).toBe(true);
    });

    it("returns true when equipment includes BARBELL_MULTIPLE", () => {
      const equipment = [EQUIPMENT.BARBELL_MULTIPLE, EQUIPMENT.BENCH];
      expect(hasWeights(equipment)).toBe(true);
    });

    it("returns true when equipment includes multiple weight types", () => {
      const equipment = [
        EQUIPMENT.DUMBBELL,
        EQUIPMENT.BARBELL,
        EQUIPMENT.BARBELL_MULTIPLE,
      ];
      expect(hasWeights(equipment)).toBe(true);
    });

    it("returns false when equipment has no weight equipment", () => {
      const equipment = [EQUIPMENT.BENCH, EQUIPMENT.CHAIR, EQUIPMENT.TOWEL];
      expect(hasWeights(equipment)).toBe(false);
    });

    it("returns false when equipment has kettlebells but no dumbbells or barbells", () => {
      const equipment = [EQUIPMENT.KETTLEBELL, EQUIPMENT.BENCH];
      expect(hasWeights(equipment)).toBe(false);
    });

    it("returns false for empty equipment array", () => {
      expect(hasWeights([])).toBe(false);
    });
  });

  describe("hasRunEquipment", () => {
    it("returns true when equipment includes TREADMILL", () => {
      const equipment = [EQUIPMENT.TREADMILL, EQUIPMENT.BENCH];
      expect(hasRunEquipment(equipment)).toBe(true);
    });

    it("returns true when equipment includes AREA_10", () => {
      const equipment = [EQUIPMENT.AREA_10];
      expect(hasRunEquipment(equipment)).toBe(true);
    });

    it("returns true when equipment includes AREA_20", () => {
      const equipment = [EQUIPMENT.AREA_20];
      expect(hasRunEquipment(equipment)).toBe(true);
    });

    it("returns true when equipment includes AREA_5", () => {
      const equipment = [EQUIPMENT.AREA_5];
      expect(hasRunEquipment(equipment)).toBe(true);
    });

    it("returns true when equipment includes TRACK_20", () => {
      const equipment = [EQUIPMENT.TRACK_20];
      expect(hasRunEquipment(equipment)).toBe(true);
    });

    it("returns true when equipment includes TRACK_LONG", () => {
      const equipment = [EQUIPMENT.TRACK_LONG];
      expect(hasRunEquipment(equipment)).toBe(true);
    });

    it("returns true when equipment includes TRACK_5", () => {
      const equipment = [EQUIPMENT.TRACK_5];
      expect(hasRunEquipment(equipment)).toBe(true);
    });

    it("returns false when equipment has no running equipment", () => {
      const equipment = [EQUIPMENT.DUMBBELL, EQUIPMENT.BENCH];
      expect(hasRunEquipment(equipment)).toBe(false);
    });

    it("returns false for empty equipment array", () => {
      expect(hasRunEquipment([])).toBe(false);
    });
  });

  describe("equipmentExists", () => {
    describe("medicine ball and dumbbell equivalence", () => {
      it("returns true when medicine ball is required and dumbbell is in otherParts", () => {
        const part = EQUIPMENT.MEDICINE_BALL;
        const equipment = [EQUIPMENT.DUMBBELL];
        const otherParts = [EQUIPMENT.DUMBBELL];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when dumbbell is required and medicine ball is in otherParts", () => {
        const part = EQUIPMENT.DUMBBELL;
        const equipment = [EQUIPMENT.MEDICINE_BALL];
        const otherParts = [EQUIPMENT.MEDICINE_BALL];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when medicine ball is required and medicine ball jumping is in otherParts", () => {
        const part = EQUIPMENT.MEDICINE_BALL;
        const equipment = [EQUIPMENT.DUMBBELL];
        const otherParts = [
          EQUIPMENT.DUMBBELL,
          EQUIPMENT.MEDICINE_BALL_JUMPING,
        ];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });
    });

    describe("barbell handling", () => {
      it("returns true when barbell is required and BARBELL is available", () => {
        const part = EQUIPMENT.BARBELL;
        const equipment = [EQUIPMENT.BARBELL];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when barbell is required and BARBELL_MULTIPLE is available", () => {
        const part = EQUIPMENT.BARBELL;
        const equipment = [EQUIPMENT.BARBELL_MULTIPLE];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns false when barbell is required but not available", () => {
        const part = EQUIPMENT.BARBELL;
        const equipment = [EQUIPMENT.DUMBBELL];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          false,
        );
      });
    });

    describe("chair and box substitution", () => {
      it("returns true when chair is required and bench is available", () => {
        const part = EQUIPMENT.CHAIR;
        const equipment = [EQUIPMENT.BENCH];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when chair is required and chair is available", () => {
        const part = EQUIPMENT.CHAIR;
        const equipment = [EQUIPMENT.CHAIR];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when box low is required and bench is available", () => {
        const part = EQUIPMENT.BOX_LOW;
        const equipment = [EQUIPMENT.BENCH];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when box low is required and chair is available", () => {
        const part = EQUIPMENT.BOX_LOW;
        const equipment = [EQUIPMENT.CHAIR];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });
    });

    describe("bench handling", () => {
      it("returns true when any bench is required and bench is available", () => {
        const part = EQUIPMENT.BENCH;
        const equipment = [EQUIPMENT.BENCH];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when bench is required and adjustable bench is available", () => {
        const part = EQUIPMENT.BENCH;
        const equipment = [EQUIPMENT.ADJUSTABLE_BENCH];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when incline bench is required and adjustable bench is available (only incline needed)", () => {
        const part = EQUIPMENT.INCLINE_BENCH;
        const equipment = [EQUIPMENT.ADJUSTABLE_BENCH];
        const otherParts = [EQUIPMENT.INCLINE_BENCH];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when incline bench is required and incline bench is available (only incline needed)", () => {
        const part = EQUIPMENT.INCLINE_BENCH;
        const equipment = [EQUIPMENT.INCLINE_BENCH];
        const otherParts = [EQUIPMENT.INCLINE_BENCH];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns true when incline bench is required with other bench types in otherParts", () => {
        const part = EQUIPMENT.INCLINE_BENCH;
        const equipment = [EQUIPMENT.BENCH];
        const otherParts = [EQUIPMENT.INCLINE_BENCH, EQUIPMENT.BENCH];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns false when incline bench is required but only regular bench is available (only incline needed)", () => {
        const part = EQUIPMENT.INCLINE_BENCH;
        const equipment = [EQUIPMENT.BENCH];
        const otherParts = [EQUIPMENT.INCLINE_BENCH];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          false,
        );
      });
    });

    describe("default equipment matching", () => {
      it("returns true when equipment exactly matches the part", () => {
        const part = EQUIPMENT.KETTLEBELL;
        const equipment = [EQUIPMENT.KETTLEBELL];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns false when equipment does not include the part", () => {
        const part = EQUIPMENT.KETTLEBELL;
        const equipment = [EQUIPMENT.DUMBBELL, EQUIPMENT.BENCH];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          false,
        );
      });

      it("returns true when part is one of multiple equipment items", () => {
        const part = EQUIPMENT.TOWEL;
        const equipment = [EQUIPMENT.BENCH, EQUIPMENT.TOWEL, EQUIPMENT.CHAIR];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          true,
        );
      });

      it("returns false for empty equipment array", () => {
        const part = EQUIPMENT.DUMBBELL;
        const equipment: string[] = [];
        const otherParts: string[] = [];
        const exerciseIds: string[] = [];

        expect(equipmentExists(part, equipment, otherParts, exerciseIds)).toBe(
          false,
        );
      });
    });
  });
});
