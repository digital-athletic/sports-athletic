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
