import { callRpc } from "./teamsApi";

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
  return callRpc<LookupUserResponse>("admin_lookup_user", { p_email: email });
}

export function setTrainerStatus(
  userId: string,
  isTrainer: boolean,
): Promise<SetTrainerResponse> {
  return callRpc<SetTrainerResponse>("admin_set_trainer", {
    p_user_id: userId,
    p_is_trainer: isTrainer,
  });
}
