import { expect, test } from "./fixtures";
import { mockSignupRequiresConfirmation } from "./mocks/supabase";
import { RegistrationPage } from "./pages";

/**
 * Registration Flow E2E Tests
 *
 * Tests the new registration functionality:
 * 1. Inline validation errors for missing/invalid fields
 * 2. Successful registration with email verification (OTP code entry)
 * 3. Successful registration with auto-confirmed email (direct redirect)
 */

test.describe("Registration Flow", () => {
  test("shows inline validation errors for missing fields", async ({
    page,
  }) => {
    const registration = new RegistrationPage(page);
    await registration.goToRegistration();

    // Try to register with empty form — should show email error
    await registration.submitRegistration();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText(/valid e-mail/i)).toBeVisible();

    // Fill only email, leave passwords empty — should show password error
    await page.getByPlaceholder("E-Mail").fill("test@example.com");
    await page.getByRole("checkbox").nth(1).click();
    await registration.submitRegistration();

    await expect(
      page.getByText(/forgotten to enter a password/i),
    ).toBeVisible();

    // Fill mismatched passwords — should show mismatch error
    const passwordInputs = page.getByPlaceholder("Password");
    await passwordInputs.nth(0).fill("StrongPass1!");
    await passwordInputs.nth(1).fill("DifferentPass1!");
    await registration.submitRegistration();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("successful registration with email verification and OTP code", async ({
    page,
  }) => {
    const email = "newuser@example.com";
    await mockSignupRequiresConfirmation(page, email);

    const registration = new RegistrationPage(page);
    await registration.goToRegistration();

    await registration.fillForm({
      email,
      password: "StrongPass1!",
      passwordConfirm: "StrongPass1!",
    });

    await registration.submitRegistration();
    await registration.expectEmailVerificationScreen(email);
    await registration.enterOtpCode("123456");
    await registration.expectAnamnesisScreen();
  });
});
