import type { BrowserContext, Page } from "@playwright/test";

export async function mockWakeLock(
  target: Page | BrowserContext,
): Promise<void> {
  await target.addInitScript(() => {
    if (!navigator.wakeLock) {
      Object.defineProperty(navigator, "wakeLock", {
        value: {
          request: async (type: string) => {
            const sentinel = {
              released: false,
              type,
              release: async () => {
                Object.defineProperty(sentinel, "released", { value: true });
              },
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => false,
              onrelease: null,
            };
            return sentinel;
          },
        },
        configurable: true,
      });
    }
  });
}
