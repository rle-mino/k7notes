import { test, expect } from "../../fixtures/auth";

/**
 * Language switching tests.
 * Tests that users can change the app language via settings
 * and that the preference persists across reloads.
 *
 * DOM context: The settings page has a sidebar nav with "Settings" label,
 * a page heading <h1>, and setting rows with label + value text.
 * The language picker modal overlays on top. We use getByRole('heading')
 * for the page title and exact text matching with .first()/.nth() where
 * needed to disambiguate duplicate text across settings rows and modals.
 */

test.describe("Language Settings", () => {
  test.beforeEach(async ({ auth }) => {
    // Sign up a fresh user for each test
    await auth.goToSignup();
    await auth.signup();
    await auth.goToSettings();
  });

  test("default language is English", async ({ page }) => {
    // Settings page should display English labels
    await expect(page.getByText("Account", { exact: true })).toBeVisible();
    await expect(page.getByText("Preferences", { exact: true })).toBeVisible();
    // The Language row value should show "English"
    await expect(page.getByText("English", { exact: true })).toBeVisible();
  });

  test("language picker shows options with current selection", async ({
    page,
  }) => {
    // Click the Language setting row (exact match to avoid "Transcription Language")
    await page.getByText("Language", { exact: true }).click();

    // Picker modal should show Français option (English appears twice: settings row + modal)
    await expect(page.getByText("Français", { exact: true })).toBeVisible();
    // Verify there are now two "English" texts (settings value + modal option)
    await expect(page.getByText("English", { exact: true })).toHaveCount(2);
  });

  test("switching to French updates settings strings", async ({ page }) => {
    // Open language picker
    await page.getByText("Language", { exact: true }).click();

    // Select Français
    await page.getByText("Français", { exact: true }).click();

    // Wait for the UI to update
    await page.waitForTimeout(500);

    // Settings page heading should now be in French
    await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();
    await expect(page.getByText("Compte", { exact: true })).toBeVisible();
    await expect(page.getByText("Langue", { exact: true })).toBeVisible();
  });

  test("switching back to English reverts strings", async ({ page }) => {
    // Switch to French first
    await page.getByText("Language", { exact: true }).click();
    await page.getByText("Français", { exact: true }).click();
    await page.waitForTimeout(500);

    // Verify French heading
    await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();

    // Switch back to English — "Langue" is the label in French (exact to avoid "Langue de transcription")
    await page.getByText("Langue", { exact: true }).click();
    await page.getByText("English", { exact: true }).click();
    await page.waitForTimeout(500);

    // Verify English
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText("Account", { exact: true })).toBeVisible();
  });

  test("language preference persists after reload", async ({ page }) => {
    // Switch to French
    await page.getByText("Language", { exact: true }).click();
    await page.getByText("Français", { exact: true }).click();
    await page.waitForTimeout(1000);

    // Verify French
    await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForTimeout(2000);

    // Language should still be French after reload
    await expect(page.getByRole("heading", { name: "Paramètres" })).toBeVisible();
    await expect(page.getByText("Compte", { exact: true })).toBeVisible();
    await expect(page.getByText("Langue", { exact: true })).toBeVisible();
  });
});
