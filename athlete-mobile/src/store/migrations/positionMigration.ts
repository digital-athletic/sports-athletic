const POSITION_RENAME_MAP: Record<string, string> = {
  RUECKRAUM: "BACKCOURT",
  AUSSEN: "WING",
  KREIS: "PIVOT",
  TOR: "GOALKEEPER",
  SCHIRI: "REFEREE",
};

/** Renames German handball position values to English equivalents. */
export function migratePositionTags(
  tags: Record<string, string[]> | undefined,
): Record<string, string[]> {
  if (!tags) return {};

  const positions = tags.POSITION;
  if (!positions) return tags;

  return {
    ...tags,
    POSITION: positions.map((v) => POSITION_RENAME_MAP[v] ?? v),
  };
}
