import { generateValueExercise } from "../../../../test/factories/valueExercise";
import { Logger } from "@/services/Logger";
import { roundWeight } from "./weightRounding";

const barbellExercise = generateValueExercise("repetition", {
  tags: ["EQ_BARBELL", "EQ_POWER_RACK"],
});
const dumbbellExercise = generateValueExercise("repetition", {
  tags: ["EQ_DUMBBELL", "EQ_BENCH"],
});
const kettlebellExercise = generateValueExercise("repetition", {
  tags: ["EQ_KETTLEBELL"],
});

describe("weightRounding: roundWeight", () => {
  it("rounds a barbell total load to the nearest 2.5 kg", () => {
    expect(roundWeight(41.3, barbellExercise)).toBe(42.5);
    expect(roundWeight(26.2, barbellExercise)).toBe(25);
    expect(roundWeight(102.7, barbellExercise)).toBe(102.5);
  });

  it("prescribes the empty bar for a lighter barbell load", () => {
    expect(roundWeight(12, barbellExercise)).toBe(20);
    expect(roundWeight(18.7, barbellExercise)).toBe(20);
    expect(roundWeight(20, barbellExercise)).toBe(20);
  });

  it("skips the empty bar minimum on request", () => {
    const options = { emptyBarMinimum: false };
    expect(roundWeight(12, barbellExercise, options)).toBe(12.5);
    expect(roundWeight(18.7, barbellExercise, options)).toBe(17.5);
  });

  it("keeps the empty bar minimum off other equipment", () => {
    expect(roundWeight(12, dumbbellExercise)).toBe(12);
    expect(roundWeight(12, kettlebellExercise)).toBe(12);
  });

  it("rounds a dumbbell up to 10 kg to the nearest 1 kg and above to 2 kg", () => {
    expect(roundWeight(7.4, dumbbellExercise)).toBe(7);
    expect(roundWeight(7.6, dumbbellExercise)).toBe(8);
    expect(roundWeight(10.2, dumbbellExercise)).toBe(10);
    expect(roundWeight(13.1, dumbbellExercise)).toBe(14);
    expect(roundWeight(12.9, dumbbellExercise)).toBe(12);
    expect(roundWeight(10.6, dumbbellExercise)).toBe(10);
  });

  it("rounds other weights to the nearest 1 kg", () => {
    expect(roundWeight(7.3, kettlebellExercise)).toBe(7);
    expect(roundWeight(26.6, kettlebellExercise)).toBe(27);
    expect(roundWeight(26.6, undefined)).toBe(27);
  });

  it("rounds an exact tie down", () => {
    expect(roundWeight(56.25, barbellExercise)).toBe(55);
    expect(roundWeight(41.25, barbellExercise)).toBe(40);
    expect(roundWeight(9.5, dumbbellExercise)).toBe(9);
    expect(roundWeight(11, dumbbellExercise)).toBe(10);
    expect(roundWeight(26.5, kettlebellExercise)).toBe(26);
  });

  it("logs and returns 0 for a value that is not finite", () => {
    const logError = jest
      .spyOn(Logger, "logError")
      .mockImplementation(async () => undefined);

    expect(roundWeight(Number.NaN, barbellExercise)).toBe(0);
    expect(roundWeight(Number.POSITIVE_INFINITY, barbellExercise)).toBe(0);
    expect(logError).toHaveBeenCalledTimes(2);
    logError.mockRestore();
  });
});
