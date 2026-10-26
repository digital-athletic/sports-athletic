/**
 * Freezes the object and every nested object, as the immer middleware of the
 * Zustand stores does with store state.
 *
 * deepFreeze({ sections: [{ start: "2026-10-26" }] })
 * → the same object; writing to it or to any section throws in strict mode
 */
export function deepFreeze<T extends object>(obj: T): T {
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}
