/**
 * Jest setup file
 * This file runs before each test suite
 */

// Mock AsyncStorage for testing
jest.mock("@react-native-async-storage/async-storage", () =>
  // CommonJS require is needed for Jest mocks
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock @expo/vector-icons to avoid async state updates in tests
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");
jest.mock("@expo/vector-icons/FontAwesome", () => "FontAwesome");
