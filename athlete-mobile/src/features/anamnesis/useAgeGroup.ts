import { AgeGroupTag } from "@/constants/workoutConstants";
import { useUserProfileStore } from "@/store/userProfileStore";
import { ageGroupFor } from "../training/utils/ageUtils";

export const useAgeGroup = (): AgeGroupTag => {
  const { personalData } = useUserProfileStore();
  return ageGroupFor(personalData.birthday);
};
