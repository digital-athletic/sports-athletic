import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { convertAnamnesisTagsToWorkoutTags } from "@/utils/tagUtils";

/**
 * Hook for orchestrating anamnesis completion.
 * Transfers anamnesis data to appropriate stores:
 * - height, weight -> userProfileStore.personalData
 * - tags -> userWorkoutStore.workoutData
 *
 * NOTE: gender and birthday are stored in userProfileStore (set during onboarding)
 * and are NOT copied here. Components needing these values should
 * read from userProfileStore.personalData directly.
 */
export const useAnamnesisCompletion = () => {
  const { values, tags } = useAnamnesisStore();
  const { setHeight, setWeight } = useUserProfileStore();
  const { setTags } = useUserWorkoutStore();

  const saveAnamnesisData = () => {
    const workoutTags = convertAnamnesisTagsToWorkoutTags(tags);

    // Save tags to workout store (training configuration)
    setTags(workoutTags);

    // Save physical attributes to profile store (personal data)
    if (values.height) {
      setHeight(Number(values.height));
    }
    if (values.weight) {
      setWeight(Number(values.weight));
    }
  };

  return { saveAnamnesisData };
};
