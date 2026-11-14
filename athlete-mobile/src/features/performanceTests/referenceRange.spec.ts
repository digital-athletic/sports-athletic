import {
  type AthleteProfile,
  formatRangeNumber,
  referenceRangeFor,
  referenceRangeOnDate,
} from "./referenceRange";
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

/**
 * A female handball wing player born on 2012-06-15, so she turns 15 on 2027-06-15, e.g.
 * generateAthleteProfile({ position: undefined }) returns
 * { sport: "SPORT_HANDBALL", gender: "FEMALE", position: undefined, birthday: "2012-06-15" }
 */
const generateAthleteProfile = (
  overrides: Partial<AthleteProfile> = {},
): AthleteProfile => ({
  sport: "SPORT_HANDBALL",
  gender: "FEMALE",
  position: "WING",
  birthday: "2012-06-15",
  ...overrides,
});

describe("referenceRangeOnDate: stage on the date", () => {
  const grundlagen = generateReferenceValue({ rangeStart: 9.87 });
  const aufbau = generateReferenceValue({
    trainingStage: "AUFBAUTRAINING_1",
    rangeStart: 9.12,
  });

  it("picks the range of Grundlagentraining the day before the 15th birthday", () => {
    const test = generateSportTest("FAKE_TEST", [aufbau, grundlagen]);

    const range = referenceRangeOnDate(
      test,
      generateAthleteProfile(),
      "2027-06-14",
    );

    expect(range).toEqual(grundlagen);
  });

  it("picks the range of Aufbautraining 1 on the 15th birthday", () => {
    const test = generateSportTest("FAKE_TEST", [grundlagen, aufbau]);

    const range = referenceRangeOnDate(
      test,
      generateAthleteProfile(),
      "2027-06-15",
    );

    expect(range).toEqual(aufbau);
  });

  it("returns null when the athlete was in no stage on the date", () => {
    const test = generateSportTest("FAKE_TEST", [grundlagen, aufbau]);

    const range = referenceRangeOnDate(
      test,
      generateAthleteProfile(),
      "2015-01-01",
    );

    expect(range).toBeNull();
  });

  it("returns null when the athlete has no position", () => {
    const test = generateSportTest("FAKE_TEST", [grundlagen]);

    const range = referenceRangeOnDate(
      test,
      generateAthleteProfile({ position: undefined }),
      "2027-06-14",
    );

    expect(range).toBeNull();
  });
});
