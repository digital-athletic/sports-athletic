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
import { signedInStores } from "./mocks/auth";
import type { StoreDataMap } from "./mocks/stores/types";

const DEFAULT_ORIGIN =
  process.env.TESTING_PLAYWRIGHT_BASE_URL ?? "http://localhost:8081";

/**
 * Converts factory output to Playwright's storageState format.
 */
function toStorageState(
  stores: Record<string, unknown>,
  origin: string = DEFAULT_ORIGIN,
) {
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
 * Neutralizes Expo web's `#error-toast` (not the `fatal`-only `#error-overlay`)
 * so a harmless console.error can't block `.click()` calls in e2e. Patches
 * `attachShadow` too since the toast renders inside its own shadow root.
 */
function disableErrorToast(cssText: string) {
  const inject = (root: ParentNode) => {
    const el = document.createElement("style");
    el.textContent = cssText;
    root.appendChild(el);
  };

  const injectIntoHead = () => {
    if (!document.head) {
      requestAnimationFrame(injectIntoHead);
      return;
    }
    inject(document.head);
  };
  injectIntoHead();

  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (
    this: Element,
    init: ShadowRootInit,
  ) {
    const root = originalAttachShadow.call(this, init);
    if (this.id === "error-toast") {
      inject(root);
    }
    return root;
  };
}

/**
 * Extended test with profile factory support.
 */
export const test = base.extend<{
  profile: StoreDataMap | undefined;
  signedIn: boolean;
}>({
  profile: [undefined, { option: true }],
  signedIn: [false, { option: true }],

  storageState: async ({ profile, signedIn }, use) => {
    if (!profile && !signedIn) {
      await use(undefined);
      return;
    }
    await use(
      toStorageState({ ...profile, ...(signedIn ? signedInStores() : {}) }),
    );
  },

  page: async ({ page }, use) => {
    // disableErrorToast runs via Function#toString in the browser, so it
    // must not close over outer variables; pass values as this second arg.
    await page.addInitScript(
      disableErrorToast,
      "#error-toast, :host { pointer-events: none !important; }",
    );
    await use(page);
  },
});

export { expect } from "@playwright/test";
