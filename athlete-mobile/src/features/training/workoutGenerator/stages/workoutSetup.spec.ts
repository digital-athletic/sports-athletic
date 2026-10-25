import { generateRuleFamilyInput } from "@test/factories/ruleFamilyInput";
import { generateKneeSkillTrees } from "@test/factories/skillTree";
import {
  generatePicksBlock,
  generateShortTemplate,
} from "@test/factories/templateBlock";
import { setUpWorkout } from "./workoutSetup";

describe("workoutSetup: setUpWorkout", () => {
  it("derives the athlete level, pain regions, prevention skills and weights", () => {
    const input = generateRuleFamilyInput({
      level: "PROFESSIONAL",
      pains: ["KNEE_LEFT", "HIP_RIGHT"],
      equipment: ["DUMBBELL"],
    });

    const workoutInput = setUpWorkout(input);

    expect(workoutInput.athleteLevel).toBe("PROFESSIONAL");
    expect(workoutInput.blockedRegions).toEqual(["KNEE", "HIP"]);
    expect(workoutInput.preventionSkills).toEqual(["PREVKNEE"]);
    expect(workoutInput.hasWeights).toBe(true);
  });

  it("derives no pain regions and no weights for an athlete without pain at a place without weights", () => {
    const workoutInput = setUpWorkout(generateRuleFamilyInput());

    expect(workoutInput.athleteLevel).toBe("ADVANCED");
    expect(workoutInput.blockedRegions).toEqual([]);
    expect(workoutInput.preventionSkills).toEqual([]);
    expect(workoutInput.hasWeights).toBe(false);
  });

  it("falls back to BEGINNER and no pain for an athlete without workout data", () => {
    const workoutInput = setUpWorkout(
      generateRuleFamilyInput({
        withoutPersonalData: true,
        withoutWorkoutData: true,
      }),
    );

    expect(workoutInput.athleteLevel).toBe("BEGINNER");
    expect(workoutInput.blockedRegions).toEqual([]);
    expect(workoutInput.preventionSkills).toEqual([]);
  });

  it("keeps the generation input and returns a new frozen object", () => {
    const input = generateRuleFamilyInput({ pains: ["SHOULDER_LEFT"] });

    const workoutInput = setUpWorkout(input);

    expect(workoutInput).not.toBe(input);
    expect(workoutInput.athlete).toBe(input.athlete);
    expect(workoutInput.equipment).toBe(input.equipment);
    expect(workoutInput.random).toBe(input.random);
    expect(input).not.toHaveProperty("blockedRegions");
    expect(Object.isFrozen(workoutInput)).toBe(true);
    expect(Object.isFrozen(workoutInput.blockedRegions)).toBe(true);
    expect(Object.isFrozen(workoutInput.preventionSkills)).toBe(true);
  });

  it("leaves the muscle soreness check to the rule family, so two sore areas do not throw", () => {
    const input = generateRuleFamilyInput({
      soreMuscles: ["CHEST", "QUADRICEPS"],
    });

    expect(() => setUpWorkout(input)).not.toThrow();
  });

  it("applies the picks workout rules of the template before any block runs", () => {
    const template = generateShortTemplate([generatePicksBlock("BAS")]);
    const input = generateRuleFamilyInput({ pains: ["KNEE_LEFT"] });

    expect(() =>
      setUpWorkout(input, template, generateKneeSkillTrees()),
    ).toThrow(
      expect.objectContaining({
        type: "NO_EXERCISES",
        subtype: "PAIN",
        params: ["KNEE"],
      }),
    );
  });

  it("holds an empty picks workout without a template", () => {
    const { picksWorkout } = setUpWorkout(generateRuleFamilyInput());

    expect(picksWorkout.pool).toEqual({});
    expect(picksWorkout.blocks.size).toBe(0);
  });

  it("gives each setup its own picks workout maps", () => {
    const input = generateRuleFamilyInput();

    expect(setUpWorkout(input).picksWorkout.blocks).not.toBe(
      setUpWorkout(input).picksWorkout.blocks,
    );
  });
});
