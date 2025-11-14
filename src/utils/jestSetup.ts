/**
 * Jest setup file
 * This file runs before each test suite
 */

// Mock AsyncStorage for testing
jest.mock("@react-native-async-storage/async-storage", () =>
  // CommonJS require is needed for Jest mocks
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
