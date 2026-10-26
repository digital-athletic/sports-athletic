type Json = Record<string, unknown>;

/**
 * Builds the raw JSON of a template around any blocks, valid or not, so schema
 * specs can feed invalid data.
 *
 * generateRawTemplate({ kind: "exercises", skill: "TEST", exercises: [] })
 * → { aiwl: 1, id: "TEST", name: { en: "Strength test" },
 *     blocks: [{ kind: "exercises", skill: "TEST", exercises: [] }] }
 */
export const generateRawTemplate = (...blocks: Json[]): Json => ({
  aiwl: 1,
  id: "TEST",
  name: { en: "Strength test" },
  blocks,
});

/**
 * Builds the raw JSON of an AIWL block of the kind, with the extra keys.
 *
 * generateRawBlock("picks", { testSets: [] })
 * → { kind: "picks", skill: "WU", picks: [{ tags: [], count: 1 }], testSets: [] }
 */
export const generateRawBlock = (
  kind: "picks" | "duration" | "branches",
  extra: Json = {},
): Json => {
  const required: Record<typeof kind, Json> = {
    picks: { picks: [{ tags: [], count: 1 }] },
    duration: { duration: 600 },
    branches: { branches: ["11"] },
  };
  return { kind, skill: "WU", ...required[kind], ...extra };
};
