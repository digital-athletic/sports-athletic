import { type Page, expect } from "@playwright/test";

/** The owner-only guidance and weekly target form on the management tab. */
export class TeamGuidanceForm {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private get form() {
    return this.page.getByTestId("team-guidance-form");
  }

  private get guidance() {
    return this.page.getByTestId("team-guidance-text");
  }

  private get weeklyTarget() {
    return this.page.getByTestId("team-guidance-weekly-target");
  }

  async expectVisible() {
    await expect(this.form).toBeVisible();
  }

  async expectHidden() {
    // The team name proves the tab has rendered before the absence is checked.
    await expect(
      this.page.getByRole("heading", { level: 3 }).first(),
    ).toBeVisible();
    await expect(this.form).toHaveCount(0);
  }

  async expectValues(guidance: string, weeklyTarget: string) {
    await expect(this.guidance).toHaveValue(guidance);
    await expect(this.weeklyTarget).toHaveValue(weeklyTarget);
  }

  async fill(guidance: string, weeklyTarget: string) {
    await this.guidance.fill(guidance);
    await this.weeklyTarget.fill(weeklyTarget);
  }

  async save() {
    await this.page.getByTestId("team-guidance-save").click();
  }

  async expectSaved() {
    await expect(this.page.getByTestId("team-guidance-saved")).toBeVisible();
  }

  /** The error is translated; the raw ErrorCode never reaches the screen. */
  async expectErrorWithoutCode(code: string) {
    const alert = this.form.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).not.toContainText(code);
  }
}
