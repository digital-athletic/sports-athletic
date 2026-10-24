// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier/flat");

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
  // The new workout generator is a full rewrite and imports no code of the old
  // generator. The regexes match the alias path and relative paths from the
  // folder and from one subfolder below it. A mixed module allows only the
  // listed exports, so a new export starts out banned.
  {
    files: ["src/features/training/workoutGenerator/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(@/features/training/|(\\.\\./){1,2})generators(/|$)",
              message: "The new generator imports nothing of the old one.",
            },
            {
              regex:
                "^(@/features/training/|(\\.\\./){1,2})utils/(branchFilterUtils|branchLevelUtils|branchMaintenance|duplicateExerciseUtils|exerciseBlockUtils|exerciseOrderUtils|heartRateUtils|maxStrengthAdjustment|maxStrengthLadder|substitutionLevelUtils|supersetPairingUtils|weightAdjustmentUtils|trainingSectionUtils|storedPlanCheck)$",
              message:
                "Old generator logic: rewrite it in workoutGenerator/ instead.",
            },
            {
              regex:
                "^(@/features/training/|(\\.\\./){1,2})utils/skillTreeUtils$",
              allowImportNames: [
                "readLiteralSkillTree",
                "mapSkillCodeToFocusArea",
                "isPreventionTraining",
                "getBranchIdByNameAndSkill",
                "getBranchIdsByNames",
              ],
              message:
                "Old generator logic: rewrite it in workoutGenerator/ instead.",
            },
            {
              regex:
                "^(@/features/training/|(\\.\\./){1,2})utils/workoutUtils$",
              allowImportNames: [
                "getUserLevel",
                "STRENGTH_TEST_SKILL",
                "calculateWorkoutTotals",
                "maxWeightByEpley",
                "calculateAdjustedMaxValues",
                "applyMaxValueToDirections",
              ],
              message:
                "Old generator logic: rewrite it in workoutGenerator/ instead.",
            },
            {
              regex:
                "^(@/features/training/|(\\.\\./){1,2})utils/equipmentUtils$",
              allowImportNames: [
                "hasWeights",
                "hasBarbell",
                "hasAnyBarbell",
                "hasRunEquipment",
              ],
              message:
                "Old generator logic: rewrite it in workoutGenerator/ instead.",
            },
            {
              regex: "^(@/features/training/|(\\.\\./){1,2})utils/painUtils$",
              allowImportNames: [
                "PAIN_REGIONS",
                "PainRegion",
                "isPainRegion",
                "getBlocksFromPains",
                "getPreventionsFromPains",
                "isSamePainSet",
                "shouldShowPainAlert",
              ],
              message:
                "Old generator logic: rewrite it in workoutGenerator/ instead.",
            },
            {
              regex:
                "^(@/features/training/|(\\.\\./){1,2})utils/exerciseDataUtils$",
              allowImportNames: [
                "isNoIncreaseSkill",
                "shouldProcessExerciseValues",
                "isFeedbackEligibleSkill",
                "shouldSkipExerciseSave",
                "deriveActiveExerciseIndex",
              ],
              message:
                "Old generator logic: rewrite it in workoutGenerator/ instead.",
            },
          ],
        },
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
