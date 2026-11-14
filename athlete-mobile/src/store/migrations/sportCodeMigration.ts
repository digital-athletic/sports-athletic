import { WorkoutConstants } from "@/constants/workoutConstants";
import type { Sport } from "@/features/training/models/UserWorkoutData";

const SPORT_RENAME_MAP: Record<string, Sport> = {
  HANDBALL_SPORT: "SPORT_HANDBALL",
  FOOTBALL_SPORT: "SPORT_FOOTBALL",
  VOLLEYBALL_SPORT: "SPORT_VOLLEYBALL",
  BASKETBALL_SPORT: "SPORT_BASKETBALL",
  ICE_HOCKEY_SPORT: "SPORT_ICE_HOCKEY",
  HOCKEY_SPORT: "SPORT_HOCKEY",
  AMERICAN_FOOTBALL_SPORT: "SPORT_AMERICAN_FOOTBALL",
  RUGBY_SPORT: "SPORT_RUGBY",
  OTHER_SPORT: "SPORT_OTHER",
};

function isSport(code: string): code is Sport {
  return Object.hasOwn(WorkoutConstants.SPORTS, code);
}

/** Renames a sport code with the old `_SPORT` suffix; an unknown code becomes the general sport. */
export function migrateSportCode(storedCode: string | undefined): Sport {
  if (storedCode === undefined) return "SPORT_OTHER";
  if (isSport(storedCode)) return storedCode;
  return SPORT_RENAME_MAP[storedCode] ?? "SPORT_OTHER";
}
