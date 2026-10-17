import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

interface RegistrationFormData {
  email: string;
  acceptPrivacy?: boolean;
  acceptAnalytics?: boolean;
}

export class RegistrationPage extends BasePage {
  async goToRegistration() {
    await this.page.goto("/");
    await expect(
      this.page.getByRole("button", { name: "Send code" }),
    ).toBeVisible({
      timeout: 5000,
    });
    await this.page.getByText(/sign up/i).click();
    await expect(
      this.page.getByText("Registration", { exact: true }),
    ).toBeVisible();
  }

  async fillForm({
    email,
    acceptPrivacy = true,
    acceptAnalytics = true,
  }: RegistrationFormData) {
    await this.page.getByPlaceholder("E-Mail").fill(email);

    if (acceptPrivacy) {
      await this.page.getByRole("checkbox").nth(0).click();
    }

    if (acceptAnalytics) {
      await this.page.getByRole("checkbox").nth(1).click();
    }
  }

  async submitRegistration() {
    await this.page.getByRole("button", { name: "Register" }).click();
  }

  async expectEmailVerificationScreen(email: string) {
    await expect(
      this.page.getByText("Confirm your email", { exact: true }),
    ).toBeVisible({ timeout: 5000 });
    await expect(this.page.getByText(email)).toBeVisible();
  }

  async enterOtpCode(code: string) {
    await this.page.getByRole("textbox").fill(code);
    await this.page.getByRole("button", { name: "Verify" }).click();
  }

  async expectAnamnesisScreen() {
    await expect(
      this.page.getByRole("button", { name: "Get started" }),
    ).toBeVisible({ timeout: 5000 });
  }
}
