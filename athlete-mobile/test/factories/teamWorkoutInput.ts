import type { Template } from "@/schemas/aiwl.schema";
import type { TeamWorkoutInput } from "@/store/customWorkoutsStore";

/**
 * Builds a synced team workout of the template, last changed on the server at
 * 1 Nov 2026 08:00. The overrides replace any field.
 *
 * generateTeamWorkoutInput(template, { isDraft: true })
 * → { template, modifiedAt: "2026-11-01T08:00:00.123456+00:00", isDraft: true }
 */
export const generateTeamWorkoutInput = (
  template: Template,
  overrides: Partial<TeamWorkoutInput> = {},
): TeamWorkoutInput => ({
  template,
  modifiedAt: "2026-11-01T08:00:00.123456+00:00",
  ...overrides,
});
