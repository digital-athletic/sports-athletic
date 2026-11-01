// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier/flat");

// Old generator code that the new workout generator must not import. The
// regexes anchor on the path segment, so they match the alias and every
// relative path, with or without a ".ts" or "/index" suffix. A mixed utils
// module allows only the listed exports, so a new export starts out banned.
const OLD_GENERATOR_PATH = "(^|/)generators(/|$)";
const BANNED_UTILS_MODULES = [
  "branchFilterUtils",
  "branchLevelUtils",
  "branchMaintenance",
  "duplicateExerciseUtils",
  "exerciseBlockUtils",
  "exerciseOrderUtils",
  "heartRateUtils",
  "maxStrengthAdjustment",
  "maxStrengthLadder",
  "substitutionLevelUtils",
  "supersetPairingUtils",
  "weightAdjustmentUtils",
  "trainingSectionUtils",
  "storedPlanCheck",
];
const ALLOWED_NAMES_BY_MIXED_UTILS_MODULE = {
  skillTreeUtils: [
    "readLiteralSkillTree",
    "mapSkillCodeToFocusArea",
    "isPreventionTraining",
    "getBranchIdByNameAndSkill",
    "getBranchIdsByNames",
  ],
  workoutUtils: [
    "getUserLevel",
    "STRENGTH_TEST_SKILL",
    "calculateWorkoutTotals",
    "maxWeightByEpley",
    "calculateAdjustedMaxValues",
    "applyMaxValueToDirections",
  ],
  equipmentUtils: [
    "hasWeights",
    "hasBarbell",
    "hasAnyBarbell",
    "hasRunEquipment",
  ],
  painUtils: [
    "PAIN_REGIONS",
    "PainRegion",
    "isPainRegion",
    "getBlocksFromPains",
    "getPreventionsFromPains",
    "isSamePainSet",
    "shouldShowPainAlert",
  ],
  exerciseDataUtils: [
    "isNoIncreaseSkill",
    "shouldProcessExerciseValues",
    "isFeedbackEligibleSkill",
    "shouldSkipExerciseSave",
    "deriveActiveExerciseIndex",
  ],
};
const matchOldUtilsPath = (moduleNames) =>
  `(^|/)utils/(${moduleNames.join("|")})(\\.ts|/index)?$`;
// require, jest.requireActual, import() and import("...") types load a whole
// module, so these ban the mixed utils modules as a whole too.
const OLD_MODULE_PATH = `(${OLD_GENERATOR_PATH})|(${matchOldUtilsPath([
  ...BANNED_UTILS_MODULES,
  ...Object.keys(ALLOWED_NAMES_BY_MIXED_UTILS_MODULE),
])})`;
const PATH_FIELD_BY_IMPORT_SYNTAX = {
  "CallExpression[callee.name='require']": "arguments.0.value",
  "CallExpression[callee.object.name='jest'][callee.property.name='requireActual']":
    "arguments.0.value",
  ImportExpression: "source.value",
  TSImportType: "argument.literal.value",
};
const OLD_GENERATOR_MESSAGE =
  "The new generator imports nothing of the old one.";
const OLD_UTILS_MESSAGE =
  "Old generator logic: rewrite it in the new generator instead.";
const OLD_MODULE_MESSAGE =
  "The new generator loads no module of the old generator or its utils.";

// New generator code. ESLint matches import regexes case-insensitively by
// default, which would ban the old "generators/PlanGenerator" module too, so
// these patterns set caseSensitive.
const PLAN_GENERATOR_PATH = "(^|/)planGenerator(/|$)";
const WORKOUT_GENERATOR_PATH = "(^|/)workoutGenerator(/|$)";
const ROUTER_PATH = "(^|/)(workout|plan)GeneratorRouter(\\.ts|/index)?$";
const NEW_CODE_PATH = `(${PLAN_GENERATOR_PATH})|(${WORKOUT_GENERATOR_PATH})|(${ROUTER_PATH})`;
const PLAN_GENERATOR_MESSAGE =
  "The workout generator imports nothing of the plan generator.";
const NEW_CODE_MESSAGE =
  "The old generator imports no new generator and no router.";

