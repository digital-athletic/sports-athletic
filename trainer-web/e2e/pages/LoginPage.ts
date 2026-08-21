import { type Page, expect } from "@playwright/test";

export class LoginPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/login");
  }

  /** Walks the two step flow: request a code, then redeem it. */
  async signIn(email: string, otp = "123456") {
    await this.page.getByTestId("login-email").fill(email);
    await this.page.getByTestId("login-send-code").click();

    const otpField = this.page.getByTestId("login-otp");
    await expect(otpField).toBeVisible();
    await otpField.fill(otp);
    await this.page.getByTestId("login-verify").click();
  }

  async expectOtpStep() {
    await expect(this.page.getByTestId("login-otp")).toBeVisible();
  }
}
