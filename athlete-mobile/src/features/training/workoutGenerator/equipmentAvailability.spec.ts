import {
  type EquipmentPartNeed,
  isEquipmentPartAvailable,
} from "./equipmentAvailability";

type EquipmentPartNeedRow = [
  part: string,
  equipment: string[],
  otherParts: string[],
  exerciseIds: string[],
];

// [part, place equipment, every part the branch needs, exercise IDs], expected
const EQUIPMENT_PART_CASES: [EquipmentPartNeedRow, boolean][] = [
  [["MEDICINE_BALL", ["DUMBBELL"], ["DUMBBELL"], []], true],
  [["DUMBBELL", ["MEDICINE_BALL"], ["MEDICINE_BALL"], []], true],
  [
    ["MEDICINE_BALL", ["DUMBBELL"], ["MEDICINE_BALL_JUMPING", "DUMBBELL"], []],
    true,
  ],
  [["BARBELL", ["BARBELL_MULTIPLE"], [], []], true],
  [["BARBELL", ["DUMBBELL"], [], []], false],
  [["CHAIR", ["BENCH"], [], []], true],
  [["BOX_LOW", ["CHAIR"], [], []], true],
  [["BOX_LOW", ["DUMBBELL"], [], []], false],
  [["BENCH", ["ADJUSTABLE_BENCH"], [], []], true],
  [["INCLINE_BENCH", ["ADJUSTABLE_BENCH"], ["INCLINE_BENCH"], []], true],
  [["INCLINE_BENCH", ["BENCH"], ["INCLINE_BENCH"], []], false],
  [["INCLINE_BENCH", ["BENCH"], ["INCLINE_BENCH", "BENCH"], []], true],
  [["EXERCISING_BENCH", ["BENCH"], [], ["209"]], false],
  [["EXERCISING_BENCH", ["EXERCISING_BENCH"], [], ["209"]], true],
  [["MULTIPLE_EXERCISING_BENCHES", ["EXERCISING_BENCH"], [], ["209"]], false],
  [["BENCH", ["ADJUSTABLE_BENCH"], [], ["209"]], false],
  [["EXERCISING_BENCH", ["BENCH"], [], ["1"]], true],
  [["BENCH", ["CHAIR"], ["BENCH", "CHAIR"], []], true],
  [["BENCH", ["CHAIR"], ["BENCH"], []], false],
  [["TUBE_STRONG", ["TUBE_WEAK"], [], []], true],
  [["MINIBAND_LIGHT", ["MINIBAND"], [], []], true],
  [["TRACK_20", ["AREA_5"], [], []], true],
  [["AREA_10", ["DUMBBELL"], [], []], false],
  [["MEDICINE_BALL", ["MEDICINE_BALL_JUMPING"], [], []], true],
  [["TREADMILL", [], [], []], true],
  [["KETTLEBELL", ["KETTLEBELL"], [], []], true],
  [["KETTLEBELL", ["KETTLEBELL_MULTIPLE"], [], []], false],
  [["DUMBBELL", [], [], []], false],
];

describe("equipmentAvailability: isEquipmentPartAvailable", () => {
  it.each(EQUIPMENT_PART_CASES)(
    "part, place, branch parts and exercises %j: %s",
    ([part, equipment, otherParts, exerciseIds], expected) => {
      const need: EquipmentPartNeed = {
        part,
        equipment,
        otherParts,
        exerciseIds,
      };

      expect(isEquipmentPartAvailable(need)).toBe(expected);
    },
  );
});
