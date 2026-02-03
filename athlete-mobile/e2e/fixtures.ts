/**
 * Custom Playwright fixtures for using profile factories with test.use().
 *
 * This allows using the factory pattern directly:
 *
 * ```typescript
 * import { test, expect } from "./fixtures";
 * import { createWorkoutsProfile } from "./mocks/stores/profiles/workoutsProfile";
 *
 * test.describe("Statistics", () => {
 *   test.use({ profile: createWorkoutsProfile(2) });
 *
 *   test("shows workout totals", async ({ page }) => {
 *     // Profile data is seeded via storageState
 *   });
 * });
 * ```
 */

import { test as base } from "@playwright/test";
import type { StoreDataMap } from "./mocks/stores/types";

const DEFAULT_ORIGIN =
  process.env.TESTING_PLAYWRIGHT_BASE_URL ?? "http://localhost:8081";

/**
 * Converts factory output to Playwright's storageState format.
 */
function toStorageState(stores: StoreDataMap, origin: string = DEFAULT_ORIGIN) {
  return {
    cookies: [] as never[],
    origins: [
      {
        origin,
        localStorage: Object.entries(stores).map(([key, value]) => ({
          name: key,
          value: JSON.stringify(value),
        })),
      },
    ],
  };
}

/**
 * Extended test with profile factory support.
 */
export const test = base.extend<{ profile: StoreDataMap | undefined }>({
  profile: [undefined, { option: true }],

  storageState: async ({ profile }, use) => {
    if (profile) {
      await use(toStorageState(profile));
    } else {
      await use(undefined);
    }
  },
});

export { expect } from "@playwright/test";
