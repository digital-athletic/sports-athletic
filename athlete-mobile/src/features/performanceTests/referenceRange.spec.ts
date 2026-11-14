import { formatRangeNumber, referenceRangeFor } from "./referenceRange";
import { generateReferenceValue, generateSportTest } from "./testFixtures";

const femaleWingGrundlagen = generateReferenceValue();
const maleWingGrundlagen = generateReferenceValue({ gender: "MALE" });
const femaleGoalkeeperGrundlagen = generateReferenceValue({
  position: "GOALKEEPER",
});
const femaleWingBasis = generateReferenceValue({
  trainingStage: "BASISTRAINING",
});

describe("referenceRangeFor: matching", () => {
  it("picks the value matching gender, position and stage", () => {
    const test = generateSportTest("FAKE_TEST", [
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
    const test = generateSportTest("FAKE_TEST", [femaleWingGrundlagen]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      trainingStage: null,
    });

    expect(range).toBeNull();
  });

  it("returns null when the position is undefined", () => {
    const test = generateSportTest("FAKE_TEST", [femaleWingGrundlagen]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: undefined,
      trainingStage: "GRUNDLAGENTRAINING",
    });

    expect(range).toBeNull();
  });

  it("returns null when no value matches", () => {
    const test = generateSportTest("FAKE_TEST", [
      maleWingGrundlagen,
      femaleWingBasis,
    ]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      trainingStage: "GRUNDLAGENTRAINING",
    });

    expect(range).toBeNull();
  });

  it("returns null when the test has no reference values", () => {
    const test = generateSportTest("FAKE_TEST", []);

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
    expect(formatRangeNumber(9.87, "en")).toBe("9.87");
  });

  it("uses a decimal comma for de", () => {
    expect(formatRangeNumber(9.87, "de")).toBe("9,87");
  });

  it("rounds to at most two decimals", () => {
    expect(formatRangeNumber(1.234, "en")).toBe("1.23");
  });

  it("shows one decimal for a value with one decimal", () => {
    expect(formatRangeNumber(1.2, "en")).toBe("1.2");
  });

  it("shows a whole number without decimals", () => {
    expect(formatRangeNumber(3, "en")).toBe("3");
  });
});
