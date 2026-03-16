/** Central feature flag configuration read from environment variables. */
export const featureFlags = {
  get serverSyncEnabled(): boolean {
    return process.env.EXPO_PUBLIC_SERVER_SYNC_ENABLED !== "false";
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
};
