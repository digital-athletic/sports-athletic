/**
 * Jest setup file
 * This file runs before each test suite
 */

// Set up environment variables for tests
process.env.EXPO_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// Clear dev-only feature flags so tests don't inherit shell environment
delete process.env.EXPO_PUBLIC_SERVER_SYNC_ENABLED;
delete process.env.EXPO_PUBLIC_REVIEW_EMAIL;
delete process.env.EXPO_PUBLIC_REVIEW_OTP;

// Mock AsyncStorage for testing
jest.mock("@react-native-async-storage/async-storage", () =>
  // CommonJS require is needed for Jest mocks
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock @expo/vector-icons to avoid async state updates in tests
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");
jest.mock("@expo/vector-icons/FontAwesome", () => "FontAwesome");
