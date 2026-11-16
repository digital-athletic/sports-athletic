import de from "./de.json";
import en from "./en.json";

const TRAINING_STAGE_KEYS = [
  "FOUNDATION_TRAINING",
  "BUILD_UP_TRAINING_1",
  "BUILD_UP_TRAINING_2",
  "TRANSITION_TRAINING",
];

/** The keys under performanceTests.trainingStages of a language file, empty when the group is missing. */
const trainingStageKeys = (locale: {
  performanceTests: Record<string, unknown>;
}): string[] => {
  const stages = locale.performanceTests.trainingStages;
  return typeof stages === "object" && stages !== null
    ? Object.keys(stages).sort()
    : [];
};

describe("performanceTests language files: test names come from the database", () => {
  it("holds no performanceTests.tests in en", () => {
    expect(en.performanceTests).not.toHaveProperty("tests");
  });

  it("holds no performanceTests.tests in de", () => {
    expect(de.performanceTests).not.toHaveProperty("tests");
  });
});

describe("performanceTests language files: training stages", () => {
  it("holds the four training stage keys in en", () => {
    expect(trainingStageKeys(en)).toEqual([...TRAINING_STAGE_KEYS].sort());
  });

  it("holds the four training stage keys in de", () => {
    expect(trainingStageKeys(de)).toEqual([...TRAINING_STAGE_KEYS].sort());
  });
});
