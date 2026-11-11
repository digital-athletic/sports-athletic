import { expect, test } from "./fixtures";
import { mockOtpFlow } from "./mocks/supabase";
import { RegistrationPage } from "./pages";

/**
 * Registration Flow E2E Tests
 *
 * Tests the passwordless OTP registration:
 * 1. Inline validation errors for missing/invalid fields
 * 2. Successful registration with OTP code verification
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
    await expect(page.getByText(/e-mail address is not valid/i)).toBeVisible();

    // Fill email but don't accept privacy — should show privacy error
    await page.getByPlaceholder("E-Mail").fill("test@example.com");
    await registration.submitRegistration();

    await expect(
      page.getByRole("alert").filter({ hasText: /agree to the terms/i }),
    ).toBeVisible();

    // Accept privacy but not analytics — should show analytics error
    await page.getByRole("checkbox").nth(0).click();
    await registration.submitRegistration();

    await expect(
      page.getByRole("alert").filter({ hasText: /box for usage data/i }),
    ).toBeVisible();
  });

  test("successful registration with OTP code verification", async ({
    page,
  }) => {
    const email = "newuser@example.com";
    await mockOtpFlow(page, email);

    const registration = new RegistrationPage(page);
    await registration.goToRegistration();

    await registration.fillForm({ email });

    await registration.submitRegistration();
    await registration.expectEmailVerificationScreen(email);
    await registration.enterOtpCode("123456");
    await registration.expectAnamnesisScreen();
  });
});

test.describe("Login screen in German", () => {
  test.use({ locale: "de-DE" });

  test("an athlete who taps Registrieren reaches the registration flow", async ({
    page,
  }) => {
    await page.goto("/");

    const loginButton = page.getByRole("button", {
      name: "Anmelden",
      exact: true,
    });
    const registerButton = page.getByRole("button", {
      name: "Registrieren",
      exact: true,
    });
    await expect(loginButton).toBeVisible({ timeout: 5000 });
    await expect(registerButton).toBeVisible();

    const loginBox = await loginButton.boundingBox();
    const registerBox = await registerButton.boundingBox();
    expect(registerBox?.width).toBe(loginBox?.width);
    expect(registerBox?.height).toBe(loginBox?.height);
    expect(registerBox?.y).toBeGreaterThan(loginBox?.y ?? Infinity);

    await registerButton.click();

    await expect(
      page.getByText("Registrierung", { exact: true }),
    ).toBeVisible();
  });
});
