import { type SportTest } from "./models/SportTest";
import { formatRangeNumber, referenceRangeFor } from "./referenceRange";

/**
 * A sport test with two reference values as the service returns it, e.g.
 * { id: "test-1", code: "FAKE_TEST", unit: "s", referenceValues: [{ gender: "FEMALE", position: "WING", trainingStage: "GRUNDLAGENTRAINING", rangeStart: 1.25, rangeEnd: 1.15 }] }
 */
const generateSportTest = (
  referenceValues: SportTest["referenceValues"],
): SportTest => ({
  id: "test-1",
  code: "FAKE_TEST",
  unit: "s",
  referenceValues,
});

const femaleWingGrundlagen = {
  gender: "FEMALE",
  position: "WING",
  trainingStage: "GRUNDLAGENTRAINING",
  rangeStart: 1.25,
  rangeEnd: 1.15,
} as const;

const maleWingGrundlagen = {
  ...femaleWingGrundlagen,
  gender: "MALE",
  rangeStart: 9.1,
  rangeEnd: 9.2,
} as const;

const femaleGoalkeeperGrundlagen = {
  ...femaleWingGrundlagen,
  position: "GOALKEEPER",
  rangeStart: 7.1,
  rangeEnd: 7.2,
} as const;

const femaleWingBasis = {
  ...femaleWingGrundlagen,
  trainingStage: "BASISTRAINING",
  rangeStart: 5.1,
  rangeEnd: 5.2,
} as const;

describe("referenceRangeFor: matching", () => {
  it("picks the value matching gender, position and stage", () => {
    const test = generateSportTest([
      maleWingGrundlagen,
      femaleGoalkeeperGrundlagen,
      femaleWingBasis,
      femaleWingGrundlagen,
    ]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      trainingStage: "GRUNDLAGENTRAINING",
    });

    expect(range).toEqual(femaleWingGrundlagen);
  });

  it("returns null when the stage is null", () => {
    const test = generateSportTest([femaleWingGrundlagen]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      trainingStage: null,
    });

    expect(range).toBeNull();
  });

  it("returns null when the position is undefined", () => {
    const test = generateSportTest([femaleWingGrundlagen]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: undefined,
      trainingStage: "GRUNDLAGENTRAINING",
    });

    expect(range).toBeNull();
  });

  it("returns null when no value matches", () => {
    const test = generateSportTest([maleWingGrundlagen, femaleWingBasis]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      trainingStage: "GRUNDLAGENTRAINING",
    });

    expect(range).toBeNull();
  });

  it("returns null when the test has no reference values", () => {
    const test = generateSportTest([]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      trainingStage: "GRUNDLAGENTRAINING",
    });

    expect(range).toBeNull();
  });
});

describe("formatRangeNumber: language", () => {
  it("uses a decimal point for en", () => {
    expect(formatRangeNumber(1.25, "en")).toBe("1.25");
  });

  it("uses a decimal comma for de", () => {
    expect(formatRangeNumber(1.25, "de")).toBe("1,25");
  });

  it("rounds to at most two decimals", () => {
    expect(formatRangeNumber(1.234, "en")).toBe("1.23");
  });

  it("keeps a single decimal as is", () => {
    expect(formatRangeNumber(1.2, "en")).toBe("1.2");
  });

  it("shows a whole number without decimals", () => {
    expect(formatRangeNumber(3, "en")).toBe("3");
  });
});
