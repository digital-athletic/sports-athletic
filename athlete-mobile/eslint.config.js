// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier/flat");

const ALERT_IMPORT_BAN = {
  name: "react-native",
  importNames: ["Alert"],
  message:
    "Import Alert from @/common/Alert. The react-native Alert shows nothing on web.",
};

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
  "Old generator logic: rewrite it in workoutGenerator/ instead.";
const OLD_MODULE_MESSAGE =
  "The new generator loads no module of the old generator or its utils.";

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
      "no-restricted-imports": ["error", { paths: [ALERT_IMPORT_BAN] }],
      // The React Compiler silently skips code these rules flag, leaving it unmemoized.
      "react-hooks/todo": "error",
      "react-hooks/unsupported-syntax": "error",
    },
  },
  {
    files: ["src/common/Alert.tsx"],
    rules: {
      "no-restricted-imports": "off",
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
  // The new workout generator is a full rewrite and imports no code of the old
  // generator. See the constants above the config for the banned paths.
  {
    files: ["src/features/training/workoutGenerator/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "error",
      "no-restricted-imports": [
        "error",
        {
          // This rule replaces the global no-restricted-imports rule for these
          // files. A global ban that should also apply here, like
          // ALERT_IMPORT_BAN, must be listed again below.
          paths: [ALERT_IMPORT_BAN],
          patterns: [
            {
              regex: OLD_GENERATOR_PATH,
              message: OLD_GENERATOR_MESSAGE,
            },
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
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...Object.entries(PATH_FIELD_BY_IMPORT_SYNTAX).map(
          ([syntax, pathField]) => ({
            selector: `${syntax}[${pathField}=/${OLD_MODULE_PATH.replaceAll("/", "\\/")}/]`,
            message: OLD_MODULE_MESSAGE,
          }),
        ),
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
