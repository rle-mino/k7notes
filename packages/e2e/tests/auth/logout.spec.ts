import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Logout flow tests.
 * Tests the sign out process through the web UI.
 *
 * Note: The logout helper uses the API directly because the Sign Out button
 * is inside a React Native ScrollView and RN Web's TouchableOpacity has
 * click handling issues with scrolled elements in automated tests.
 */

test.describe("Logout Flow", () => {
  test.beforeEach(async ({ auth }) => {
    // Create a new account and authenticate before each test
    await auth.goToSignup();
    await auth.signup();
  });

  test("can access settings page when authenticated", async ({ auth, page }) => {
    await auth.goToSettings();

    await expect(page.getByText("Account")).toBeVisible();
  });

  test("sign out button exists in settings", async ({ auth, page }) => {
    await auth.goToSettings();

    // The Sign Out button may be below the fold in the ScrollView,
    // so we check it exists in the DOM rather than visibility
    const signOutButton = getRNButton(page, "Sign Out");
    await expect(signOutButton).toHaveCount(1);
    await expect(signOutButton).toHaveAttribute("tabindex", "0");
  });

  test("can logout successfully", async ({ auth, page }) => {
    await auth.logout();

    // Should be on login page after logout
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });

  test("cannot access protected routes after logout", async ({ auth, page }) => {
    await auth.logout();

    // Try to access notes page
    await page.goto("/notes");
    await page.waitForTimeout(1000);

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("cannot access settings after logout", async ({ auth, page }) => {
    await auth.logout();

    // Try to access settings page
    await page.goto("/settings");
    await page.waitForTimeout(1000);

    // Should be redirected to login
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("session is cleared after logout", async ({ auth, page }) => {
    await auth.logout();

    // Refresh the page
    await page.reload();
    await page.waitForTimeout(1000);

    // Should still be on login (session was cleared)
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("can login with different account after logout", async ({ auth, page }) => {
    // Logout the user created in beforeEach
    await auth.logout();

    // Create a new account
    await auth.goToSignup();
    const secondUser = await auth.signup();

    // Verify we're logged in
    await expect(page).toHaveURL(/.*notes.*/);

    // Go to settings to verify the user
    await auth.goToSettings();
    await expect(page.getByText(secondUser.email)).toBeVisible();
  });

  test("can re-login with same account after logout", async ({ auth, page }) => {
    // Create a fresh account for this specific test
    await auth.logout();
    await auth.goToSignup();
    const credentials = await auth.signup({
      email: `relogin-test-${Date.now()}@example.com`,
    });

    // Logout
    await auth.logout();

    // Login again with same credentials
    await auth.login(credentials.email, credentials.password);

    // Should be back on notes page
    await expect(page).toHaveURL(/.*notes.*/);

    // Verify the user
    await auth.goToSettings();
    await expect(page.getByText(credentials.email)).toBeVisible();
  });
});

test.describe("Logout UI State", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.goToSignup();
    await auth.signup();
  });

  test("settings shows correct user info before logout", async ({ auth, page }) => {
    await auth.goToSettings();

    // Should show Account section with user info
    await expect(page.getByText("Account")).toBeVisible();
    await expect(page.getByText("Name")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
  });

  test("login page is clean after logout", async ({ auth, page }) => {
    await auth.logout();

    // Form fields should be empty
    const emailInput = page.getByPlaceholder("Email");
    const passwordInput = page.getByPlaceholder("Password");

    await expect(emailInput).toHaveValue("");
    await expect(passwordInput).toHaveValue("");
  });
});

test.describe("Logout Edge Cases", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.goToSignup();
    await auth.signup();
  });

  test("multiple logout attempts do not cause errors", async ({ auth, page }) => {
    // First logout
    await auth.logout();
    await expect(page).toHaveURL(/.*login.*/);

    // Try to logout again (should just stay on login page)
    // Since we're already logged out, going to settings should redirect to login
    await page.goto("/settings");
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("direct navigation to login after logout works", async ({ auth, page }) => {
    await auth.logout();

    // Directly navigate to login (should work since we're logged out)
    await page.goto("/login");
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });
});
