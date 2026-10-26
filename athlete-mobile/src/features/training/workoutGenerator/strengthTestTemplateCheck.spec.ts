import { loadStrengthTest } from "@/data/loadStrengthTest";
import { loadStrengthTestTemplate } from "@/data/loadStrengthTestTemplate";
import { generateExercisesBlock } from "@test/factories/exercisesBlock";
import { generateStrengthTestTemplate } from "@test/factories/strengthTestTemplate";
import { generateStrengthTestWarmUpBlock } from "@test/factories/strengthTestWarmUp";
import {
  generateBundledTestSets,
  generateTestSetLoads,
} from "@test/factories/testSets";
import { checkStrengthTestTemplate } from "./strengthTestTemplateCheck";

describe("strengthTestTemplateCheck: checkStrengthTestTemplate", () => {
  it("accepts the bundled strength test template with the bundled strength test", () => {
    expect(() =>
      checkStrengthTestTemplate(loadStrengthTestTemplate(), loadStrengthTest()),
    ).not.toThrow();
  });

  describe("block layout", () => {
    it("throws for a template with a warm up only", () => {
      const template = generateStrengthTestTemplate({
        blocks: [generateStrengthTestWarmUpBlock()],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow(
        "TEST.blocks[1]: the strength test needs an exercises block of lifts after the warm-up",
      );
    });

    it("throws for a warm up picks block of another skill than WU", () => {
      const template = generateStrengthTestTemplate({
        blocks: [
          generateStrengthTestWarmUpBlock({ skill: "MOB" }),
          generateExercisesBlock(["25"], "TEST", {
            testSets: generateBundledTestSets(),
          }),
        ],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow(
        "TEST.blocks[0]: the strength test starts with a warm-up picks block of skill WU",
      );
    });

    it("throws for a template with lifts only", () => {
      const template = generateStrengthTestTemplate({
        blocks: [
          generateExercisesBlock(["25"], "TEST", {
            testSets: generateBundledTestSets(),
          }),
        ],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow(
        "TEST.blocks[0]: the strength test starts with a warm-up picks block",
      );
    });

    it("throws for a template with the lifts before the warm up", () => {
      const template = generateStrengthTestTemplate({
        blocks: [
          generateExercisesBlock(["25"], "TEST", {
            testSets: generateBundledTestSets(),
          }),
          generateStrengthTestWarmUpBlock(),
        ],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow(
        "TEST.blocks[0]: the strength test starts with a warm-up picks block",
      );
    });

    it("throws for a template with a third block", () => {
      const template = generateStrengthTestTemplate({
        blocks: [
          generateStrengthTestWarmUpBlock(),
          generateExercisesBlock(["25"], "TEST", {
            testSets: generateBundledTestSets(),
          }),
          generateExercisesBlock(["54"], "TEST", {
            testSets: generateBundledTestSets(),
          }),
        ],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow("TEST.blocks[2]: the strength test ends with its lifts block");
    });
  });

  describe("test sets", () => {
    it("throws for a lifts block without testSets", () => {
      const template = generateStrengthTestTemplate({
        blocks: [
          generateStrengthTestWarmUpBlock(),
          generateExercisesBlock(["25"], "TEST"),
        ],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow("TEST.blocks[1].testSets: the strength test needs testSets");
    });

    it("throws for test sets without an amrap set", () => {
      const template = generateStrengthTestTemplate({
        exercises: ["25"],
        testSets: [
          { share: 0.5, repetitions: 8, rest: 45 },
          { share: 1, repetitions: 3, rest: 90 },
        ],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow(
        "TEST.blocks[1].testSets: the strength test ends on its one amrap test set",
      );
    });

    it("throws for an empty list of test sets", () => {
      const template = generateStrengthTestTemplate({
        exercises: ["25"],
        testSets: [],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow(
        "TEST.blocks[1].testSets: the strength test ends on its one amrap test set",
      );
    });

    it("throws for test sets with two amrap sets", () => {
      const template = generateStrengthTestTemplate({
        exercises: ["25"],
        testSets: [
          { share: 0.5, repetitions: "amrap", rest: 45 },
          { share: 1, repetitions: "amrap", rest: 90 },
        ],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow(
        "TEST.blocks[1].testSets: the strength test ends on its one amrap test set",
      );
    });

    it("throws for an amrap set that is not the last test set", () => {
      const template = generateStrengthTestTemplate({
        exercises: ["25"],
        testSets: [
          { share: 0.5, repetitions: "amrap", rest: 45 },
          { share: 1, repetitions: 3, rest: 90 },
        ],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads(),
        }),
      ).toThrow(
        "TEST.blocks[1].testSets: the strength test ends on its one amrap test set",
      );
    });
  });

  describe("test set loads", () => {
    it("throws for a lift without any loads", () => {
      const template = generateStrengthTestTemplate({
        exercises: ["25", "54"],
      });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: { "25": generateTestSetLoads()["25"] },
        }),
      ).toThrow(
        "TEST.blocks[1].exercises: lift 54 has no test set loads for both genders",
      );
    });

    it("throws for a lift with loads for men only", () => {
      const template = generateStrengthTestTemplate({ exercises: ["25"] });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads({
            "25": { m: generateTestSetLoads()["25"].m },
          }),
        }),
      ).toThrow(
        "TEST.blocks[1].exercises: lift 25 has no test set loads for both genders",
      );
    });

    it("throws for a lift with loads for women only", () => {
      const template = generateStrengthTestTemplate({ exercises: ["25"] });

      expect(() =>
        checkStrengthTestTemplate(template, {
          testSetLoads: generateTestSetLoads({
            "25": { w: generateTestSetLoads()["25"].w },
          }),
        }),
      ).toThrow(
        "TEST.blocks[1].exercises: lift 25 has no test set loads for both genders",
      );
    });
  });
});
