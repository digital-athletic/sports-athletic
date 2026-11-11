/** Stands in for the sync manager in specs that only check what the stores report to it. */
export const syncManager = {
  notifyExerciseUpdated: jest.fn(),
  notifyTestResultAdded: jest.fn(),
};
