/**
 * Builds the raw JSON of a TEST exercises block with any test sets, valid or
 * not, so schema specs can feed invalid data.
 *
 * generateRawExercisesBlock([{ share: 0, repetitions: 5, rest: 60 }])
 * → { kind: "exercises", skill: "TEST", exercises: ["25"],
 *     testSets: [{ share: 0, repetitions: 5, rest: 60 }] }
 */
export const generateRawExercisesBlock = (
  testSets: unknown,
): Record<string, unknown> => ({
  kind: "exercises",
  skill: "TEST",
  exercises: ["25"],
  testSets,
});
