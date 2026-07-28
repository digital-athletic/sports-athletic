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
      "assets/data/personas/*",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-require-imports": "off",
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
