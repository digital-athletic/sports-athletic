import { loadSkillCatalog } from "@/data/loadSkillCatalog";
import { findCatalogExerciseById } from "@test/factories/valueExercise";
import { readSkillIntensity } from "./skillIntensity";
import {
  readExerciseStartValue,
  readExerciseTargetValue,
} from "./startAndTargetValues";

const LANDING_START_REPETITION = 4;
const LANDING_TARGET_REPETITION = 6;

describe("preventionIntensity: landing exercise of a PREVKNEE block", () => {
  const landing = findCatalogExerciseById("1107");
  const intensity = readSkillIntensity(loadSkillCatalog(), "PREVKNEE", landing);
  const beginnerMan = { gender: "m", level: "beginner" } as const;

  it("reads the exercise start value that a weight step resets to", () => {
    expect(
      readExerciseStartValue(intensity, landing, "repetition", beginnerMan),
    ).toBe(LANDING_START_REPETITION);
  });

  it("progresses toward the exercise target", () => {
    expect(
      readExerciseTargetValue(intensity, landing, "repetition", beginnerMan),
    ).toBe(LANDING_TARGET_REPETITION);
  });
});
