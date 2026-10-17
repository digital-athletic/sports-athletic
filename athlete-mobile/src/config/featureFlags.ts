/** Central feature flag configuration read from environment variables. */
export const featureFlags = {
  get serverSyncEnabled(): boolean {
    return process.env.EXPO_PUBLIC_SERVER_SYNC_ENABLED !== "false";
  },
  get analyticsConsentEnabled(): boolean {
    return process.env.EXPO_PUBLIC_ANALYTICS_CONSENT_ENABLED === "true";
  },
  /**
   * When true, exercise sync is enabled but only activity counts are transmitted —
   * no weights, repetitions, or other performance specifics leave the device.
   * Acts as a sub-mode of serverSyncEnabled for privacy-sensitive deployments.
   * Env var: EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED
   */
  get serverSyncActivityOnlyEnabled(): boolean {
    return process.env.EXPO_PUBLIC_SERVER_SYNC_ACTIVITY_ONLY_ENABLED === "true";
  },
  get termsEnabled(): boolean {
    return (process.env.EXPO_PUBLIC_LINK_AGB ?? "") !== "";
  },
  get privacyEnabled(): boolean {
    return (process.env.EXPO_PUBLIC_LINK_PRIVACY ?? "") !== "";
  },
  get imprintEnabled(): boolean {
    return (process.env.EXPO_PUBLIC_LINK_IMPRINT ?? "") !== "";
  },
  get a11yStatementEnabled(): boolean {
    return (process.env.EXPO_PUBLIC_LINK_A11Y_STATEMENT ?? "") !== "";
  },
  get a11yFeedbackEnabled(): boolean {
    return (process.env.EXPO_PUBLIC_LINK_A11Y_FEEDBACK ?? "") !== "";
  },
  get contactEnabled(): boolean {
    return process.env.EXPO_PUBLIC_CONTACT_ENABLED === "true";
  },
  /**
   * When true, athletes can start a training session in an alternative
   * checklist view (all exercises in one scrollable list) instead of the
   * one-by-one flow. Env var: EXPO_PUBLIC_TRAINING_LIST_VIEW_ENABLED
   */
  get trainingListViewEnabled(): boolean {
    return process.env.EXPO_PUBLIC_TRAINING_LIST_VIEW_ENABLED === "true";
  },
  get reviewEmail(): string | null {
    return process.env.EXPO_PUBLIC_REVIEW_EMAIL ?? null;
  },
  get reviewOtp(): string | null {
    return process.env.EXPO_PUBLIC_REVIEW_OTP ?? null;
  },
  isReviewUser(email: string): boolean {
    return (
      this.reviewEmail !== null &&
      email.toLowerCase() === this.reviewEmail.toLowerCase()
    );
  },
  isReviewUserId(userId: string): boolean {
    return userId === "review-user";
  },
};
