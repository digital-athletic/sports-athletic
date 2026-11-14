import { trainingStageFor } from "./trainingStage";

describe("trainingStageFor: handball bands", () => {
  // [stage, lowest age, highest age] e.g. ["BASISTRAINING", 11, 12]
  const femaleBands = [
    ["BASISTRAINING", 11, 12],
    ["GRUNDLAGENTRAINING", 13, 14],
    ["AUFBAUTRAINING_1", 15, 16],
    ["AUFBAUTRAINING_2", 17, 18],
    ["ANSCHLUSSTRAINING", 19, 20],
  ] as const;
  const maleBands = [
    ["BASISTRAINING", 12, 13],
    ["GRUNDLAGENTRAINING", 14, 15],
    ["AUFBAUTRAINING_1", 16, 17],
    ["AUFBAUTRAINING_2", 18, 19],
    ["ANSCHLUSSTRAINING", 20, 21],
  ] as const;

  it.each(femaleBands)(
    "returns %s for a female athlete aged %i to %i",
    (stage, lowest, highest) => {
      expect(trainingStageFor("SPORT_HANDBALL", "FEMALE", lowest)).toBe(stage);
      expect(trainingStageFor("SPORT_HANDBALL", "FEMALE", highest)).toBe(stage);
    },
  );

  it.each(maleBands)(
    "returns %s for a male athlete aged %i to %i",
    (stage, lowest, highest) => {
      expect(trainingStageFor("SPORT_HANDBALL", "MALE", lowest)).toBe(stage);
      expect(trainingStageFor("SPORT_HANDBALL", "MALE", highest)).toBe(stage);
    },
  );
});

describe("trainingStageFor: no stage", () => {
  it("returns null for a female athlete below the first band", () => {
    expect(trainingStageFor("SPORT_HANDBALL", "FEMALE", 10)).toBeNull();
  });

  it("returns null for a female athlete above the last band", () => {
    expect(trainingStageFor("SPORT_HANDBALL", "FEMALE", 21)).toBeNull();
  });

  it("returns null for a male athlete below the first band", () => {
    expect(trainingStageFor("SPORT_HANDBALL", "MALE", 11)).toBeNull();
  });

  it("returns null for a male athlete above the last band", () => {
    expect(trainingStageFor("SPORT_HANDBALL", "MALE", 22)).toBeNull();
  });

  it("returns null when the age is unknown", () => {
    expect(trainingStageFor("SPORT_HANDBALL", "FEMALE", null)).toBeNull();
  });

  it("returns null for a sport other than handball", () => {
    expect(trainingStageFor("SPORT_FOOTBALL", "FEMALE", 14)).toBeNull();
  });
});
