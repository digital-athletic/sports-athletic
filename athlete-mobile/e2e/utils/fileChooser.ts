import type { Page } from "@playwright/test";

/** Clicks the button and answers the browser file dialog with the file. */
export async function importFileThrough(
  page: Page,
  buttonName: string,
  filePath: string,
) {
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: buttonName }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(filePath);
}
