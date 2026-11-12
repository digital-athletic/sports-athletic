import { getAllSkillTrees } from "@/data/skillTreeRegistry";
import { fetchTeamWorkouts, type TeamWorkoutRow } from "@/services/TeamService";
import type { Template } from "@/schemas/aiwl.schema";
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
  let rows: TeamWorkoutRow[];
  try {
    rows = await fetchTeamWorkouts(teamId);
  } catch {
    return "offline";
  }
  const skillTrees = getAllSkillTrees();
  const templates: Template[] = [];
  const draftTemplateIds: string[] = [];
  for (const row of rows) {
    const validation = validateCustomWorkoutValue(row.template, skillTrees);
    if (!validation.success) continue;
    templates.push(validation.template);
    if (row.isDraft) draftTemplateIds.push(validation.template.id);
  }
  useCustomWorkoutsStore
    .getState()
    .replaceTeamWorkouts(teamId, templates, draftTemplateIds);
  return "synced";
};
