import { callEdgeFunction } from "./teamsApi";

export interface LookupUserResponse {
  user_id: string;
  email: string;
  trainer_granted_at: string | null;
}

export interface SetTrainerResponse {
  user_id: string;
  trainer_granted_at: string | null;
}

export function lookupUserByEmail(email: string): Promise<LookupUserResponse> {
  return callEdgeFunction<LookupUserResponse>("admin-lookup-user", { email });
}

export function setTrainerStatus(
  userId: string,
  isTrainer: boolean,
): Promise<SetTrainerResponse> {
  return callEdgeFunction<SetTrainerResponse>("admin-set-trainer", {
    user_id: userId,
    is_trainer: isTrainer,
  });
}
