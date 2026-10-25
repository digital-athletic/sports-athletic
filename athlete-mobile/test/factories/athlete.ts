import type { LevelTag } from "@/constants/workoutConstants";
import {
  DEFAULT_MAX_VALUES,
  type MaxValuesType,
} from "@/features/training/models/MaxValues";
import type { UserType } from "@/schemas/user.schema";

export interface AthleteOptions {
  level?: LevelTag;
  birthday?: string;
  gender?: "MALE" | "FEMALE";
  pains?: string[];
  soreMuscles?: string[];
  /** The tested 1RMs, as stored in the workout data. */
  maxValues?: MaxValuesType;
  /** Leaves out the workout data, as an athlete who skipped the anamnesis. */
  withoutWorkoutData?: boolean;
  /** Leaves out the gender and birthday, as an athlete without a profile. */
  withoutPersonalData?: boolean;
}

const generateWorkoutData = (
  level: LevelTag,
  pains: string[],
  maxValues?: MaxValuesType,
): UserType["workoutData"] => ({
  tags: { LEVEL: [level], PAIN: pains },
  ...(maxValues && { maxValues }),
});

/**
 * Builds the athlete of a generation input: an adult man at fitness level
 * ADVANCED without pains, muscle soreness or tested 1RMs.
 *
 * generateAthlete({ soreMuscles: ["CHEST"] })
 * → { userId: "athlete", personalData: { gender: "MALE", birthday: "1990-06-15" },
 *     workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: [] } },
 *     temporalData: [{ tag: "CHEST", date: "2026-10-24", expiration: "2026-10-25" }] }
 */
export const generateAthlete = ({
  level = "ADVANCED",
  birthday = "1990-06-15",
  gender = "MALE",
  pains = [],
  soreMuscles = [],
  maxValues,
  withoutWorkoutData,
  withoutPersonalData,
}: AthleteOptions = {}): UserType => ({
  userId: "athlete",
  ...(!withoutPersonalData && { personalData: { gender, birthday } }),
  ...(!withoutWorkoutData && {
    workoutData: generateWorkoutData(level, pains, maxValues),
  }),
  temporalData: soreMuscles.map((tag) => ({
    tag,
    date: "2026-10-24",
    expiration: "2026-10-25",
  })),
});

/**
 * Builds an athlete with the default tested 1RMs, an adult man at fitness
 * level BEGINNER born on 1990-01-01.
 *
 * generateAthleteWithMaxValues({ level: "ADVANCED" })
 * → { userId: "athlete", personalData: { gender: "MALE", birthday: "1990-01-01" },
 *     workoutData: { tags: { LEVEL: ["ADVANCED"], PAIN: [] }, maxValues: DEFAULT_MAX_VALUES }, ... }
 */
export const generateAthleteWithMaxValues = (
  options: AthleteOptions = {},
): UserType =>
  generateAthlete({
    level: "BEGINNER",
    birthday: "1990-01-01",
    maxValues: DEFAULT_MAX_VALUES,
    ...options,
  });
