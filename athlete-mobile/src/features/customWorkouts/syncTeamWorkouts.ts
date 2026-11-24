import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { fetchTeamWorkouts, type TeamWorkoutRow } from "@/services/TeamService";
import {
  type TeamWorkoutInput,
  useCustomWorkoutsStore,
} from "@/store/customWorkoutsStore";
import { discardOrphanedDrawnWorkouts } from "./discardOrphanedDrawnWorkouts";
import { validateCustomWorkoutValue } from "./validateCustomWorkout";

export type TeamWorkoutsSyncResult = "synced" | "offline";

/**
 * Stores the team's workouts that pass the JSON import rules and drops the rest.
 * When the fetch fails, the workouts of the last sync stay on the device.
 */
export const syncTeamWorkouts = async (
  teamId: string,
): Promise<TeamWorkoutsSyncResult> => {
  let rows: TeamWorkoutRow[];
  try {
    rows = await fetchTeamWorkouts(teamId);
  } catch {
    return "offline";
  }
  const skillTrees = getAllSkillTrees();
  const workouts: TeamWorkoutInput[] = [];
  for (const row of rows) {
    const validation = validateCustomWorkoutValue(row.template, skillTrees);
    if (!validation.success) continue;
    workouts.push({
      template: validation.template,
      modifiedAt: row.updatedAt,
      isDraft: row.isDraft,
    });
  }
  useCustomWorkoutsStore.getState().replaceTeamWorkouts(teamId, workouts);
  discardOrphanedDrawnWorkouts();
  return "synced";
};
