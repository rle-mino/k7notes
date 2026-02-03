import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * Login flow tests.
 * Tests the sign in process through the web UI.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 */

test.describe("Login Flow", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.goToLogin();
  });

  test("can navigate to login page", async ({ page }) => {
    await expect(page.getByText("K7Notes")).toBeVisible();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });

  test("displays all required form fields", async ({ page }) => {
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(getRNButton(page, "Sign In")).toBeVisible();
    await expect(getRNButton(page, "Sign in with Google")).toBeVisible();
  });

  test("can login with valid credentials", async ({ auth, page }) => {
    // First create an account
    await auth.goToSignup();
    const credentials = await auth.signup();

    // Logout
    await auth.logout();

    // Now login with those credentials
    await auth.goToLogin();
    await page.getByPlaceholder("Email").fill(credentials.email);
    await page.getByPlaceholder("Password").fill(credentials.password);
    await getRNButton(page, "Sign In").click();

    // Should navigate to notes page after successful login
    await expect(page).toHaveURL(/.*notes.*/);
  });

  test("shows error for empty fields", async ({ page }) => {
    // Click sign in without filling fields
    await getRNButton(page, "Sign In").click();

    // Wait for error handling
    await page.waitForTimeout(500);

    // Should stay on login page
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("shows error for empty email only", async ({ page }) => {
    await page.getByPlaceholder("Password").fill("somepassword123");
    await getRNButton(page, "Sign In").click();

    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("shows error for empty password only", async ({ page }) => {
    await page.getByPlaceholder("Email").fill("test@example.com");
    await getRNButton(page, "Sign In").click();

    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByPlaceholder("Email").fill("nonexistent@example.com");
    await page.getByPlaceholder("Password").fill("wrongpassword123");
    await getRNButton(page, "Sign In").click();

    // Wait for API response
    await page.waitForTimeout(1500);

    // Should stay on login page due to invalid credentials
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("shows error for wrong password", async ({ auth, page }) => {
    // First create an account
    await auth.goToSignup();
    const credentials = await auth.signup();

    // Logout
    await auth.logout();

    // Try to login with wrong password
    await auth.goToLogin();
    await page.getByPlaceholder("Email").fill(credentials.email);
    await page.getByPlaceholder("Password").fill("wrongpassword!");
    await getRNButton(page, "Sign In").click();

    // Wait for API response
    await page.waitForTimeout(1500);

    // Should stay on login page
    await expect(page).toHaveURL(/.*login.*/);
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.getByPlaceholder("Email").fill("not-an-email");
    await page.getByPlaceholder("Password").fill("somepassword123");
    await getRNButton(page, "Sign In").click();

    await page.waitForTimeout(1000);

    // Should stay on login page
    await expect(page).toHaveURL(/.*login.*/);
  });
});

test.describe("Login Navigation", () => {
  test("can navigate from login to signup page", async ({ auth, page }) => {
    await auth.goToLogin();

    // Click the "Don't have an account? Sign up" link
    await page.getByText("Sign up").click();

    // Should navigate to signup page
    await expect(page).toHaveURL(/.*signup.*/);
    await expect(page.getByText("Sign up to get started")).toBeVisible();
  });

  test("redirects authenticated users away from login", async ({ auth, page }) => {
    // First, sign up to get authenticated
    await auth.goToSignup();
    await auth.signup();

    // Verify we're on notes page
    await expect(page).toHaveURL(/.*notes.*/);

    // Try to navigate back to login
    await page.goto("/login");
    await page.waitForTimeout(1000);

    // Should be redirected away from login (to notes)
    await expect(page).toHaveURL(/.*notes.*/);
  });
});

test.describe("Login Session Persistence", () => {
  test("maintains session after page refresh", async ({ auth, page }) => {
    // Sign up and authenticate
    await auth.goToSignup();
    await auth.signup();

    // Verify on notes page
    await expect(page).toHaveURL(/.*notes.*/);

    // Refresh the page
    await page.reload();
    await page.waitForTimeout(1000);

    // Should still be on notes page (session persisted)
    await expect(page).toHaveURL(/.*notes.*/);
  });

  test("can navigate between protected routes when authenticated", async ({ auth, page }) => {
    // Sign up and authenticate
    await auth.goToSignup();
    await auth.signup();

    // Navigate to notes
    await page.goto("/notes");
    await expect(page).toHaveURL(/.*notes.*/);

    // Navigate to settings
    await page.goto("/settings");
    await expect(page).toHaveURL(/.*settings.*/);

    // Navigate back to notes
    await page.goto("/notes");
    await expect(page).toHaveURL(/.*notes.*/);
  });
});

test.describe("Google Sign In", () => {
  test("displays Google sign in button", async ({ auth, page }) => {
    await auth.goToLogin();
    await expect(getRNButton(page, "Sign in with Google")).toBeVisible();
  });

  // Note: Actual Google OAuth testing would require mocking or test accounts
  // This test just verifies the button exists
  test("Google sign in button exists", async ({ auth, page }) => {
    await auth.goToLogin();
    const googleButton = getRNButton(page, "Sign in with Google");
    await expect(googleButton).toBeVisible();
    // Verify it's interactive (has tabindex)
    await expect(googleButton).toHaveAttribute("tabindex", "0");
  });
});
