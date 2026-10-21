import { TagGroups } from "@/constants/tagGroups";
import { isSamePainSet } from "@/features/training/utils/painUtils";
import { useAnamnesisStore } from "@/store/anamnesisStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import { useUserWorkoutStore } from "@/store/userWorkoutStore";
import { getUserTagValues } from "@/utils/tagUtils";

/**
 * Hook for orchestrating anamnesis completion.
 * Transfers anamnesis data to appropriate stores:
 * - height, weight -> userProfileStore.personalData
 * - tags -> userWorkoutStore.workoutData
 * - changed pains -> userProfileStore.warnings.painAlertSeen = false
 *
 * NOTE: gender and birthday are stored in userProfileStore (set during onboarding)
 * and are NOT copied here. Components needing these values should
 * read from userProfileStore.personalData directly.
 *
 * Both anamnesisStore and userWorkoutStore now use the same structured
 * TagsByGroup format, so tags are passed directly without conversion.
 */
export const useAnamnesisCompletion = () => {
  const { values, tags } = useAnamnesisStore();
  const { setHeight, setWeight, setWarningSeen } = useUserProfileStore();
  const { setTags } = useUserWorkoutStore();

  const saveAnamnesisData = () => {
    const savedTags = useUserWorkoutStore.getState().workoutData.tags;
    if (
      !isSamePainSet(
        getUserTagValues(savedTags, TagGroups.PAIN),
        getUserTagValues(tags, TagGroups.PAIN),
      )
    ) {
      setWarningSeen("painAlertSeen", false);
    }

    // Save tags to workout store (training configuration)
    // Tags are now in the same structured format in both stores
    setTags(tags);

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
