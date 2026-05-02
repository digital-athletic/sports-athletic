/**
 * User profile store - personal data and anamnesis completion status.
 */

import { DEFAULT_USER } from "../constants";
import type { UserProfileState, StoreState } from "../types";

export interface UserProfileStoreOptions {
  userId?: string;
  username?: string;
  gender?: "MALE" | "FEMALE";
  birthday?: string;
  height?: number;
  weight?: number;
  anamnesisCompleted?: boolean;
  isInInitialAnamnesis?: boolean;
  teamId?: string | null;
}

export function createUserProfileStore(
  options: UserProfileStoreOptions = {},
): StoreState<UserProfileState> {
  const {
    userId = DEFAULT_USER.userId,
    username = DEFAULT_USER.username,
    gender = DEFAULT_USER.gender,
    birthday = DEFAULT_USER.birthday,
    height = DEFAULT_USER.height,
    weight = DEFAULT_USER.weight,
    anamnesisCompleted = true,
    isInInitialAnamnesis = false,
    teamId = null,
  } = options;

  return {
    version: 14,
    state: {
      userId,
      personalData: {
        username,
        gender,
        birthday,
        height,
        weight,
      },
      isInInitialAnamnesis,
      anamnesisCompleted,
      teamId,
    },
  };
}
