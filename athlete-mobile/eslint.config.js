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
]);
