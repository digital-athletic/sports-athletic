import { formatRangeNumber, referenceRangeFor } from "./referenceRange";
import { generateReferenceValue, generateSportTest } from "./testFixtures";

const femaleWingAged13To14 = generateReferenceValue();
const maleWingAged13To14 = generateReferenceValue({ gender: "MALE" });
const femaleGoalkeeperAged13To14 = generateReferenceValue({
  position: "GOALKEEPER",
});
const femaleWingAged15To16 = generateReferenceValue({
  minAge: 15,
  maxAge: 16,
});

describe("referenceRangeFor: matching", () => {
  it("picks the value matching gender, position and age", () => {
    const test = generateSportTest("FAKE_TEST", [
      maleWingAged13To14,
      femaleGoalkeeperAged13To14,
      femaleWingAged15To16,
      femaleWingAged13To14,
    ]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: 13,
    });

    expect(range).toEqual(femaleWingAged13To14);
  });

  it("picks the value by age when the stage label is the same", () => {
    const test = generateSportTest("FAKE_TEST", [
      femaleWingAged13To14,
      generateReferenceValue({ minAge: 15, maxAge: 16, rangeStart: 8.76 }),
    ]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: 15,
    });

    expect(range?.rangeStart).toBe(8.76);
  });

  it("matches the lower age bound", () => {
    const test = generateSportTest("FAKE_TEST", [femaleWingAged13To14]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: 13,
    });

    expect(range).toEqual(femaleWingAged13To14);
  });

  it("matches the upper age bound", () => {
    const test = generateSportTest("FAKE_TEST", [femaleWingAged13To14]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: 14,
    });

    expect(range).toEqual(femaleWingAged13To14);
  });

  it("returns null one year below the range", () => {
    const test = generateSportTest("FAKE_TEST", [femaleWingAged13To14]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: 12,
    });

    expect(range).toBeNull();
  });

  it("returns null one year above the range", () => {
    const test = generateSportTest("FAKE_TEST", [femaleWingAged13To14]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: 15,
    });

    expect(range).toBeNull();
  });

  it("returns null when the age is null", () => {
    const test = generateSportTest("FAKE_TEST", [femaleWingAged13To14]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: null,
    });

    expect(range).toBeNull();
  });

  it("returns null when the position is undefined", () => {
    const test = generateSportTest("FAKE_TEST", [femaleWingAged13To14]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: undefined,
      age: 13,
    });

    expect(range).toBeNull();
  });

  it("returns null when no value matches", () => {
    const test = generateSportTest("FAKE_TEST", [
      maleWingAged13To14,
      femaleWingAged15To16,
    ]);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: 13,
    });

    expect(range).toBeNull();
  });

  it("returns null when the test has no reference values", () => {
    const test = generateSportTest("FAKE_TEST", []);

    const range = referenceRangeFor(test, {
      gender: "FEMALE",
      position: "WING",
      age: 13,
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
