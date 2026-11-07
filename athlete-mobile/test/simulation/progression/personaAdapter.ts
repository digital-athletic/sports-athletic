/**
 * Adapts a persona fixture (test/fixtures/personas/*.json) into the UserType
 * the training generator expects. Personas store an age instead of a birthday,
 * so a persona keeps its age group whatever the current date.
 */
import { DEFAULT_MAX_VALUES } from "@/features/training/models/MaxValues";
import type { MaxValuesType } from "@/features/training/models/MaxValues";
import type { LevelTagSchemaType } from "@/schemas/common.schema";
import type { UserType } from "@/schemas/user.schema";

export interface Persona {
  name: string;
  gender: "MALE" | "FEMALE";
  age: number;
  weight: number;
  level: LevelTagSchemaType;
}

/** Age 30 in 2026 gives `1996-01-01`; reads `Date.now()` so tests can pin the year. */
function birthdayForAge(age: number): string {
  const birthYear = new Date(Date.now()).getFullYear() - age;
  return `${birthYear}-01-01`;
}

/**
 * Build a generator-ready UserType from a persona, seeding `maxValues` so
 * percentage-to-kg conversions in the simulator use realistic absolute loads.
 */
export function personaToUser(
  persona: Persona,
  maxValues: MaxValuesType = DEFAULT_MAX_VALUES,
): UserType {
  return {
    userId: `persona-${persona.name}`,
    personalData: {
      gender: persona.gender,
      birthday: birthdayForAge(persona.age),
      weight: persona.weight,
    },
    workoutData: {
      tags: { LEVEL: [persona.level] },
      maxValues,
    },
    temporalData: [],
  };
}