const OLD_GENERATOR_IMPORT_PATTERNS = [
  { regex: OLD_GENERATOR_PATH, message: OLD_GENERATOR_MESSAGE },
  {
    regex: matchOldUtilsPath(BANNED_UTILS_MODULES),
    message: OLD_UTILS_MESSAGE,
  },
  ...Object.entries(ALLOWED_NAMES_BY_MIXED_UTILS_MODULE).map(
    ([moduleName, allowImportNames]) => ({
      regex: matchOldUtilsPath([moduleName]),
      allowImportNames,
      message: OLD_UTILS_MESSAGE,
    }),
  ),
];

// Bans the paths for require, jest.requireActual, import() and import types.
const restrictModuleLoads = (pathRegex, message) =>
  Object.entries(PATH_FIELD_BY_IMPORT_SYNTAX).map(([syntax, pathField]) => ({
    selector: `${syntax}[${pathField}=/${pathRegex.replaceAll("/", "\\/")}/]`,
    message,
  }));

// A new generator imports no code of the old generator, plus the given paths.
const createNewGeneratorBlock = (folder, extraPatterns, extraLoads) => ({
  files: [`src/features/training/${folder}/**`],
  rules: {
    "@typescript-eslint/no-require-imports": "error",
    "no-restricted-imports": [
      "error",
      { patterns: [...OLD_GENERATOR_IMPORT_PATTERNS, ...extraPatterns] },
    ],
    "no-restricted-syntax": [
      "error",
      ...restrictModuleLoads(OLD_MODULE_PATH, OLD_MODULE_MESSAGE),
      ...extraLoads,
    ],
  },
});

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: [
      "dist/*",
      "flow/*",
      "legacy/*",
      "trainer-dashboard/*",
      "supabase/*",
      "test/fixtures/personas/*",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      // The React Compiler silently skips code these rules flag, leaving it unmemoized.
      "react-hooks/todo": "error",
      "react-hooks/unsupported-syntax": "error",
    },
  },
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  // Complexity budget. Violations that predate this config are recorded in
  // eslint-suppressions.json, so these thresholds only bind new and changed code.
  {
    settings: {
      // eslint-config-expo only registers the node resolver, which cannot resolve the
      // "@/*" tsconfig paths. Without this, import/no-cycle silently reports nothing.
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      complexity: ["error", { max: 10 }],
      "max-depth": ["error", 4],
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "error",
        { max: 50, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      "max-nested-callbacks": ["error", 3],
      "max-params": ["error", 4],
      "import/no-cycle": [
        "error",
        { maxDepth: Infinity, ignoreExternal: true },
      ],
    },
  },
  // The new workout and plan generators are full rewrites and import no code
  // of the old generator. The workout generator imports nothing of the plan
  // generator either. See the constants above the config for the banned paths.
  createNewGeneratorBlock(
    "workoutGenerator",
    [
      {
        regex: PLAN_GENERATOR_PATH,
        caseSensitive: true,
        message: PLAN_GENERATOR_MESSAGE,
      },
    ],
    restrictModuleLoads(PLAN_GENERATOR_PATH, PLAN_GENERATOR_MESSAGE),
  ),
  createNewGeneratorBlock("planGenerator", [], []),
  // The old generator stays as it is until its deletion and never depends on
  // new code. This block adds import rules only.
  {
    files: ["src/features/training/generators/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: NEW_CODE_PATH,
              caseSensitive: true,
              message: NEW_CODE_MESSAGE,
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...restrictModuleLoads(NEW_CODE_PATH, NEW_CODE_MESSAGE),
      ],
    },
  },
  // Screen and component bodies carry a JSX tree, which inflates line count without
  // adding branching. Logic still belongs in hooks, so only the line budget is raised.
  {
    files: ["app/**/*.tsx", "src/**/*.tsx"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 65, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
    },
  },
  // describe/it nesting makes the size and nesting budgets meaningless in specs.
  {
    files: ["**/*.spec.{ts,tsx}", "test/**", "e2e/**", "playwright/**"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "max-nested-callbacks": "off",
    },
  },
]);
