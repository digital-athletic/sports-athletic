const path = require("node:path");
const { Linter, RuleTester } = require("eslint");
const projectConfig = require("../eslint.config.js");
const commentSystem = require("./commentSystem");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const RULE_ID = "local/comment-system";
const { parser } = projectConfig.find(
  (config) => config.languageOptions?.parser,
).languageOptions;

const ruleTester = new RuleTester({ languageOptions: { parser } });
const jsxOptions = {
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
};

ruleTester.run("comment-system", commentSystem, {
  valid: [
    "export const days = 3;",
    "const days = 3;",
    "/** Training days per week. */\nexport const days = 3;",
    "/** The old code counts rest days too. */\nconst days = 3;",
    "export interface Plan {\n  /** Training days per week. */\n  readonly days: number;\n}",
    "interface Plan {\n  readonly days: number; // per week\n}",
    "// Section banner.\n\nconst days = 3;",
    "const days = 3; // per week",
    "const count = () => {\n  // Rest days never count.\n  return 3;\n};",
    "function count() {\n  type Day = {\n    // Rest days never count.\n    rest: boolean;\n  };\n  return 3;\n}",
    { code: "const View = () => <div>{/* empty */}</div>;", ...jsxOptions },
  ],
  invalid: [
    {
      code: "// Training days per week.\nexport const days = 3;",
      output: "/** Training days per week. */\nexport const days = 3;",
      errors: [{ messageId: "declarationNeedsDoc" }],
    },
    {
      code: "// The old code counts rest days too.\nconst days = 3;",
      output: "/** The old code counts rest days too. */\nconst days = 3;",
      errors: [{ messageId: "declarationNeedsDoc" }],
    },
    {
      code: "// Steps:\n//   1. warm up\nconst days = 3;",
      output: "/**\n * Steps:\n *   1. warm up\n */\nconst days = 3;",
      errors: [{ messageId: "declarationNeedsDoc" }],
    },
    {
      code: "/* Training days per week. */\nexport const days = 3;",
      output: "/** Training days per week. */\nexport const days = 3;",
      errors: [{ messageId: "declarationNeedsDoc" }],
    },
    {
      code: "/** Training days per week. */\n// generators/PlanGenerator.ts, PlanGenerator.getDays\nconst days = 3;",
      output:
        "/**\n * Training days per week.\n * generators/PlanGenerator.ts, PlanGenerator.getDays\n */\nconst days = 3;",
      errors: [{ messageId: "declarationNeedsDoc" }],
    },
    {
      code: "// Closes */ early.\nconst days = 3;",
      output: null,
      errors: [{ messageId: "declarationNeedsDoc" }],
    },
    {
      code: "interface Plan {\n  // Training days per week.\n  readonly days: number;\n}",
      output:
        "interface Plan {\n  /** Training days per week. */\n  readonly days: number;\n}",
      errors: [{ messageId: "declarationNeedsDoc" }],
    },
    {
      code: "function count() {\n  /** Rest days never count. */\n  const rest = 0;\n  return rest;\n}",
      output:
        "function count() {\n  // Rest days never count.\n  const rest = 0;\n  return rest;\n}",
      errors: [{ messageId: "docInFunctionBody" }],
    },
    {
      code: "const count = () => {\n  /**\n   * Steps:\n   *   1. warm up\n   */\n  return 3;\n};",
      output:
        "const count = () => {\n  // Steps:\n  //   1. warm up\n  return 3;\n};",
      errors: [{ messageId: "docInFunctionBody" }],
    },
    {
      code: "const count = () => {\n  /*\n    Steps:\n      1. warm up\n  */\n  return 3;\n};",
      output:
        "const count = () => {\n  // Steps:\n  //   1. warm up\n  return 3;\n};",
      errors: [{ messageId: "blockOutsideJsx" }],
    },
    {
      code: "/* Section banner. */\n\nconst days = 3;",
      output: "// Section banner.\n\nconst days = 3;",
      errors: [{ messageId: "blockOutsideJsx" }],
    },
    {
      code: "const days = Math.max(/* rest */ 3, 1);",
      output: null,
      errors: [{ messageId: "blockOutsideJsx" }],
    },
  ],
});

const lintCommentSystem = (relativePath) =>
  new Linter({ cwd: PROJECT_ROOT })
    .verify(
      "// Training days per week.\nexport const days = 3;\n",
      projectConfig,
      path.join(PROJECT_ROOT, relativePath),
    )
    .filter((message) => message.ruleId === RULE_ID);

describe("comment-system scope", () => {
  it("checks the plan generator", () => {
    expect(
      lintCommentSystem("src/features/training/planGenerator/stages/days.ts"),
    ).toHaveLength(1);
  });

  it.each([
    "src/features/training/generators/days.ts",
    "src/features/training/workoutGenerator/days.ts",
    "src/utils/days.ts",
  ])("reports nothing for %s", (relativePath) => {
    expect(lintCommentSystem(relativePath)).toEqual([]);
  });
});
