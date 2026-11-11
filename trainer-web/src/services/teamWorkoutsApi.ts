import type {
  AiwlTemplate,
  TeamWorkout,
  TeamWorkoutStatus,
} from "../types/team";
import { supabase } from "./supabase";
import { ApiError, callRpc } from "./teamsApi";

export async function getTeamWorkouts(teamId: string): Promise<TeamWorkout[]> {
  const { data, error } = await supabase
    .from("team_workouts")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ApiError("INTERNAL_ERROR");
  }

  return data ?? [];
}

/**
 * Creates a workout as a draft when `workoutId` is null. Otherwise replaces its
 * template and leaves its status unchanged.
 */
export async function saveTeamWorkout(
  teamId: string,
  template: AiwlTemplate,
  workoutId: string | null,
): Promise<TeamWorkout> {
  return callRpc<TeamWorkout>("save_team_workout", {
    p_team_id: teamId,
    p_template: template,
    p_workout_id: workoutId,
  });
}

export async function deleteTeamWorkout(
  teamId: string,
  workoutId: string,
): Promise<void> {
  await callRpc<null>("delete_team_workout", {
    p_team_id: teamId,
    p_workout_id: workoutId,
  });
}

/** Publishes a draft or moves a published workout back to draft. */
export async function setTeamWorkoutStatus(
  teamId: string,
  workoutId: string,
  status: TeamWorkoutStatus,
): Promise<TeamWorkout> {
  return callRpc<TeamWorkout>("set_team_workout_status", {
    p_team_id: teamId,
    p_workout_id: workoutId,
    p_status: status,
  });
}
