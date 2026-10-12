import type { TFunction } from "i18next";
import { buildGeneratorErrorMessage } from "./generatorErrorUtils";

const t = ((key: string, options?: Record<string, string>) =>
  options ? `${key}(${Object.values(options).join()})` : key) as TFunction;

describe("buildGeneratorErrorMessage: empty pool", () => {
  it("omits the params line when the error carries no params", () => {
    const message = buildGeneratorErrorMessage(
      { type: "NO_EXERCISES", subtype: "AGE", params: [] },
      t,
    );
    expect(message).toBe(
      "training.generator.errorTitleNoExercisesSubtypeX(training.generator.errorSubtype.AGE)",
    );
  });

  it("keeps the params line when the error carries params", () => {
    const message = buildGeneratorErrorMessage(
      { type: "NO_EXERCISES", subtype: "PAIN", params: ["KNEE"] },
      t,
    );
    expect(message).toContain(
      "training.generator.errorTitleNoExercisesParamsX(KNEE)",
    );
  });
});
