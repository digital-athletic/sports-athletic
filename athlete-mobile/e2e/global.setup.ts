import { test as setup } from "@playwright/test";

/** Pre-warm Metro bundle so the first real test doesn't timeout waiting for compilation. */
setup("warm up bundle", async ({ page }) => {
  await page.goto("/", { timeout: 120_000 });
});
