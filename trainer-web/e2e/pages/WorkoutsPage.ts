import { type Locator, type Page, expect } from "@playwright/test";

/** A section as the builder takes it: a skill code, tag codes and an amount. */
export type SectionInput = {
  skill: string;
  tags?: string[];
  /** Exercises for most skills, minutes for cardio. */
  amount: number;
};

/** The Workouts tab of the dashboard: the list and the builder. */
export class WorkoutsPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.getByTestId("tab-workouts").click();
  }

  async expectNoWorkouts() {
    await expect(this.page.getByTestId("workouts-empty")).toBeVisible();
  }

  /** Workout names come from the fixture or the test, not a translation. */
  workout(name: string): Locator {
    return this.page.getByTestId("workout-item").filter({
      has: this.page.getByRole("heading", { name, exact: true }),
    });
  }

  async expectWorkout(name: string) {
    await expect(this.workout(name)).toBeVisible();
  }

  /** Tags are matched by code, so the check is independent of the translation. */
  async expectSectionTags(name: string, index: number, tags: string[]) {
    await expect(
      this.workout(name).getByTestId("workout-section").nth(index),
    ).toHaveAttribute("data-tags", tags.join(" "));
  }

  async expectNoEditActions() {
    await expect(this.page.getByTestId("workout-new")).toHaveCount(0);
    await expect(this.page.getByTestId("workout-edit")).toHaveCount(0);
    await expect(this.page.getByTestId("workout-delete")).toHaveCount(0);
    await expect(this.page.getByTestId("workout-publish")).toHaveCount(0);
    await expect(this.page.getByTestId("workout-unpublish")).toHaveCount(0);
  }

  async expectDraft(name: string) {
    await expect(
      this.workout(name).getByTestId("workout-draft-badge"),
    ).toBeVisible();
  }

  async expectPublished(name: string) {
    await expect(this.workout(name)).toBeVisible();
    await expect(
      this.workout(name).getByTestId("workout-draft-badge"),
    ).toHaveCount(0);
  }

  async expectNoDownload() {
    await expect(this.page.getByTestId("workout-download")).toHaveCount(0);
  }

  /** Ticks the warm-up or the cool-down and sets its exercise count. */
  async tickBookend(part: "warm-up" | "cool-down", amount: number) {
    await this.page.getByTestId(`workout-${part}`).check();
    await this.page.getByTestId(`workout-${part}-amount`).fill(String(amount));
  }

  async expectBookendTicked(part: "warm-up" | "cool-down", amount: number) {
    await expect(this.page.getByTestId(`workout-${part}`)).toBeChecked();
    await expect(this.page.getByTestId(`workout-${part}-amount`)).toHaveValue(
      String(amount),
    );
  }

  /** The skill codes the training list of a section offers. */
  async offeredSkills(index: number): Promise<string[]> {
    return this.section(index)
      .getByTestId("section-skill")
      .locator("option")
      .evaluateAll((options) =>
        options.map((option) => option.getAttribute("value") ?? ""),
      );
  }

  /** The tag codes a section offers. */
  async offeredTags(index: number): Promise<string[]> {
    return this.section(index)
      .locator('[data-testid^="section-tag-"]')
      .evaluateAll((inputs) =>
        inputs.map((input) =>
          (input.getAttribute("data-testid") ?? "").replace("section-tag-", ""),
        ),
      );
  }

  async publish(name: string) {
    await this.workout(name).getByTestId("workout-publish").click();
  }

  async moveToDraft(name: string) {
    await this.workout(name).getByTestId("workout-unpublish").click();
  }

  /** Downloads the workout and returns the file name and the file text. */
  async download(name: string): Promise<{ fileName: string; text: string }> {
    const downloadEvent = this.page.waitForEvent("download");
    await this.workout(name).getByTestId("workout-download").click();
    const download = await downloadEvent;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return {
      fileName: download.suggestedFilename(),
      text: Buffer.concat(chunks).toString("utf8"),
    };
  }

  async startNewWorkout() {
    await this.page.getByTestId("workout-new").click();
  }

  async editWorkout(name: string) {
    await this.workout(name).getByTestId("workout-edit").click();
  }

  async deleteWorkout(name: string) {
    await this.workout(name).getByTestId("workout-delete").click();
    await this.page.getByTestId("workout-delete-confirm").click();
  }

  async fillName(name: string) {
    await this.page.getByTestId("workout-name").fill(name);
  }

  get sections(): Locator {
    return this.page.getByTestId("workout-section");
  }

  section(index: number): Locator {
    return this.sections.nth(index);
  }

  async addSection(input: SectionInput) {
    await this.page.getByTestId("workout-add-section").click();
    await this.fillSection(this.sections.last(), input);
  }

  async fillSection(section: Locator, input: SectionInput) {
    await section.getByTestId("section-skill").selectOption(input.skill);
    for (const tag of input.tags ?? []) {
      await section.getByTestId(`section-tag-${tag}`).check();
    }
    await section.getByTestId("section-amount").fill(String(input.amount));
  }

  async expectSectionSkills(skills: string[]) {
    await expect(this.sections).toHaveCount(skills.length);
    for (const [index, skill] of skills.entries()) {
      await expect(
        this.section(index).getByTestId("section-skill"),
      ).toHaveValue(skill);
    }
  }

  /** The unit is a data attribute, so the test does not read a translation. */
  async expectSectionUnit(index: number, unit: "exercises" | "minutes") {
    await expect(
      this.section(index).getByTestId("section-amount"),
    ).toHaveAttribute("data-unit", unit);
  }

  async moveSectionUp(index: number) {
    await this.section(index).getByTestId("section-move-up").click();
  }

  async removeSection(index: number) {
    await this.section(index).getByTestId("section-remove").click();
  }

  async save() {
    await this.page.getByTestId("workout-save").click();
  }

  async expectBuilderClosed() {
    await expect(this.page.getByTestId("workout-builder")).toHaveCount(0);
  }

  async expectError(code: string) {
    await expect(this.page.getByTestId(`workout-error-${code}`)).toBeVisible();
  }
}
