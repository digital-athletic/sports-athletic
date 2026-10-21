/**
 * Splits branches into the first holder of each exercise and the later branches
 * resolving to an exercise that is already held. Returns one replacement
 * region per later branch.
 */
export const splitDuplicateBranches = <
  T extends { branchId: string; tags?: string[] },
>(
  entries: T[],
  resolve: (entry: T) => string | null,
  regionOf: (entry: T) => string | undefined,
): { unique: T[]; duplicateRegions: string[] } => {
  const held = new Set<string>();
  const unique: T[] = [];
  const duplicateRegions: string[] = [];
  for (const entry of entries) {
    const exerciseId = resolve(entry);
    if (exerciseId !== null && held.has(exerciseId)) {
      const region = regionOf(entry);
      if (region) duplicateRegions.push(region);
      continue;
    }
    if (exerciseId !== null) held.add(exerciseId);
    unique.push(entry);
  }
  return { unique, duplicateRegions };
};

/**
 * Refills each region slot on its own, so a slot without a fitting branch is
 * dropped while the other slots stay.
 */
export const refillSlots = <T extends { branchId: string }>(
  regions: string[],
  keep: T[],
  replaceSlot: (usedBranchIds: string[], region: string) => T | undefined,
): T[] => {
  const added: T[] = [];
  for (const region of regions) {
    const branch = replaceSlot(
      [...keep, ...added].map((entry) => entry.branchId),
      region,
    );
    if (branch) added.push(branch);
  }
  return added;
};
