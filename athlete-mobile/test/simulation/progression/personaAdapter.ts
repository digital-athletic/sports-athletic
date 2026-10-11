/**
 * Adapts a legacy persona (assets/data/personas/pN.js) into the inputs the
 * training generator expects. Personas carry `workoutData` in a legacy shape
 * (flat tag strings, `D-M-YYYY` birthdays) that predates the current
 * UserType/PersonalData schema, so this is the single translation layer.
 */
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import type { UserType } from "@/schemas/user.schema";

export interface LegacyPersona {
  displayName?: { default?: string };
  value: {
    name?: string;
    workoutData: {
      gender?: "MALE" | "FEMALE";
      birthday?: string;
      tags?: string[];
    };
  };
}

/** Legacy persona birthdays are `D-M-YYYY`; the schema wants ISO `YYYY-MM-DD`. */
function toISOBirthday(birthday: string | undefined): string {
  if (!birthday) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return birthday;
  const parts = birthday.split("-");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** Extract the LEVEL tag (e.g. `LEVEL_BEGINNER` -> `BEGINNER`) from flat tags. */
function levelFromTags(tags: string[] | undefined): string {
  const level = (tags ?? []).find((t) => t.startsWith("LEVEL_"));
  return level ? level.replace("LEVEL_", "") : "BEGINNER";
}

function personaDisplayName(persona: LegacyPersona): string {
  return persona.displayName?.default ?? persona.value.name ?? "persona";
}

/**
 * Build a generator-ready UserType from a persona, seeding `maxValues` so
 * percentage-to-kg conversions in the simulator use realistic absolute loads.
 */
export function personaToUser(
  persona: LegacyPersona,
  maxValues: MaxValuesType = DEFAULT_MAX_VALUES,
): UserType {
  const { workoutData } = persona.value;
  const gender = workoutData.gender ?? "FEMALE";
  const birthday = toISOBirthday(workoutData.birthday);
  const level = levelFromTags(workoutData.tags);

  return {
    userId: `persona-${personaDisplayName(persona)}`,
    personalData: { gender, birthday },
    workoutData: {
      tags: { LEVEL: [level] },
      maxValues,
    },
    temporalData: [],
  };
}
