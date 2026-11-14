import { type I18nKey } from "@/i18n";
import { type Sport } from "@/features/training/models/UserWorkoutData";

export type PositionItem = {
  value: string;
  translationKey: I18nKey;
};

const SPORT_POSITIONS: Record<Sport, PositionItem[] | null> = {
  SPORT_HANDBALL: [
    {
      value: "BACKCOURT",
      translationKey: "anamnesisQuestions.position.options.backcourt",
    },
    {
      value: "WING",
      translationKey: "anamnesisQuestions.position.options.wing",
    },
    {
      value: "PIVOT",
      translationKey: "anamnesisQuestions.position.options.pivot",
    },
    {
      value: "GOALKEEPER",
      translationKey: "anamnesisQuestions.position.options.goalkeeper",
    },
    {
      value: "REFEREE",
      translationKey: "anamnesisQuestions.position.options.referee",
    },
  ],
  SPORT_FOOTBALL: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
    {
      value: "GOAL",
      translationKey: "anamnesisQuestions.position.options.goal",
    },
  ],
  SPORT_VOLLEYBALL: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
  ],
  SPORT_BASKETBALL: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
  ],
  SPORT_ICE_HOCKEY: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
    {
      value: "GOAL",
      translationKey: "anamnesisQuestions.position.options.goal",
    },
  ],
  SPORT_HOCKEY: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
    {
      value: "GOAL",
      translationKey: "anamnesisQuestions.position.options.goal",
    },
  ],
  SPORT_AMERICAN_FOOTBALL: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
  ],
  SPORT_RUGBY: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
  ],
  SPORT_OTHER: null,
};

/** Returns the list of positions for a given sport, or null if not applicable. */
export function getPositionsForSport(sport: Sport): PositionItem[] | null {
  return SPORT_POSITIONS[sport];
}

/** Returns true if the position selector should be shown for the given sport. */
export function shouldShowPositionQuestion(sport: Sport): boolean {
  return SPORT_POSITIONS[sport] !== null;
}

/**
 * Returns the default position selection for a sport.
 * SPORT_OTHER → ["OTHER"], single-position sports → [firstPosition], multi-position → [].
 */
export function getDefaultPositionForSport(sport: Sport): string[] {
  if (sport === "SPORT_OTHER") {
    return ["OTHER"];
  }
  const positions = SPORT_POSITIONS[sport];
  if (positions && positions.length === 1) {
    return [positions[0].value];
  }
  return [];
}
