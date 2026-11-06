import { Alert } from "@/common/Alert";
import { TrainingPlanType } from "@/features/training/models/TrainingPlan";
import { TrainingSectionType } from "@/features/training/models/TrainingSection";
import { Linking, Platform } from "react-native";
import { AsyncStorageService } from "./AsyncStorageService";

// TODO: Migrate to a modern notification library (e.g., expo-notifications or react-native-push-notification)
// The original implementation used @notifee/react-native which is being replaced
// Current implementation uses dummy functions as placeholders

/**
 * PushNotificationService
 *
 * Service for managing push notifications and workout reminders.
 * Currently contains placeholder implementations pending migration to a modern notification library.
 *
 * @todo Replace dummy implementations with actual notification library
 * @todo Consider using expo-notifications for cross-platform support
 */
export class PushNotificationService {
  private asyncStorageService = new AsyncStorageService();

  /**
   * Creates workout reminder notifications from a training plan
   * @todo Implement with actual notification library
   */
  createWorkoutRemindersFromTrainingPlan(
    trainingPlan: TrainingPlanType,
  ): boolean {
    if (!trainingPlan?.sections) {
      return false;
    }
    this.createWorkoutRemindersFromTrainingSections(trainingPlan.sections);
    return true;
  }

  /**
   * Creates workout reminder notifications from training sections
   * @todo Implement with actual notification library
   */
  private createWorkoutRemindersFromTrainingSections(
    sections: TrainingSectionType[],
  ): void {
    // TODO: Implement getSectionForDate utility function
    // Currently this would need the SharedFunctions.getSectionForDate implementation
    // which should be migrated to a utility module

    // Placeholder: Get current section (needs proper implementation)
    const section = sections[0]; // Simplified placeholder
    if (!section?.trainings) return;

    const trainingsArray = section.trainings;
    const daysArray: boolean[] = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];

    for (const training of trainingsArray) {
      const weekday = training.weekday;
      if (weekday >= 0 && weekday < 7) {
        daysArray[weekday] = true;
      }
    }

