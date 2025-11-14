import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PersistStorage } from "zustand/middleware";

/**
 * Storage adapter for Zustand persistence using AsyncStorage
 * This ensures compatibility with React Native's async storage
 */
export const asyncStorage: PersistStorage<unknown> = {
  getItem: async (name: string) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading item ${name} from AsyncStorage:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: unknown) => {
    try {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing item ${name} to AsyncStorage:`, error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error(`Error removing item ${name} from AsyncStorage:`, error);
    }
  },
};
