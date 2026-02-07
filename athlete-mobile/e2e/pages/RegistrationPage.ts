import { expect, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

interface RegistrationFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  acceptPrivacy?: boolean;
}

export class RegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goToRegistration() {
    await this.page.goto("/");
    await expect(this.page.getByRole("button", { name: "Login" })).toBeVisible({
      timeout: 5000,
    });
    await this.page.getByText(/sign up/i).click();
    await expect(
      this.page.getByText("Registration", { exact: true }),
    ).toBeVisible();
  }

  async fillForm({
    email,
    password,
    passwordConfirm,
    acceptPrivacy = true,
  }: RegistrationFormData) {
    await this.page.getByPlaceholder("E-Mail").fill(email);

    const passwordInputs = this.page.getByPlaceholder("Password");
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(passwordConfirm);

    if (acceptPrivacy) {
      // Click the second checkbox (privacy acceptance — first is analytics)
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
    await expect(this.page.getByText(/let's get started/i)).toBeVisible({
      timeout: 5000,
    });
  }
}
