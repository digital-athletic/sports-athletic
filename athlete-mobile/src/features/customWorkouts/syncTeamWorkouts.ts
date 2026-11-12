import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import type { Template } from "@/schemas/aiwl.schema";
import { fetchTeamWorkoutTemplates } from "@/services/TeamService";
import { useCustomWorkoutsStore } from "@/store/customWorkoutsStore";
import { validateCustomWorkoutValue } from "./validateCustomWorkout";

export type TeamWorkoutsSyncResult = "synced" | "offline";

/**
 * Stores the team's workouts that pass the JSON import rules and drops the rest.
 * When the fetch fails, the workouts of the last sync stay on the device.
 */
export const syncTeamWorkouts = async (
  teamId: string,
): Promise<TeamWorkoutsSyncResult> => {
  let values: unknown[];
  try {
    values = await fetchTeamWorkoutTemplates(teamId);
  } catch {
    return "offline";
  }
  const skillTrees = getAllSkillTrees();
  const templates = values.flatMap((value): Template[] => {
    const validation = validateCustomWorkoutValue(value, skillTrees);
    return validation.success ? [validation.template] : [];
  });
  useCustomWorkoutsStore.getState().replaceTeamWorkouts(teamId, templates);
  return "synced";
};
