import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { convertAnamnesisTagsToWorkoutTags } from "@/utils/tagUtils";

/**
 * Hook for orchestrating anamnesis completion.
 * Transfers anamnesis data (tags, height, weight, etc.) to userWorkoutStore.
 */
export const useAnamnesisCompletion = () => {
  const { values, tags } = useAnamnesisStore();
  const { personalData } = useUserProfileStore();
  const { setWorkoutData } = useUserWorkoutStore();

  const saveAnamnesisData = () => {
    const workoutTags = convertAnamnesisTagsToWorkoutTags(tags);

    setWorkoutData({
      tags: workoutTags,
      height: values.height ? Number(values.height) : undefined,
      weight: values.weight ? Number(values.weight) : undefined,
      gender: personalData.gender,
      birthday: personalData.birthday,
    });
  };

  return { saveAnamnesisData };
};
