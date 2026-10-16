import { type I18nKey } from "@/i18n";
import { type Sport } from "@/features/training/models/UserWorkoutData";

export type PositionItem = {
  value: string;
  translationKey: I18nKey;
};

const SPORT_POSITIONS: Record<Sport, PositionItem[] | null> = {
  HANDBALL_SPORT: [
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
  FOOTBALL_SPORT: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
    {
      value: "GOAL",
      translationKey: "anamnesisQuestions.position.options.goal",
    },
  ],
  VOLLEYBALL_SPORT: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
  ],
  BASKETBALL_SPORT: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
  ],
  ICE_HOCKEY_SPORT: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
    {
      value: "GOAL",
      translationKey: "anamnesisQuestions.position.options.goal",
    },
  ],
  HOCKEY_SPORT: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
    {
      value: "GOAL",
      translationKey: "anamnesisQuestions.position.options.goal",
    },
  ],
  AMERICAN_FOOTBALL_SPORT: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
  ],
  RUGBY_SPORT: [
    {
      value: "FIELD",
      translationKey: "anamnesisQuestions.position.options.field",
    },
  ],
  OTHER_SPORT: null,
};

// GOAL for football, ice hockey and hockey, GOALKEEPER for handball
const GOALKEEPER_POSITIONS: readonly string[] = ["GOAL", "GOALKEEPER"];

/** Returns true for a goalkeeper position. A missing position counts as field player. */
export function isGoalkeeperPosition(position: string | undefined): boolean {
  return position !== undefined && GOALKEEPER_POSITIONS.includes(position);
}

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
 * OTHER_SPORT → ["OTHER"], single-position sports → [firstPosition], multi-position → [].
 */
export function getDefaultPositionForSport(sport: Sport): string[] {
  if (sport === "OTHER_SPORT") {
    return ["OTHER"];
  }
  const positions = SPORT_POSITIONS[sport];
  if (positions && positions.length === 1) {
    return [positions[0].value];
  }
  return [];
}
