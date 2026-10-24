import { generateValueExercise } from "../../../../test/factories/valueExercise";
import { roundWeight } from "./weightRounding";

/**
 * Builds an exercise that uses the given equipment.
 *
 * generateEquipmentExercise("BARBELL")
 * → { id: "1", tags: ["REGION_UPPER_BODY", "SIDE_BOTH", "EQ_BARBELL"], ... }
 */
const generateEquipmentExercise = (equipment: string) =>
  generateValueExercise("repetition", { tags: [`EQ_${equipment}`] });

describe("weightRounding: roundWeight", () => {
  it("rounds a barbell total load to the nearest 2.5 kg", () => {
    const barbell = generateEquipmentExercise("BARBELL");

    expect(roundWeight(41.3, barbell)).toBe(42.5);
    expect(roundWeight(26.2, barbell)).toBe(25);
    expect(roundWeight(102.7, barbell)).toBe(102.5);
  });

  it("prescribes the empty bar for a lighter barbell load", () => {
    const barbell = generateEquipmentExercise("BARBELL");

    expect(roundWeight(12, barbell)).toBe(20);
    expect(roundWeight(18.7, barbell)).toBe(20);
    expect(roundWeight(20, barbell)).toBe(20);
  });

  it("skips the empty bar minimum on request", () => {
    const barbell = generateEquipmentExercise("BARBELL");
    const options = { emptyBarMinimum: false };

    expect(roundWeight(12, barbell, options)).toBe(12.5);
    expect(roundWeight(18.7, barbell, options)).toBe(17.5);
  });

  it("keeps the empty bar minimum off other equipment", () => {
    expect(roundWeight(12, generateEquipmentExercise("DUMBBELL"))).toBe(12);
    expect(roundWeight(12, generateEquipmentExercise("KETTLEBELL"))).toBe(12);
  });

  it("rounds a dumbbell up to 10 kg to the nearest 1 kg and above to 2 kg", () => {
    const dumbbell = generateEquipmentExercise("DUMBBELL");

    expect(roundWeight(7.4, dumbbell)).toBe(7);
    expect(roundWeight(7.6, dumbbell)).toBe(8);
    expect(roundWeight(10.2, dumbbell)).toBe(10);
    expect(roundWeight(13.1, dumbbell)).toBe(14);
    expect(roundWeight(12.9, dumbbell)).toBe(12);
    expect(roundWeight(10.6, dumbbell)).toBe(10);
  });

  it("rounds other weights to the nearest 1 kg", () => {
    const kettlebell = generateEquipmentExercise("KETTLEBELL");

    expect(roundWeight(7.3, kettlebell)).toBe(7);
    expect(roundWeight(26.6, kettlebell)).toBe(27);
    expect(roundWeight(26.6, undefined)).toBe(27);
  });

  it("rounds an exact tie down", () => {
    expect(roundWeight(56.25, generateEquipmentExercise("BARBELL"))).toBe(55);
    expect(roundWeight(41.25, generateEquipmentExercise("BARBELL"))).toBe(40);
    expect(roundWeight(9.5, generateEquipmentExercise("DUMBBELL"))).toBe(9);
    expect(roundWeight(11, generateEquipmentExercise("DUMBBELL"))).toBe(10);
    expect(roundWeight(26.5, generateEquipmentExercise("KETTLEBELL"))).toBe(26);
  });

  it("returns 0 for a value that is not finite", () => {
    const barbell = generateEquipmentExercise("BARBELL");

    expect(roundWeight(Number.NaN, barbell)).toBe(0);
    expect(roundWeight(Number.POSITIVE_INFINITY, barbell)).toBe(0);
  });
});
