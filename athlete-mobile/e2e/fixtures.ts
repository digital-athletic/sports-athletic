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
 * Expo web's dev-only error overlay (`@expo/log-box`) renders a click-blocking
 * `#error-toast` on any console.error, even ones that are harmless in this
 * dev-only context (e.g. a third-party library's DOM-prop warning). This
 * neutralizes just that toast for e2e runs so a stray warning can't cause
 * unrelated `.click()` calls to time out.
 *
 * Deliberately NOT touched: `#error-overlay`, log-box's separate full-page
 * overlay reserved for `fatal`-classified errors (e.g. React hydration
 * mismatches) - a real signal worth keeping loud, and not a cause we've seen
 * fire in this suite.
 *
 * The toast is rendered inside an open shadow root (see @expo/log-box's
 * `renderInShadowRoot`, which also resets the host with `:host { all: initial }`),
 * so a plain light-DOM stylesheet targeting the host is not enough on its own:
 * this also patches `attachShadow` to inject a matching rule inside the shadow
 * root itself, in case any inner element sets its own `pointer-events`.
 *
 * This is passed to `page.addInitScript` directly, so it must not close over
 * any outer variables — Playwright serializes it via `Function#toString` and
 * runs it fresh in the browser; only the explicit `arg` survives the trip.
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
export const test = base.extend<{ profile: StoreDataMap | undefined }>({
  profile: [undefined, { option: true }],

  storageState: async ({ profile }, use) => {
    if (profile) {
      await use(toStorageState(profile));
    } else {
      await use(undefined);
    }
  },

  page: async ({ page }, use) => {
    await page.addInitScript(
      disableErrorToast,
      "#error-toast, :host { pointer-events: none !important; }",
    );
    await use(page);
  },
});

export { expect } from "@playwright/test";