    this.createWorkoutReminderNotificationsFromBooleanArray(daysArray);
  }

  /**
   * Cancels all workout reminder notifications
   * @todo Implement with actual notification library
   */
  cancelAllWorkoutReminderNotifications(): void {
    const daysArray: boolean[] = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
    this.createWorkoutReminderNotificationsFromBooleanArray(daysArray);
  }

  /**
   * Creates or cancels notifications based on boolean array for each weekday
   * @todo Implement with actual notification library (notifee.cancelTriggerNotification)
   */
  private createWorkoutReminderNotificationsFromBooleanArray(
    daysArray: boolean[],
  ): void {
    for (let day = 0; day < daysArray.length; day++) {
      if (daysArray[day]) {
        const date = this.getNextDayDate(day);
        this.createTriggerNotification(date);
      } else {
        // TODO: Implement with notification library
        // Original: notifee.cancelTriggerNotification(`workoutReminder${day}`);
        console.log(
          `[PushNotificationService] Would cancel notification for day ${day}`,
        );
      }
    }
  }

  /**
   * Creates a trigger notification for a specific date
   * @todo Implement with actual notification library (notifee.createChannel, notifee.createTriggerNotification)
   */
  private async createTriggerNotification(date: Date): Promise<void> {
    // TODO: Implement with notification library
    // Original implementation:
    // 1. Create notification channel with notifee.createChannel
    // 2. Get random workout reminder text
    // 3. Create trigger notification with weekly repeat

    let today = date.getDay() - 1; // -1 for conversion to european week format with Mo = 0
    if (today === -1) {
      today = 6;
    }

    console.log(
      `[PushNotificationService] Would create notification for day ${today} at ${date.toISOString()}`,
    );

    // const notificationText = await this.getRandomWorkoutReminderText();
    // Implementation pending notification library integration
  }

  /**
   * Calculates the next occurrence of a target weekday
   */
  private getNextDayDate(targetDay: number): Date {
    const now = new Date();
    let today = now.getDay() - 1; // -1 for conversion to european week format with Mo = 0
    if (today === -1) {
      today = 6;
    }

    now.setHours(9, 0, 0, 0);
    let weekOverlap = 0;

    if (targetDay <= today) {
      weekOverlap = 7;
    }

    const diff = targetDay + weekOverlap - today;
    const returnDate = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
    return returnDate;
  }

  /**
   * Gets a random workout reminder text
   * @todo Implement file system access and random text selection
   * @todo Consider moving reminder texts to i18n translation files
   */
  private async getRandomWorkoutReminderText(): Promise<string> {
    // TODO: Implement file system access for workout reminder texts
    // Original implementation used RNFetchBlob to read from device storage
    // Consider migrating reminder texts to i18n translation files instead

    // Placeholder backup text
    return "Time for your workout! Stay fit and healthy.";
  }

  /**
   * Checks for and downloads updated workout reminder texts
   * @todo Implement once reminder texts are hosted on the backend
   */
  async checkForWorkoutReminderTextUpdates(): Promise<void> {
    // TODO: Compare a locally stored reminder text version (AsyncStorage)
    // against the backend and download updated texts when newer

    console.log(
      "[PushNotificationService] checkForWorkoutReminderTextUpdates - not yet implemented",
    );
  }

  /**
   * Checks if the OS allows notifications for the app
   */
  async systemAllowsNotifications(): Promise<boolean> {
    // TODO: Implement with notification library
    // Original used:
    // - Android: NotificationManager.areNotificationsEnabled()
    // - iOS: notifee.getNotificationSettings() with authorizationStatus check

    if (Platform.OS === "android") {
      // TODO: Implement Android notification check
      console.log(
        "[PushNotificationService] Android notification check - placeholder",
      );
      return true; // Placeholder
    } else if (Platform.OS === "ios") {
      // TODO: Implement iOS notification check
      console.log(
        "[PushNotificationService] iOS notification check - placeholder",
      );
      return true; // Placeholder
    }

    return false;
  }

  /**
   * Opens the system notification settings
   */
  async openSystemNotificationSettings(): Promise<void> {
    if (Platform.OS === "android") {
      // TODO: Implement with notification library
      // Original: notifee.openNotificationSettings()
      console.log(
        "[PushNotificationService] Would open Android notification settings",
      );
    } else if (Platform.OS === "ios") {
      const alreadyRequested =
        await this.asyncStorageService.getRequestedPermissionForNotificationsIOS();

      if (!alreadyRequested) {
        // TODO: Implement with notification library
        // Original: notifee.requestPermission()
        console.log(
          "[PushNotificationService] Would request iOS notification permission",
        );
        await this.asyncStorageService.setRequestedPermissionForNotificationsIOS(
          true,
        );
      } else {
        Linking.openSettings();
      }
    }
  }

  /**
   * Shows an alert asking for notification permissions (iOS only)
   * @todo Add translation keys for alert texts
   */
  async alertAskingForNotificationsPermission(): Promise<void> {
    if (Platform.OS !== "ios") return;

    const alreadyAsked =
      await this.asyncStorageService.getNotificationPermissionsAlertAlreadyHappened();

    if (alreadyAsked) return;

    // TODO: Add these translation keys to i18n
    Alert.alert(
      "Enable Notifications", // NOTIFICATIONS_PERMISSIONS_ALERT_TITLE
      "Would you like to receive workout reminders?", // NOTIFICATIONS_PERMISSIONS_ALERT_TEXT
      [
        {
          text: "Not now", // NOTIFICATIONS_PERMISSIONS_ALERT_BUTTON_NO
          onPress: () => {},
        },
        {
          text: "Settings", // NOTIFICATIONS_PERMISSIONS_ALERT_BUTTON_SETTINGS
          onPress: async () => {
            // TODO: Implement with notification library
            // Original: notifee.requestPermission()
            console.log(
              "[PushNotificationService] Would request iOS permission",
            );
            await this.asyncStorageService.setRequestedPermissionForNotificationsIOS(
              true,
            );
          },
        },
      ],
    );

    await this.asyncStorageService.setNotificationPermissionsAlertAlreadyHappened(
      true,
    );
  }

  /**
   * Checks permissions and creates notifications if allowed
   */
  async checkPermissionsAndCreateNotifications(
    userId: string,
    trainingPlan: TrainingPlanType,
  ): Promise<void> {
    await this.alertAskingForNotificationsPermission();

    const allowed =
      await this.asyncStorageService.getAllowNotifications(userId);
    if (allowed) {
      this.createWorkoutRemindersFromTrainingPlan(trainingPlan);
    }
  }
}
