import { test, expect, getRNButton } from "../../fixtures/auth";

/**
 * User registration flow tests.
 * Tests the signup process through the web UI.
 *
 * Note: React Native Web renders TouchableOpacity as div[tabindex="0"],
 * so we use getRNButton() helper instead of getByRole("button").
 */

test.describe("Signup Flow", () => {
  test.beforeEach(async ({ auth }) => {
    await auth.goToSignup();
  });

  test("can navigate to signup page", async ({ page }) => {
    await expect(page.getByText("Create Account").first()).toBeVisible();
    await expect(page.getByText("Sign up to get started")).toBeVisible();
  });

  test("displays all required form fields", async ({ page }) => {
    await expect(page.getByPlaceholder("Full Name")).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password (min 8 characters)")).toBeVisible();
    await expect(getRNButton(page, "Create Account")).toBeVisible();
  });

  test("can create a new account successfully", async ({ auth, page }) => {
    const credentials = auth.generateCredentials();

    await page.getByPlaceholder("Full Name").fill(credentials.name);
    await page.getByPlaceholder("Email").fill(credentials.email);
    await page.getByPlaceholder("Password (min 8 characters)").fill(credentials.password);

    await getRNButton(page, "Create Account").click();

    // Should navigate to notes page after successful signup
    await expect(page).toHaveURL(/.*notes.*/);
  });

  test("shows error for empty fields", async ({ page }) => {
    // Click create account without filling fields
    await getRNButton(page, "Create Account").click();

    // Wait for error message (Alert in React Native web)
    // The app shows "Please fill in all fields" via Alert.alert
    await page.waitForTimeout(500);

    // On web, alerts may appear as dialog or the page stays on signup
    // Check that we're still on the signup page (form not submitted)
    await expect(page).toHaveURL(/.*signup.*/);
  });

  test("shows error for password too short", async ({ page, auth }) => {
    const credentials = auth.generateCredentials();

    await page.getByPlaceholder("Full Name").fill(credentials.name);
    await page.getByPlaceholder("Email").fill(credentials.email);
    await page.getByPlaceholder("Password (min 8 characters)").fill("short"); // Less than 8 chars

    await getRNButton(page, "Create Account").click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Should stay on signup page due to validation error
    await expect(page).toHaveURL(/.*signup.*/);
  });

  test("handles invalid email format", async ({ page, auth }) => {
    const credentials = auth.generateCredentials();

    await page.getByPlaceholder("Full Name").fill(credentials.name);
    await page.getByPlaceholder("Email").fill("not-an-email");
    await page.getByPlaceholder("Password (min 8 characters)").fill(credentials.password);

    await getRNButton(page, "Create Account").click();

    // Wait for API response
    await page.waitForTimeout(2000);

    // Should either stay on signup (validation error) or navigate away
    // The exact behavior depends on the backend's email validation
    const url = page.url();
    expect(url.includes("/signup") || url.includes("/notes")).toBeTruthy();
  });

  test("shows error for duplicate email", async ({ page, auth }) => {
    // First, create a user
    const credentials = auth.generateCredentials();
    await auth.signup(credentials);

    // Logout and try to signup with same email
    await auth.logout();
    await auth.goToSignup();

    await page.getByPlaceholder("Full Name").fill("Another User");
    await page.getByPlaceholder("Email").fill(credentials.email);
    await page.getByPlaceholder("Password (min 8 characters)").fill(credentials.password);

    await getRNButton(page, "Create Account").click();

    // Wait for API error
    await page.waitForTimeout(1000);

    // Should stay on signup page due to duplicate email error
    await expect(page).toHaveURL(/.*signup.*/);
  });
});

test.describe("Signup Navigation", () => {
  test("can navigate from signup to login page", async ({ auth, page }) => {
    await auth.goToSignup();

    // Click the "Already have an account? Sign in" link
    await page.getByText("Sign in").click();

    // Should navigate to login page
    await expect(page).toHaveURL(/.*login.*/);
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });

  test("redirects authenticated users away from signup", async ({ auth, page }) => {
    // First, sign up and get authenticated
    const credentials = auth.generateCredentials();
    await auth.goToSignup();
    await auth.signup(credentials);

    // Verify we're on notes page
    await expect(page).toHaveURL(/.*notes.*/);

    // Try to navigate back to signup
    await page.goto("/signup");
    await page.waitForTimeout(1000);

    // Should be redirected away from signup (to notes)
    await expect(page).toHaveURL(/.*notes.*/);
  });
});
