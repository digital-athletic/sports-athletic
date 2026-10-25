import type { LevelTag } from "@/constants/workoutConstants";
import type { UserType } from "@/schemas/user.schema";

export interface AthleteOptions {
  level?: LevelTag;
  birthday?: string;
  gender?: "MALE" | "FEMALE";
  pains?: string[];
  soreMuscles?: string[];
  /** Leaves out the workout data, as an athlete who skipped the anamnesis. */
  withoutWorkoutData?: boolean;
  /** Leaves out the gender and birthday, as an athlete without a profile. */
  withoutPersonalData?: boolean;
}

/**
 * Builds the athlete of a generation input: an adult man at fitness level
 * ADVANCED without pains or muscle soreness.
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
  withoutWorkoutData,
  withoutPersonalData,
}: AthleteOptions = {}): UserType => ({
  userId: "athlete",
  ...(!withoutPersonalData && { personalData: { gender, birthday } }),
  ...(!withoutWorkoutData && {
    workoutData: { tags: { LEVEL: [level], PAIN: pains } },
  }),
  temporalData: soreMuscles.map((tag) => ({
    tag,
    date: "2026-10-24",
    expiration: "2026-10-25",
  })),
});
