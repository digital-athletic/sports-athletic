import { useMemo } from "react";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { type AthleteProfile } from "./referenceRange";

/** The athlete's sport, gender, position and birthday, which decide the reference range. */
export function useAthleteProfile(): AthleteProfile {
  const sport = useUserWorkoutStore((state) => state.workoutData.sport);
  const position = useUserWorkoutStore(
    (state) => state.workoutData.tags.POSITION?.[0],
  );
  const gender = useUserProfileStore((state) => state.personalData.gender);
  const birthday = useUserProfileStore((state) => state.personalData.birthday);

  return useMemo(
    () => ({ sport, gender, position, birthday }),
    [sport, gender, position, birthday],
  );
}
