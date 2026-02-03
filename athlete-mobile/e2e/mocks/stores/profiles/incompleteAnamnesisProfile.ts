/**
 * Incomplete anamnesis profile - user logged in but anamnesis not completed.
 *
 * Use this profile for tests that need to access the anamnesis flow
 * as an authenticated user.
 */

import { STORAGE_KEYS } from "../constants";
import type { StoreDataMap } from "../types";
import { createUserProfileStore } from "../data/userProfileStore";

/**
 * Creates a profile with anamnesis not completed.
 * User is authenticated but needs to complete onboarding.
 */
export function createIncompleteAnamnesisProfile(): StoreDataMap {
  return {
    [STORAGE_KEYS.USER_PROFILE]: createUserProfileStore({
      isInInitialAnamnesis: true,
      anamnesisCompleted: false,
    }),
  };
}
