import { AgeGroupTag, WorkoutConstants } from "@/constants/workoutConstants";
import { useUserProfileStore } from "@/store/userProfileStore";
import { ageGroupFor } from "../training/utils/ageUtils";

export const useAgeGroup = (): AgeGroupTag => {
  const { personalData } = useUserProfileStore();
  if (!personalData.birthday) return WorkoutConstants.AGE_GROUPS.ADULT;

  return ageGroupFor(personalData.birthday);
};
