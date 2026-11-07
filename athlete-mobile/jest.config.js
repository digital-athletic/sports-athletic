const { resolveBabelOptions } = require("jest-expo/src/resolveBabelOptions");

const babelOptions = resolveBabelOptions(__dirname);

module.exports = {
  preset: "jest-expo",
  transform: {
    // babel-preset-expo enables the React Compiler only when caller.supportsReactCompiler
    // is set. Metro sets it, babel-jest does not.
    "\\.[jt]sx?$": [
      "babel-jest",
      {
        ...babelOptions,
        caller: { ...babelOptions.caller, supportsReactCompiler: true },
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|zustand|immer))",
  ],
  rootDir: ".",
  roots: ["<rootDir>/src", "<rootDir>/app"],
  setupFiles: ["<rootDir>/test/jestSetup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@test/(.*)$": "<rootDir>/test/$1",
    "@react-native-community/netinfo": "<rootDir>/test/netinfoMock",
  },
};
