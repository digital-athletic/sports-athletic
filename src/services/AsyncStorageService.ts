import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorageService
 *
 * Service for managing persistent app data using AsyncStorage.
 * Provides type-safe methods for storing and retrieving various app settings.
 *
 * Migrated from legacy/services/AsyncStorageService.js
 */
export class AsyncStorageService {
  /**
   * Save data to storage (stringifies automatically)
   */
  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  /**
   * Load data from storage (parses automatically)
   */
  private async loadFromStorage<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  // Exercise version management
  async setExercisesVersion(versionNumber: number): Promise<void> {
    await this.saveToStorage("exercises.exercisesVersionNumber", versionNumber);
  }

  async getExercisesVersion(): Promise<number | null> {
    const data = await this.loadFromStorage<number>(
      "exercises.exercisesVersionNumber",
    );
    const versionNumber = Number.parseInt(String(data));
    return Number.isNaN(versionNumber) ? null : versionNumber;
  }

  async setUseStagingExercises(useStagingExercises: boolean): Promise<void> {
    await this.saveToStorage(
      "exercises.useStagingExercises",
      useStagingExercises,
    );
  }

  async getUseStagingExercises(): Promise<boolean> {
    const data = await this.loadFromStorage<boolean>(
      "exercises.useStagingExercises",
    );
    return data ?? false;
  }

  // Skill tree version management
  async setSkillTreeVersion(
    skillName: string,
    versionNumber: number,
  ): Promise<void> {
    await this.saveToStorage(
      `exercises.skillTreeVersionNumber.${skillName}`,
      versionNumber,
    );
  }

  async getSkillTreeVersion(skillName: string): Promise<number | null> {
    const data = await this.loadFromStorage<number>(
      `exercises.skillTreeVersionNumber.${skillName}`,
    );
    const versionNumber = Number.parseInt(String(data));
    return Number.isNaN(versionNumber) ? null : versionNumber;
  }

  // Login management
  async setLastUserLoggedIn(mail: string): Promise<void> {
    await this.saveToStorage("login.lastUserLoggedIn", mail);
  }

  async getLastUserLoggedIn(): Promise<string | null> {
    return await this.loadFromStorage<string>("login.lastUserLoggedIn");
  }

  // Settings management
  async setAnonymisedDataUse(useData: boolean): Promise<void> {
    await this.saveToStorage("settings.anonymisedDataUse", useData);
  }

  async getAnonymisedDataUse(): Promise<boolean> {
    const data = await this.loadFromStorage<boolean>(
      "settings.anonymisedDataUse",
    );
    return data ?? false;
  }

  // Notification settings
  async setAllowNotifications(allowed: boolean, userId: string): Promise<void> {
    await this.saveToStorage(`settings.allowNotificatons.${userId}`, allowed);
  }

  async getAllowNotifications(userId: string): Promise<boolean> {
    const allowed = await this.loadFromStorage<boolean>(
      `settings.allowNotificatons.${userId}`,
    );
    if (allowed === null) {
      await this.setAllowNotifications(true, userId);
      return true;
    }
    return allowed;
  }

  async setNotificationPermissionsAlertAlreadyHappened(
    happened: boolean,
  ): Promise<void> {
    await this.saveToStorage(
      "settings.notificationPermissionsAlertAlreadyHappened",
      happened,
    );
  }

  async getNotificationPermissionsAlertAlreadyHappened(): Promise<boolean> {
    const alreadyAsked = await this.loadFromStorage<boolean>(
      "settings.notificationPermissionsAlertAlreadyHappened",
    );
    return alreadyAsked === true;
  }

  async setRequestedPermissionForNotificationsIOS(
    requested: boolean,
  ): Promise<void> {
    await this.saveToStorage(
      "settings.requestedPermissionForNotificationsIOS",
      requested,
    );
  }

  async getRequestedPermissionForNotificationsIOS(): Promise<boolean> {
    const alreadyRequested = await this.loadFromStorage<boolean>(
      "settings.requestedPermissionForNotificationsIOS",
    );
    return alreadyRequested === true;
  }

  async setWorkoutReminderTextVersion(versionNumber: number): Promise<void> {
    await this.saveToStorage(
      "notifications.workoutReminderTextVersionNumber",
      versionNumber,
    );
  }

  async getWorkoutReminderTextVersion(): Promise<number | null> {
    const data = await this.loadFromStorage<number>(
      "notifications.workoutReminderTextVersionNumber",
    );
    const versionNumber = Number.parseInt(String(data));
    return Number.isNaN(versionNumber) ? null : versionNumber;
  }
}
