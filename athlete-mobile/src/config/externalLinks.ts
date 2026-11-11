/**
 * Pages outside the app that the menus link to. Each URL comes from a build
 * environment variable; an unset or empty variable hides the matching entry.
 */
export const externalLinks = {
  get consentU16(): string {
    return process.env.EXPO_PUBLIC_LINK_CONSENT_U16 ?? "";
  },
  get feedbackReport(): string {
    return process.env.EXPO_PUBLIC_LINK_FEEDBACK_REPORT ?? "";
  },
  get survey(): string {
    return process.env.EXPO_PUBLIC_LINK_SURVEY ?? "";
  },
  get trainerArea(): string {
    return process.env.EXPO_PUBLIC_LINK_TRAINER_AREA ?? "";
  },
  get introVideosTrainers(): string {
    return process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_TRAINERS ?? "";
  },
  get introVideosPlayers(): string {
    return process.env.EXPO_PUBLIC_LINK_INTRO_VIDEOS_PLAYERS ?? "";
  },
};
